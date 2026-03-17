import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { UserRole, KYCStatus, ApplicationStatus } from '@prisma/client';
import { paginate } from '../../shared/utils/index';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── USERS ────────────────────────────────────────────────────────

  async getUsers(page = 1, limit = 20) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          walletAddress: true,
          roles: true,
          activeRole: true,
          kycVerified: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);
    return paginate(users, total, page, limit);
  }

  async updateUserRoles(userId: string, roles: UserRole[]) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { roles },
    });
  }

  // ─── KYC ──────────────────────────────────────────────────────────

  async getPendingKYC(page = 1, limit = 20) {
    const where = { status: 'pending' as KYCStatus };
    const [verifications, total] = await Promise.all([
      this.prisma.kYCVerification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, walletAddress: true } },
        },
      }),
      this.prisma.kYCVerification.count({ where }),
    ]);
    return paginate(verifications, total, page, limit);
  }

  async reviewKYC(kycId: string, status: 'verified' | 'rejected', reviewNote?: string) {
    if (status !== 'verified' && status !== 'rejected') {
      throw new BadRequestException('Status must be verified or rejected');
    }

    const kyc = await this.prisma.kYCVerification.findUnique({
      where: { id: kycId },
    });
    if (!kyc) throw new NotFoundException('KYC verification not found');

    const updated = await this.prisma.kYCVerification.update({
      where: { id: kycId },
      data: {
        status: status as KYCStatus,
        reviewNote,
        reviewedAt: new Date(),
      },
    });

    if (status === 'verified') {
      await this.prisma.user.update({
        where: { id: kyc.userId },
        data: { kycVerified: true },
      });
      await this.notifications.send(
        kyc.userId,
        'KYC Verified',
        'Your identity verification has been approved. You now have full platform access.',
        'success',
      );
    } else {
      await this.notifications.send(
        kyc.userId,
        'KYC Rejected',
        reviewNote ? `Your KYC was rejected: ${reviewNote}` : 'Your identity verification was rejected. Please resubmit.',
        'error',
      );
    }

    return updated;
  }

  // ─── DRIVER APPLICATIONS ──────────────────────────────────────────

  async getPendingApplications(page = 1, limit = 20) {
    const where = { status: 'pending' as ApplicationStatus };
    const [applications, total] = await Promise.all([
      this.prisma.driverApplication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.driverApplication.count({ where }),
    ]);
    return paginate(applications, total, page, limit);
  }

  async reviewApplication(
    applicationId: string,
    status: 'approved' | 'rejected',
    reviewNote?: string,
  ) {
    const app = await this.prisma.driverApplication.findUnique({
      where: { id: applicationId },
    });
    if (!app) throw new NotFoundException('Application not found');

    const updated = await this.prisma.driverApplication.update({
      where: { id: applicationId },
      data: {
        status: status as ApplicationStatus,
        reviewNote,
        reviewedAt: new Date(),
      },
    });

    // Fetch car + driver name for notifications
    const [car, driverUser] = await Promise.all([
      this.prisma.car.findUnique({
        where: { id: app.carId },
        select: { name: true, ownerId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: app.userId },
        select: { name: true },
      }),
    ]);

    const carName = car?.name ?? 'the car';

    if (status === 'approved') {
      await this.prisma.driverProfile.upsert({
        where: { userId: app.userId },
        create: {
          userId: app.userId,
          license: app.license,
          experience: app.experience,
          approved: true,
          assignedCarId: app.carId,
        },
        update: {
          approved: true,
          assignedCarId: app.carId,
        },
      });

      const user = await this.prisma.user.findUnique({ where: { id: app.userId } });
      if (user && !user.roles.includes('driver')) {
        await this.prisma.user.update({
          where: { id: app.userId },
          data: { roles: { push: 'driver' } },
        });
      }

      // Notify driver
      await this.notifications.send(
        app.userId,
        'Driver Application Approved',
        `Congratulations! Your application to drive "${carName}" has been approved by the admin. You can now start driving.`,
        'success',
      );

      // Notify car owner
      if (car) {
        await this.notifications.send(
          car.ownerId,
          'Driver Approved for Your Car',
          `Admin has approved ${driverUser?.name ?? 'a driver'}'s application for "${carName}". They can now start driving.`,
          'success',
        );
      }
    } else {
      // Notify driver
      await this.notifications.send(
        app.userId,
        'Driver Application Rejected',
        reviewNote
          ? `Your application to drive "${carName}" was rejected by admin: ${reviewNote}`
          : `Your application to drive "${carName}" was rejected by admin.`,
        'error',
      );

      // Notify car owner
      if (car) {
        await this.notifications.send(
          car.ownerId,
          'Driver Application Rejected',
          `Admin rejected ${driverUser?.name ?? 'a driver'}'s application for "${carName}".`,
          'warning',
        );
      }
    }

    return updated;
  }

  // ─── EXPENSES ─────────────────────────────────────────────────────

  async getPendingExpenses(page = 1, limit = 20) {
    const where = { status: 'pending' as const };
    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          car: { select: { id: true, name: true } },
          submittedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);
    return paginate(expenses, total, page, limit);
  }

  async reviewExpense(expenseId: string, status: 'approved' | 'rejected') {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: { car: { select: { name: true } } },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    const updated = await this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        status,
        approvedAt: status === 'approved' ? new Date() : null,
      },
    });

    const carName = expense.car?.name || `Car #${expense.carId}`;

    // Notify the driver who submitted the expense
    await this.notifications.send(
      expense.submittedById,
      status === 'approved' ? 'Expense Approved' : 'Expense Rejected',
      status === 'approved'
        ? `Your ${expense.type} expense for "${carName}" has been approved.`
        : `Your ${expense.type} expense for "${carName}" was rejected.`,
      status === 'approved' ? 'success' : 'error',
    );

    // When approved, notify all shareholders — approved expenses reduce their undistributed returns
    if (status === 'approved') {
      const weiToEth = (wei: string) => {
        try { return (Number(BigInt(wei)) / 1e18).toFixed(4); } catch { return '0'; }
      };
      const shareholders = await this.prisma.shareHolding.findMany({
        where: { carId: expense.carId, shares: { gt: 0 }, userId: { not: expense.submittedById } },
        select: { userId: true },
      });
      await Promise.all(
        shareholders.map((s) =>
          this.notifications.send(
            s.userId,
            'Expense Approved for Your Car',
            `A ${expense.type} expense of ${weiToEth(expense.amount)} ETH was approved for "${carName}". This reduces the undistributed earnings for this car.`,
            'warning',
          ),
        ),
      );
    }

    return updated;
  }

  // ─── TRANSACTIONS ─────────────────────────────────────────────────

  async getTransactions(page = 1, limit = 20) {
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: { select: { id: true, name: true, walletAddress: true } },
        },
      }),
      this.prisma.transaction.count(),
    ]);
    return paginate(transactions, total, page, limit);
  }

  // ─── CARS ─────────────────────────────────────────────────────────

  async getCars(page = 1, limit = 20) {
    const [cars, total] = await Promise.all([
      this.prisma.car.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, walletAddress: true } },
        },
      }),
      this.prisma.car.count(),
    ]);
    return paginate(cars, total, page, limit);
  }

  // ─── BLOCKCHAIN SYNC ─────────────────────────────────────────────

  async triggerSync() {
    await this.blockchain.indexEvents();
    return { message: 'Blockchain sync completed' };
  }

  // ─── ONBOARDING ROLE REQUESTS ─────────────────────────────────────

  async getPendingOnboardingRequests(page = 1, limit = 20) {
    const where = {
      onboardingCompleted: true,
      pendingRoles: { isEmpty: false },
    };
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          walletAddress: true,
          roles: true,
          pendingRoles: true,
          kycVerified: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(users, total, page, limit);
  }

  async reviewOnboardingRole(
    userId: string,
    role: string,
    decision: 'approved' | 'rejected',
    reviewNote?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.pendingRoles.includes(role)) {
      throw new BadRequestException(`Role "${role}" is not pending for this user`);
    }

    // Remove from pendingRoles regardless of decision
    const remainingPending = user.pendingRoles.filter((r) => r !== role);

    if (decision === 'approved') {
      const newRoles = user.roles.includes(role as UserRole)
        ? user.roles
        : ([...user.roles, role] as UserRole[]);

      await this.prisma.user.update({
        where: { id: userId },
        data: { roles: newRoles, pendingRoles: remainingPending },
      });

      await this.notifications.send(
        userId,
        'Role Request Approved',
        reviewNote
          ? `Your request for the "${role}" role has been approved. ${reviewNote}`
          : `Your request for the "${role}" role has been approved. You now have access to ${role === 'driver' ? 'driver' : 'car owner'} features.`,
        'success',
      );
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { pendingRoles: remainingPending },
      });

      await this.notifications.send(
        userId,
        'Role Request Rejected',
        reviewNote
          ? `Your request for the "${role}" role was rejected: ${reviewNote}`
          : `Your request for the "${role}" role was not approved at this time.`,
        'error',
      );
    }

    return { userId, role, decision, remainingPending };
  }

  // ─── ANALYTICS ────────────────────────────────────────────────────

  async getPlatformAnalytics() {
    const [
      totalUsers,
      totalCars,
      totalRides,
      totalTransactions,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.car.count(),
      this.prisma.ride.count(),
      this.prisma.transaction.count(),
      this.prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    let accumulatedFees = '0';
    try {
      const fees = await this.blockchain.getAccumulatedFees();
      accumulatedFees = fees.toString();
    } catch {
      // Chain might be unavailable
    }

    return {
      totalUsers,
      totalCars,
      totalRides,
      totalTransactions,
      newUsersLast30Days: recentUsers,
      accumulatedPlatformFees: accumulatedFees,
    };
  }
}
