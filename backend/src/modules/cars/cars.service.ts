import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CarStatus } from '@prisma/client';
import type { Address } from 'viem';
import type { CreateCarDto } from './dto/create-car.dto';
import { paginate } from '../../shared/utils/index';

@Injectable()
export class CarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(page = 1, limit = 12, status?: CarStatus) {
    const where = status ? { status } : {};
    const [cars, total] = await Promise.all([
      this.prisma.car.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, walletAddress: true } },
          shareHoldings: { select: { shares: true } },
        },
      }),
      this.prisma.car.count({ where }),
    ]);

    // Compute sharesDistributed (total shares held across all holders) per car
    const enriched = cars.map(({ shareHoldings, ...car }) => ({
      ...car,
      sharesDistributed: shareHoldings.reduce((sum: number, h: { shares: number }) => sum + h.shares, 0),
    }));

    return paginate(enriched, total, page, limit);
  }

  async create(userId: string, dto: CreateCarDto) {
    // Auto-promote user to car_owner role if they don't have it
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && !user.roles.includes('car_owner')) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { roles: [...user.roles, 'car_owner'] },
      });
    }

    return this.prisma.car.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        ownerId: userId,
        name: dto.name,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        vin: dto.vin,
        totalShares: dto.totalShares,
        pricePerShare: dto.pricePerShare,
        metadataCID: dto.metadataCID,
      },
      update: {
        ownerId: userId,
        name: dto.name,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        vin: dto.vin,
        totalShares: dto.totalShares,
        pricePerShare: dto.pricePerShare,
        metadataCID: dto.metadataCID,
      },
      include: {
        owner: { select: { id: true, name: true, walletAddress: true } },
      },
    });
  }

  async findById(id: number) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, walletAddress: true } },
        assignedDriver: {
          include: { user: { select: { id: true, name: true } } },
        },
        shareHoldings: { select: { shares: true } },
      },
    });
    if (!car) throw new NotFoundException('Car not found');

    const { shareHoldings, ...carData } = car;
    const sharesDistributed = shareHoldings.reduce((sum, h) => sum + h.shares, 0);

    let onChainConfig = null;
    try {
      onChainConfig = await this.blockchain.getCarConfig(id);
    } catch {
      // Car may not exist on-chain yet
    }

    return { ...carData, sharesDistributed, onChainConfig };
  }

  async findByOwner(userId: string) {
    const cars = await this.prisma.car.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, walletAddress: true } },
        assignedDriver: {
          include: { user: { select: { id: true, name: true } } },
        },
        shareHoldings: { select: { shares: true } },
      },
    });

    return cars.map(({ shareHoldings, ...car }) => ({
      ...car,
      sharesDistributed: shareHoldings.reduce((sum, h) => sum + h.shares, 0),
    }));
  }

  async getNextCarId() {
    const nextId = await this.blockchain.getNextCarId();
    return { nextCarId: nextId };
  }

  async getOnChainConfig(carId: number) {
    try {
      return await this.blockchain.getCarConfig(carId);
    } catch {
      throw new NotFoundException('Car not found on-chain');
    }
  }

  async getShareBalance(carId: number, address: string) {
    try {
      const balance = await this.blockchain.getBalanceOf(address as Address, carId);
      return { carId, address, balance: balance.toString() };
    } catch {
      throw new NotFoundException('Could not fetch balance');
    }
  }

  async updateStatus(carId: number, status: CarStatus) {
    return this.prisma.car.update({
      where: { id: carId },
      data: { status },
    });
  }

  async updateStatusByOwner(userId: string, carId: number, status: CarStatus) {
    const car = await this.prisma.car.findUnique({ where: { id: carId } });
    if (!car) throw new NotFoundException('Car not found');
    if (car.ownerId !== userId) throw new ForbiddenException('Not the car owner');
    return this.prisma.car.update({
      where: { id: carId },
      data: { status },
    });
  }

  async getCarStats(carId: number) {
    const [rideCount, expenses, dividends] = await Promise.all([
      this.prisma.ride.count({ where: { carId } }),
      this.prisma.expense.findMany({
        where: { carId, status: 'approved' },
        select: { amount: true },
      }),
      this.prisma.dividend.findMany({
        where: { carId, status: 'completed' },
        select: { amount: true },
      }),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + BigInt(e.amount), 0n);
    const totalDividends = dividends.reduce((sum, d) => sum + BigInt(d.amount), 0n);

    return {
      totalRides: rideCount,
      totalExpenses: totalExpenses.toString(),
      totalDividends: totalDividends.toString(),
    };
  }

  // ─── Owner: rides on my cars ─────────────────────────────────────

  async getOwnerCarRides(userId: string, page = 1, limit = 20, carId?: number) {
    const myCars = await this.prisma.car.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const carIds = carId
      ? myCars.filter((c) => c.id === carId).map((c) => c.id)
      : myCars.map((c) => c.id);

    if (carIds.length === 0) return paginate([], 0, page, limit);

    const where = { carId: { in: carIds } };
    const [rides, total] = await Promise.all([
      this.prisma.ride.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          car: { select: { id: true, name: true, make: true, model: true } },
          driver: { select: { id: true, name: true } },
        },
      }),
      this.prisma.ride.count({ where }),
    ]);
    return paginate(rides, total, page, limit);
  }

  // ─── Owner: expenses on my cars ──────────────────────────────────

  async getOwnerCarExpenses(userId: string, page = 1, limit = 20, carId?: number) {
    const myCars = await this.prisma.car.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const carIds = carId
      ? myCars.filter((c) => c.id === carId).map((c) => c.id)
      : myCars.map((c) => c.id);

    if (carIds.length === 0) return paginate([], 0, page, limit);

    const where = { carId: { in: carIds } };
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

  // ─── Owner: submit expense directly (auto-approved, notifies shareholders) ───

  async submitOwnerExpense(
    userId: string,
    dto: { carId: number; type: string; amount: string; description?: string; receipt?: string },
  ) {
    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
      select: { id: true, ownerId: true, name: true },
    });
    if (!car) throw new NotFoundException('Car not found');
    if (car.ownerId !== userId) throw new ForbiddenException('You do not own this car');

    const weiToEth = (wei: string) => {
      try { return (Number(BigInt(wei)) / 1e18).toFixed(4); } catch { return '0'; }
    };

    // Car owner expenses are immediately approved — no approval step required
    const expense = await this.prisma.expense.create({
      data: {
        carId: dto.carId,
        submittedById: userId,
        type: dto.type as import('@prisma/client').ExpenseType,
        amount: dto.amount,
        description: dto.description,
        receipt: dto.receipt,
        status: 'approved',
        approvedAt: new Date(),
      },
    });

    // Notify all shareholders that an expense was logged and immediately deducted
    const shareholders = await this.prisma.shareHolding.findMany({
      where: {
        carId: dto.carId,
        shares: { gt: 0 },
        userId: { not: userId },
      },
      select: { userId: true },
    });

    await Promise.all(
      shareholders.map((s) =>
        this.notifications.send(
          s.userId,
          'Expense Logged for Your Car',
          `The car owner logged a ${dto.type} expense of ${weiToEth(dto.amount)} ETH for "${car.name}". This has been deducted from the undistributed earnings.`,
          'warning',
        ),
      ),
    );

    return expense;
  }

  // ─── Owner: review expense on my car ─────────────────────────────

  async reviewExpenseAsOwner(userId: string, expenseId: string, status: 'approved' | 'rejected') {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        car: { select: { ownerId: true, name: true } },
        submittedBy: { select: { id: true } },
      },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.car.ownerId !== userId) throw new ForbiddenException('You do not own this car');

    const updated = await this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        status,
        approvedAt: status === 'approved' ? new Date() : undefined,
      },
    });

    const weiToEth = (wei: string) => {
      try { return (Number(BigInt(wei)) / 1e18).toFixed(4); } catch { return '0'; }
    };

    // Notify the expense submitter
    if (expense.submittedBy?.id && expense.submittedBy.id !== userId) {
      await this.notifications.send(
        expense.submittedBy.id,
        status === 'approved' ? 'Expense Approved' : 'Expense Rejected',
        status === 'approved'
          ? `Your ${expense.type} expense of ${weiToEth(expense.amount)} ETH for "${expense.car.name}" has been approved by the car owner.`
          : `Your ${expense.type} expense of ${weiToEth(expense.amount)} ETH for "${expense.car.name}" was rejected by the car owner.`,
        status === 'approved' ? 'success' : 'error',
      );
    }

    // When approved, notify all shareholders — approved expenses reduce their undistributed returns
    if (status === 'approved') {
      const shareholders = await this.prisma.shareHolding.findMany({
        where: {
          carId: expense.carId,
          shares: { gt: 0 },
          userId: { notIn: [expense.submittedBy?.id ?? '', userId] },
        },
        select: { userId: true },
      });
      await Promise.all(
        shareholders.map((s) =>
          this.notifications.send(
            s.userId,
            'Expense Approved for Your Car',
            `A ${expense.type} expense of ${weiToEth(expense.amount)} ETH was approved for "${expense.car.name}". This reduces the undistributed earnings for this car.`,
            'warning',
          ),
        ),
      );
    }

    return updated;
  }

  // ─── Owner: count unique shareholders across my cars ──────────────

  async getOwnerShareholders(userId: string) {
    const myCars = await this.prisma.car.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const carIds = myCars.map((c) => c.id);
    if (carIds.length === 0) return { count: 0 };

    const holdings = await this.prisma.shareHolding.findMany({
      where: { carId: { in: carIds }, shares: { gt: 0 } },
      select: { userId: true },
      distinct: ['userId'],
    });

    // Exclude the owner themselves
    const uniqueHolders = holdings.filter((h) => h.userId !== userId);
    return { count: uniqueHolders.length };
  }

  // ─── Per-car: list shareholders with user details ─────────────────

  async getCarShareholders(userId: string, carId: number) {
    const car = await this.prisma.car.findUnique({ where: { id: carId } });
    if (!car) throw new NotFoundException('Car not found');
    if (car.ownerId !== userId) throw new ForbiddenException('Not the car owner');

    const holdings = await this.prisma.shareHolding.findMany({
      where: { carId, shares: { gt: 0 } },
      include: {
        user: { select: { id: true, name: true, walletAddress: true } },
      },
      orderBy: { shares: 'desc' },
    });

    const totalHeld = holdings.reduce((sum, h) => sum + h.shares, 0);

    return {
      carId,
      totalShares: car.totalShares,
      sharesDistributed: totalHeld,
      shareholders: holdings.map((h) => ({
        userId: h.userId,
        name: h.user.name,
        walletAddress: h.user.walletAddress,
        shares: h.shares,
        percentage: car.totalShares > 0
          ? parseFloat(((h.shares / car.totalShares) * 100).toFixed(2))
          : 0,
        isOwner: h.userId === car.ownerId,
      })),
    };
  }

  // ─── Per-car: revenue stats (rides commission - approved expenses) with per-shareholder breakdown ──

  async getCarRevenueStats(userId: string, carId: number) {
    const car = await this.prisma.car.findUnique({ where: { id: carId } });
    if (!car) throw new NotFoundException('Car not found');
    if (car.ownerId !== userId) throw new ForbiddenException('Not the car owner');

    const [rides, approvedExpenses, dividends, allHoldings, activeListings] = await Promise.all([
      this.prisma.ride.findMany({
        where: { carId, status: 'completed' },
        select: { grossEarnings: true, commission: true, netEarnings: true },
      }),
      this.prisma.expense.findMany({
        where: { carId, status: 'approved' },
        select: { amount: true },
      }),
      this.prisma.dividend.findMany({
        where: { carId, status: 'completed' },
        select: { amount: true },
      }),
      this.prisma.shareHolding.findMany({
        where: { carId, shares: { gt: 0 } },
        include: { user: { select: { id: true, name: true, walletAddress: true } } },
        orderBy: { shares: 'desc' },
      }),
      // Active listings — needed to surface escrowed shares per seller
      this.prisma.listing.findMany({
        where: { carId, status: 'active' },
        select: { sellerId: true, remainingAmount: true },
      }),
    ]);

    // Build escrowed-shares-per-user map
    const escrowByUser = new Map<string, number>();
    for (const l of activeListings) {
      escrowByUser.set(l.sellerId, (escrowByUser.get(l.sellerId) ?? 0) + l.remainingAmount);
    }
    const totalEscrowedShares = activeListings.reduce((s, l) => s + l.remainingAmount, 0);

    const totalRidesGross = rides.reduce((sum, r) => sum + BigInt(r.grossEarnings || '0'), 0n);
    const totalApprovedExpenses = approvedExpenses.reduce((sum, e) => sum + BigInt(e.amount), 0n);
    const netCarRevenue = totalRidesGross > totalApprovedExpenses
      ? totalRidesGross - totalApprovedExpenses
      : 0n;
    const totalDistributed = dividends.reduce((sum, d) => sum + BigInt(d.amount), 0n);
    const undistributedRevenue = netCarRevenue > totalDistributed
      ? netCarRevenue - totalDistributed
      : 0n;

    // Build shareholder list — merge held + escrowed shares per user
    const holderMap = new Map<string, { userId: string; name: string; walletAddress: string | null; heldShares: number; escrowedShares: number; isOwner: boolean }>();
    for (const h of allHoldings) {
      holderMap.set(h.userId, {
        userId: h.userId,
        name: h.user.name,
        walletAddress: h.user.walletAddress,
        heldShares: h.shares,
        escrowedShares: escrowByUser.get(h.userId) ?? 0,
        isOwner: h.userId === car.ownerId,
      });
    }
    // Include sellers who have zero held shares but still have escrowed shares
    for (const [sellerId, escrowed] of escrowByUser.entries()) {
      if (!holderMap.has(sellerId)) {
        const sellerUser = await this.prisma.user.findUnique({
          where: { id: sellerId },
          select: { id: true, name: true, walletAddress: true },
        });
        if (sellerUser) {
          holderMap.set(sellerId, {
            userId: sellerId,
            name: sellerUser.name,
            walletAddress: sellerUser.walletAddress,
            heldShares: 0,
            escrowedShares: escrowed,
            isOwner: sellerId === car.ownerId,
          });
        }
      }
    }

    const shareholders = Array.from(holderMap.values()).map((h) => {
      const trueShares = h.heldShares + h.escrowedShares;
      const earnedRevenue = car.totalShares > 0
        ? (netCarRevenue * BigInt(trueShares)) / BigInt(car.totalShares)
        : 0n;
      return {
        userId: h.userId,
        name: h.name,
        walletAddress: h.walletAddress,
        shares: h.heldShares,           // liquid shares (for distribution eligibility)
        sharesInEscrow: h.escrowedShares, // escrowed in active listings
        trueShares,                       // total ownership
        percentage: car.totalShares > 0
          ? parseFloat(((trueShares / car.totalShares) * 100).toFixed(2))
          : 0,
        earnedRevenue: earnedRevenue.toString(),
        isOwner: h.isOwner,
      };
    }).sort((a, b) => b.trueShares - a.trueShares);

    return {
      carId,
      totalRidesGross: totalRidesGross.toString(),
      totalApprovedExpenses: totalApprovedExpenses.toString(),
      netCarRevenue: netCarRevenue.toString(),
      totalRides: rides.length,
      totalDistributed: totalDistributed.toString(),
      undistributedRevenue: undistributedRevenue.toString(),
      totalEscrowedShares,    // total shares currently in active marketplace listings
      shareholders,
    };
  }

  // ─── Per-car: chronological event history (rides + expenses + dividends) ──

  async getCarHistory(userId: string, carId: number) {
    const car = await this.prisma.car.findUnique({ where: { id: carId } });
    if (!car) throw new NotFoundException('Car not found');

    // Allow access to: car owner OR any shareholder (investor) of the car
    const isOwner = car.ownerId === userId;
    if (!isOwner) {
      const holding = await this.prisma.shareHolding.findUnique({
        where: { userId_carId: { userId, carId } },
        select: { shares: true },
      });
      if (!holding || holding.shares <= 0) {
        throw new ForbiddenException('Access denied: you are not the owner or a shareholder of this car');
      }
    }

    const [rides, expenses, dividends] = await Promise.all([
      this.prisma.ride.findMany({
        where: { carId },
        include: { driver: { select: { id: true, name: true } } },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.expense.findMany({
        where: { carId },
        include: { submittedBy: { select: { id: true, name: true } } },
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.dividend.findMany({
        where: { carId },
        include: { investor: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Interleave events sorted by timestamp descending
    const events: Array<Record<string, unknown>> = [
      ...rides.map((r) => ({
        type: 'ride',
        id: r.id,
        pickup: r.pickup,
        dropoff: r.dropoff,
        distance: r.distance,
        duration: r.duration,
        grossEarnings: r.grossEarnings,
        commission: r.commission,
        netEarnings: r.netEarnings,
        status: r.status,
        driverName: r.driver?.name ?? 'Unknown',
        driverId: r.driverId,
        timestamp: r.timestamp,
      })),
      ...expenses.map((e) => ({
        type: 'expense',
        id: e.id,
        expenseType: e.type,
        amount: e.amount,
        description: e.description,
        status: e.status,
        submittedBy: e.submittedBy?.name ?? 'Unknown',
        submittedById: e.submittedById,
        receipt: e.receipt,
        timestamp: e.submittedAt,
      })),
      ...dividends.map((d) => ({
        type: 'dividend',
        id: d.id,
        amount: d.amount,
        investorName: d.investor?.name ?? 'Unknown',
        investorId: d.investorId,
        txHash: d.txHash,
        status: d.status,
        timestamp: d.createdAt,
      })),
    ];

    events.sort((a, b) => {
      const tA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
      const tB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
      return tB - tA;
    });

    const completedRides = rides.filter((r) => r.status === 'completed');
    const approvedExpenses = expenses.filter((e) => e.status === 'approved');
    const totalGross = completedRides.reduce((s, r) => s + BigInt(r.grossEarnings || '0'), 0n);
    const totalExpenses = approvedExpenses.reduce((s, e) => s + BigInt(e.amount), 0n);

    return {
      carId,
      carName: car.name,
      events,
      summary: {
        totalRides: completedRides.length,
        totalExpenses: approvedExpenses.length,
        totalDividends: dividends.length,
        totalGross: totalGross.toString(),
        totalApprovedExpenses: totalExpenses.toString(),
        netRevenue: (totalGross > totalExpenses ? totalGross - totalExpenses : 0n).toString(),
      },
    };
  }

  // ─── Fleet: aggregate revenue stats across all owned cars ──

  async getFleetRevenueStats(userId: string) {
    const myCars = await this.prisma.car.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true },
    });

    if (myCars.length === 0) {
      return {
        totalFleetGross: '0',
        totalFleetExpenses: '0',
        totalFleetNetRevenue: '0',
        totalDistributed: '0',
        undistributed: '0',
        perCar: [],
      };
    }

    const carIds = myCars.map((c) => c.id);

    const [allRides, allExpenses, allDividends] = await Promise.all([
      this.prisma.ride.findMany({
        where: { carId: { in: carIds }, status: 'completed' },
        select: { carId: true, grossEarnings: true },
      }),
      this.prisma.expense.findMany({
        where: { carId: { in: carIds }, status: 'approved' },
        select: { carId: true, amount: true },
      }),
      this.prisma.dividend.findMany({
        where: { carId: { in: carIds }, status: 'completed' },
        select: { carId: true, amount: true },
      }),
    ]);

    const perCar = myCars.map((car) => {
      const rides = allRides.filter((r) => r.carId === car.id);
      const expenses = allExpenses.filter((e) => e.carId === car.id);
      const dividends = allDividends.filter((d) => d.carId === car.id);

      const gross = rides.reduce((s, r) => s + BigInt(r.grossEarnings || '0'), 0n);
      const exp = expenses.reduce((s, e) => s + BigInt(e.amount), 0n);
      const net = gross > exp ? gross - exp : 0n;
      const distributed = dividends.reduce((s, d) => s + BigInt(d.amount), 0n);

      return {
        carId: car.id,
        name: car.name,
        gross: gross.toString(),
        expenses: exp.toString(),
        net: net.toString(),
        distributed: distributed.toString(),
      };
    });

    const totalFleetGross = perCar.reduce((s, c) => s + BigInt(c.gross), 0n);
    const totalFleetExpenses = perCar.reduce((s, c) => s + BigInt(c.expenses), 0n);
    const totalFleetNetRevenue = perCar.reduce((s, c) => s + BigInt(c.net), 0n);
    const totalDistributed = perCar.reduce((s, c) => s + BigInt(c.distributed), 0n);
    const undistributed = totalFleetNetRevenue > totalDistributed
      ? totalFleetNetRevenue - totalDistributed
      : 0n;

    return {
      totalFleetGross: totalFleetGross.toString(),
      totalFleetExpenses: totalFleetExpenses.toString(),
      totalFleetNetRevenue: totalFleetNetRevenue.toString(),
      totalDistributed: totalDistributed.toString(),
      undistributed: undistributed.toString(),
      perCar,
    };
  }

  // ─── Owner: fleet share overview (aggregate stats across all cars) ──

  async getFleetShareOverview(userId: string) {
    const myCars = await this.prisma.car.findMany({
      where: { ownerId: userId },
      select: { id: true, totalShares: true, pricePerShare: true },
    });

    if (myCars.length === 0) {
      return {
        totalSharesFleet: 0,
        sharesDistributed: 0,
        ownerHeldShares: 0,
        totalMarketCap: '0',
        shareRevenue: '0',
      };
    }

    const carIds = myCars.map((c) => c.id);
    const totalSharesFleet = myCars.reduce((sum, c) => sum + c.totalShares, 0);

    // Calculate market cap (sum of totalShares * pricePerShare for each car)
    const totalMarketCap = myCars.reduce(
      (sum, c) => sum + BigInt(c.totalShares) * BigInt(c.pricePerShare),
      0n,
    );

    // Get all holdings for owned cars
    const allHoldings = await this.prisma.shareHolding.findMany({
      where: { carId: { in: carIds }, shares: { gt: 0 } },
      select: { userId: true, shares: true },
    });

    const ownerHeldShares = allHoldings
      .filter((h) => h.userId === userId)
      .reduce((sum, h) => sum + h.shares, 0);

    const investorHeldShares = allHoldings
      .filter((h) => h.userId !== userId)
      .reduce((sum, h) => sum + h.shares, 0);

    // Revenue from share sales (primary purchases + listing fills for this car)
    const transactions = await this.prisma.transaction.findMany({
      where: {
        carId: { in: carIds },
        type: { in: ['primary_purchase', 'listing_filled'] },
      },
      select: { price: true, amount: true },
    });

    const shareRevenue = transactions.reduce(
      (sum, t) => sum + BigInt(t.price),
      0n,
    );

    return {
      totalSharesFleet,
      sharesDistributed: investorHeldShares,
      ownerHeldShares,
      totalMarketCap: totalMarketCap.toString(),
      shareRevenue: shareRevenue.toString(),
    };
  }

  // ─── Owner: manually assign a driver to their car ──────────────────────────

  async assignDriverToCar(ownerId: string, carId: number, driverUserId: string) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      select: { id: true, name: true, ownerId: true },
    });
    if (!car) throw new NotFoundException('Car not found');
    if (car.ownerId !== ownerId) throw new ForbiddenException('You do not own this car');

    // Verify the target user actually has the driver role
    const driverUser = await this.prisma.user.findUnique({
      where: { id: driverUserId },
      select: { id: true, name: true, roles: true },
    });
    if (!driverUser) throw new NotFoundException('User not found');
    if (!driverUser.roles.includes('driver')) {
      throw new ForbiddenException('The selected user does not have the driver role');
    }

    // Unassign any existing driver currently assigned to this car (unique constraint on assignedCarId)
    await this.prisma.driverProfile.updateMany({
      where: { assignedCarId: carId },
      data: { assignedCarId: null },
    });

    // Upsert driver profile — create one if it doesn't exist yet, and set assignedCarId
    await this.prisma.driverProfile.upsert({
      where: { userId: driverUserId },
      create: {
        userId: driverUserId,
        license: '',
        experience: 0,
        approved: true,
        assignedCarId: carId,
      },
      update: {
        approved: true,
        assignedCarId: carId,
      },
    });

    await this.notifications.send(
      driverUserId,
      'You Have Been Assigned as a Driver!',
      `Congratulations! The car owner has assigned you to drive "${car.name}". You can now start logging rides for this vehicle.`,
      'success',
    );

    return { success: true, carId, driverUserId, driverName: driverUser.name };
  }
}
