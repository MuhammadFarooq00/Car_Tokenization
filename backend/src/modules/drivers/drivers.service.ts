import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { ApplyDriverDto } from './dto/apply-driver.dto';
import type { LogRideDto } from './dto/log-ride.dto';
import type { SubmitExpenseDto } from './dto/submit-expense.dto';
import type { ExpenseType } from '@prisma/client';
import { paginate } from '../../shared/utils/index';

const COMMISSION_RATE = 0.25; // 25% commission

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async applyAsDriver(userId: string, dto: ApplyDriverDto) {
    const existing = await this.prisma.driverApplication.findFirst({
      where: { userId, carId: dto.carId, status: 'pending' },
    });
    if (existing) {
      throw new BadRequestException('You already have a pending application for this car');
    }

    const application = await this.prisma.driverApplication.create({
      data: {
        userId,
        carId: dto.carId,
        license: dto.license,
        experience: dto.experience,
        documents: dto.documents,
      },
    });

    // Fetch car + applicant name for notification messages
    const [car, applicant] = await Promise.all([
      this.prisma.car.findUnique({
        where: { id: dto.carId },
        select: { ownerId: true, name: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
    ]);

    // Notify the driver that their application was submitted successfully
    await this.notifications.send(
      userId,
      'Application Submitted',
      `Your application to drive "${car?.name ?? 'the car'}" has been submitted successfully. The car owner will review it shortly.`,
      'info',
    );

    // Notify the car owner that a new driver application arrived
    if (car && car.ownerId !== userId) {
      await this.notifications.send(
        car.ownerId,
        'New Driver Application',
        `${applicant?.name ?? 'A driver'} has applied to drive your car "${car.name}". Review the application in your dashboard.`,
        'info',
      );
    }

    return application;
  }

  async getMyApplications(userId: string) {
    const applications = await this.prisma.driverApplication.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });

    // Manually join car info since DriverApplication.carId has no relation
    const carIds = [...new Set(applications.map((a) => a.carId))];
    const cars = carIds.length
      ? await this.prisma.car.findMany({
          where: { id: { in: carIds } },
          select: { id: true, name: true, make: true, model: true, year: true, metadataCID: true },
        })
      : [];
    const carMap = new Map(cars.map((c) => [c.id, c]));

    return applications.map((app) => ({
      ...app,
      car: carMap.get(app.carId) ?? null,
    }));
  }

  // ─── OWNER: view applications for my cars ─────────────────────────

  async getApplicationsForMyCars(ownerId: string, page = 1, limit = 20) {
    // Get all car IDs owned by this user
    const myCars = await this.prisma.car.findMany({
      where: { ownerId },
      select: { id: true, name: true, make: true, model: true, year: true, metadataCID: true },
    });
    const myCarIds = myCars.map((c) => c.id);

    if (myCarIds.length === 0) return paginate([], 0, page, limit);

    const where = { carId: { in: myCarIds } };
    const [applications, total] = await Promise.all([
      this.prisma.driverApplication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      }),
      this.prisma.driverApplication.count({ where }),
    ]);

    const carMap = new Map(myCars.map((c) => [c.id, c]));
    const enriched = applications.map((app) => ({
      ...app,
      car: carMap.get(app.carId) ?? null,
    }));

    return paginate(enriched, total, page, limit);
  }

  // ─── OWNER: approve / reject a driver application ─────────────────

  async reviewApplicationAsOwner(
    ownerId: string,
    applicationId: string,
    status: 'approved' | 'rejected',
    reviewNote?: string,
  ) {
    const application = await this.prisma.driverApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) throw new NotFoundException('Application not found');

    // Ensure the owner actually owns this car
    const car = await this.prisma.car.findUnique({
      where: { id: application.carId },
      select: { ownerId: true, name: true },
    });
    if (!car || car.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this car');
    }

    if (application.status !== 'pending') {
      throw new BadRequestException('This application has already been reviewed');
    }

    const updated = await this.prisma.driverApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewNote,
        reviewedAt: new Date(),
      },
    });

    if (status === 'approved') {
      // Create or update driver profile & assign car
      await this.prisma.driverProfile.upsert({
        where: { userId: application.userId },
        create: {
          userId: application.userId,
          license: application.license,
          experience: application.experience,
          approved: true,
          assignedCarId: application.carId,
        },
        update: {
          approved: true,
          assignedCarId: application.carId,
        },
      });

      // Add 'driver' role if not already present
      const user = await this.prisma.user.findUnique({ where: { id: application.userId } });
      if (user && !user.roles.includes('driver')) {
        await this.prisma.user.update({
          where: { id: application.userId },
          data: { roles: { push: 'driver' } },
        });
      }

      await this.notifications.send(
        application.userId,
        'Driver Application Approved',
        `Your application to drive "${car.name}" has been approved! You can now start driving.`,
        'success',
      );

      // Notify all investors (shareholders) of this car that a driver has been assigned
      const shareholders = await this.prisma.shareHolding.findMany({
        where: { carId: application.carId, shares: { gt: 0 }, userId: { not: application.userId } },
        select: { userId: true },
      });
      const driverUser = await this.prisma.user.findUnique({
        where: { id: application.userId },
        select: { name: true },
      });

      // Notify the car owner that they approved the application
      await this.notifications.send(
        ownerId,
        'Driver Application Approved',
        `You approved ${driverUser?.name ?? 'a driver'}'s application for "${car.name}". They can now start driving.`,
        'success',
      );

      await Promise.all(
        shareholders.map((s) =>
          this.notifications.send(
            s.userId,
            'Driver Assigned to Your Car',
            `${driverUser?.name ?? 'A driver'} has been assigned to "${car.name}", a car you invested in. Operations may begin soon.`,
            'info',
          ),
        ),
      );
    } else {
      const driverUser = await this.prisma.user.findUnique({
        where: { id: application.userId },
        select: { name: true },
      });

      // Notify the driver their application was rejected
      await this.notifications.send(
        application.userId,
        'Driver Application Rejected',
        reviewNote
          ? `Your application to drive "${car.name}" was rejected: ${reviewNote}`
          : `Your application to drive "${car.name}" was rejected.`,
        'error',
      );

      // Notify the car owner that they rejected the application
      await this.notifications.send(
        ownerId,
        'Driver Application Rejected',
        `You rejected ${driverUser?.name ?? 'a driver'}'s application for "${car.name}".`,
        'warning',
      );
    }

    return updated;
  }

  async getDriverStats(userId: string) {
    const now = new Date();

    // Start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Start of current week (Monday)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    // Start of today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [monthRides, weekRides, todayRides] = await Promise.all([
      this.prisma.ride.findMany({
        where: { driverId: userId, timestamp: { gte: monthStart } },
        select: { grossEarnings: true, duration: true },
      }),
      this.prisma.ride.findMany({
        where: { driverId: userId, timestamp: { gte: weekStart } },
        select: { duration: true },
      }),
      this.prisma.ride.findMany({
        where: { driverId: userId, timestamp: { gte: todayStart } },
        select: { grossEarnings: true },
      }),
    ]);

    const monthEarnings = monthRides
      .reduce((s, r) => s + BigInt(r.grossEarnings || '0'), 0n)
      .toString();

    const weekDurationMin = weekRides.reduce((s, r) => s + (r.duration || 0), 0);
    const weekHours = parseFloat((weekDurationMin / 60).toFixed(1));

    const todayEarnings = todayRides
      .reduce((s, r) => s + BigInt(r.grossEarnings || '0'), 0n)
      .toString();

    return {
      monthEarnings,
      monthRides: monthRides.length,
      weekHours,
      todayEarnings,
    };
  }

  async getDriverProfile(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        assignedCar: { select: { id: true, name: true, make: true, model: true } },
      },
    });
    if (!profile) throw new NotFoundException('Driver profile not found');
    return profile;
  }

  async logRide(userId: string, dto: LogRideDto) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (!profile || !profile.approved) {
      throw new BadRequestException('You are not an approved driver');
    }
    if (profile.assignedCarId !== dto.carId) {
      throw new BadRequestException('You are not assigned to this car');
    }

    // Fetch car once — check sale gate and get owner for notification
    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
      select: { primarySaleActive: true, name: true, ownerId: true },
    });
    if (car?.primarySaleActive) {
      throw new BadRequestException(
        `"${car.name}" is not cleared for road operations yet. The car owner must close the public share sale before rides can be logged.`,
      );
    }

    const gross = BigInt(dto.grossEarnings);
    const commission = (gross * BigInt(Math.round(COMMISSION_RATE * 100))) / 100n;
    const net = gross - commission;

    const ride = await this.prisma.ride.create({
      data: {
        carId: dto.carId,
        driverId: userId,
        pickup: dto.pickup,
        dropoff: dto.dropoff,
        distance: dto.distance,
        duration: dto.duration,
        grossEarnings: gross.toString(),
        commission: commission.toString(),
        netEarnings: net.toString(),
      },
    });

    // Update driver stats
    await this.prisma.driverProfile.update({
      where: { userId },
      data: {
        totalRides: { increment: 1 },
      },
    });

    const weiToEthFn = (wei: string) => (Number(BigInt(wei)) / 1e18).toFixed(4);

    // Notify car owner of new ride
    if (car && car.ownerId !== userId) {
      await this.notifications.send(
        car.ownerId,
        'New Ride Logged',
        `A new ride was logged for "${car.name}": ${dto.pickup} → ${dto.dropoff}. Commission earned: ${weiToEthFn(commission.toString())} ETH.`,
        'info',
      );
    }

    // Notify all investors (shareholders, excluding the owner & driver) about the ride
    if (car) {
      const investors = await this.prisma.shareHolding.findMany({
        where: {
          carId: dto.carId,
          shares: { gt: 0 },
          userId: { notIn: [userId, car.ownerId] },
        },
        select: { userId: true },
      });
      await Promise.all(
        investors.map((inv) =>
          this.notifications.send(
            inv.userId,
            'Ride Completed on Your Car',
            `A ride was just completed on "${car.name}" (${dto.pickup} → ${dto.dropoff}). Your share of the commission is accruing.`,
            'success',
          ),
        ),
      );
    }

    return ride;
  }

  async getRides(userId: string, page = 1, limit = 20) {
    const [rides, total] = await Promise.all([
      this.prisma.ride.findMany({
        where: { driverId: userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          car: { select: { id: true, name: true, make: true, model: true } },
        },
      }),
      this.prisma.ride.count({ where: { driverId: userId } }),
    ]);
    return paginate(rides, total, page, limit);
  }

  async submitExpense(userId: string, dto: SubmitExpenseDto) {
    const expense = await this.prisma.expense.create({
      data: {
        carId: dto.carId,
        submittedById: userId,
        type: dto.type as ExpenseType,
        amount: dto.amount,
        description: dto.description,
        receipt: dto.receipt,
      },
    });

    // Notify car owner of new expense submission
    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
      select: { ownerId: true, name: true },
    });
    if (car && car.ownerId !== userId) {
      const weiToEth = (wei: string) => (Number(BigInt(wei)) / 1e18).toFixed(4);
      await this.notifications.send(
        car.ownerId,
        'New Expense Submitted',
        `A ${dto.type} expense of ${weiToEth(dto.amount)} ETH was submitted for "${car.name}". Review and approve or reject.`,
        'warning',
      );
    }

    return expense;
  }

  async getExpenses(userId: string, page = 1, limit = 20) {
    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where: { submittedById: userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          car: { select: { id: true, name: true } },
        },
      }),
      this.prisma.expense.count({ where: { submittedById: userId } }),
    ]);
    return paginate(expenses, total, page, limit);
  }

  // ─── List all users with the driver role (for owner's assign-driver picker) ─

  async listDriverUsers() {
    const users = await this.prisma.user.findMany({
      where: { roles: { has: 'driver' } },
      select: {
        id: true,
        name: true,
        avatar: true,
        driverProfile: {
          select: {
            id: true,
            approved: true,
            totalRides: true,
            rating: true,
            experience: true,
            assignedCarId: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return users;
  }
}
