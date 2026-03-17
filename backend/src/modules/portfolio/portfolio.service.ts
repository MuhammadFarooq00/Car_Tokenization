import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { paginate } from '../../shared/utils/index';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getHoldings(userId: string) {
    const holdings = await this.prisma.shareHolding.findMany({
      where: { userId, shares: { gt: 0 } },
      include: {
        car: {
          select: {
            id: true, name: true, make: true, model: true,
            year: true, pricePerShare: true, totalShares: true, metadataCID: true,
            status: true, primarySaleActive: true,
            assignedDriver: {
              select: {
                id: true, approved: true,
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return holdings.map((h) => ({
      car: h.car,
      shares: h.shares,
      value: (BigInt(h.shares) * BigInt(h.car.pricePerShare)).toString(),
    }));
  }

  async getCarHolding(userId: string, carId: number) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      select: {
        id: true, name: true, make: true, model: true,
        year: true, pricePerShare: true, totalShares: true, metadataCID: true,
      },
    });

    if (!car) {
      return { carId, shares: 0, value: '0' };
    }

    const holding = await this.prisma.shareHolding.findUnique({
      where: { userId_carId: { userId, carId } },
    });

    const shares = holding?.shares ?? 0;
    return {
      car,
      shares,
      value: (BigInt(shares) * BigInt(car.pricePerShare)).toString(),
    };
  }

  async getPortfolioSummary(userId: string) {
    const holdings = await this.getHoldings(userId);

    const totalValue = holdings.reduce(
      (sum, h) => sum + BigInt(h.value),
      0n,
    );

    const completedDividends = await this.prisma.dividend.findMany({
      where: { investorId: userId, status: 'completed' },
      select: { amount: true },
    });
    const totalDividendsWei = completedDividends.reduce(
      (sum, d) => sum + BigInt(d.amount),
      0n,
    );

    const recentTransactions = await this.prisma.transaction.findMany({
      where: { userId },
      take: 10,
      orderBy: { timestamp: 'desc' },
    });

    return {
      holdings,
      totalValue: totalValue.toString(),
      totalDividends: totalDividendsWei.toString(),
      totalCarsInvested: holdings.length,
      recentTransactions,
    };
  }

  async getDividendHistory(userId: string, page = 1, limit = 20) {
    const [dividends, total] = await Promise.all([
      this.prisma.dividend.findMany({
        where: { investorId: userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          car: { select: { id: true, name: true, make: true, model: true } },
        },
      }),
      this.prisma.dividend.count({ where: { investorId: userId } }),
    ]);

    return {
      data: dividends,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Investor: per-car revenue stats with all shareholder breakdown ──

  async getCarRevenueForInvestor(userId: string, carId: number) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      select: { id: true, name: true, make: true, model: true, totalShares: true, pricePerShare: true, ownerId: true },
    });
    if (!car) return null;

    const [myHolding, myActiveListings, rides, approvedExpenses, myDividends, allHoldings, allActiveListings] =
      await Promise.all([
        this.prisma.shareHolding.findUnique({
          where: { userId_carId: { userId, carId } },
        }),
        // Shares this user has currently escrowed in active listings for this car
        this.prisma.listing.findMany({
          where: { carId, sellerId: userId, status: 'active' },
          select: { remainingAmount: true },
        }),
        this.prisma.ride.findMany({
          where: { carId, status: 'completed' },
          select: { grossEarnings: true },
        }),
        this.prisma.expense.findMany({
          where: { carId, status: 'approved' },
          select: { amount: true },
        }),
        this.prisma.dividend.findMany({
          where: { carId, investorId: userId },
          select: { amount: true, status: true },
        }),
        this.prisma.shareHolding.findMany({
          where: { carId, shares: { gt: 0 } },
          include: { user: { select: { id: true, name: true, walletAddress: true } } },
          orderBy: { shares: 'desc' },
        }),
        // All active listings for this car — to know total escrowed shares per user
        this.prisma.listing.findMany({
          where: { carId, status: 'active' },
          select: { sellerId: true, remainingAmount: true },
        }),
      ]);

    // My true shares = held in wallet + escrowed in active listings
    const myHeldShares = myHolding?.shares ?? 0;
    const myEscrowedShares = myActiveListings.reduce((s, l) => s + l.remainingAmount, 0);
    const myTrueShares = myHeldShares + myEscrowedShares;

    const ownershipPct = car.totalShares > 0
      ? parseFloat(((myTrueShares / car.totalShares) * 100).toFixed(2))
      : 0;

    // Build per-user escrowed map for allShareholders enrichment
    const escrowByUser = new Map<string, number>();
    for (const l of allActiveListings) {
      escrowByUser.set(l.sellerId, (escrowByUser.get(l.sellerId) ?? 0) + l.remainingAmount);
    }

    const totalCarGross = rides.reduce((s, r) => s + BigInt(r.grossEarnings || '0'), 0n);
    const totalCarExpenses = approvedExpenses.reduce((s, e) => s + BigInt(e.amount), 0n);
    const totalCarNetRevenue = totalCarGross > totalCarExpenses ? totalCarGross - totalCarExpenses : 0n;

    // Earned revenue is based on TRUE shares (held + escrowed).
    // Sellers retain earnings for listed shares until a buyer purchases them.
    const myEarnedRevenue = car.totalShares > 0 && myTrueShares > 0
      ? (totalCarNetRevenue * BigInt(myTrueShares)) / BigInt(car.totalShares)
      : 0n;

    const myClaimedDividends = myDividends
      .filter((d) => d.status === 'completed')
      .reduce((s, d) => s + BigInt(d.amount), 0n);
    const myPendingDividends = myEarnedRevenue > myClaimedDividends
      ? myEarnedRevenue - myClaimedDividends
      : 0n;

    // Build shareholder list — merge held shares with escrowed shares per user
    // Start from ShareHolding records (currently liquid shares)
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
    // Add sellers who have 0 held shares but still have escrowed shares
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

    const allShareholders = Array.from(holderMap.values()).map((h) => {
      const trueShares = h.heldShares + h.escrowedShares;
      const earned = car.totalShares > 0
        ? (totalCarNetRevenue * BigInt(trueShares)) / BigInt(car.totalShares)
        : 0n;
      return {
        userId: h.userId,
        name: h.name,
        walletAddress: h.walletAddress,
        shares: h.heldShares,
        sharesInEscrow: h.escrowedShares,
        trueShares,
        percentage: car.totalShares > 0
          ? parseFloat(((trueShares / car.totalShares) * 100).toFixed(2))
          : 0,
        earnedRevenue: earned.toString(),
        isOwner: h.isOwner,
      };
    }).sort((a, b) => b.trueShares - a.trueShares);

    // Total escrowed shares across all active listings for this car
    const totalEscrowedShares = allActiveListings.reduce((s, l) => s + l.remainingAmount, 0);

    return {
      car,
      myShares: myHeldShares,
      myEscrowedShares,
      myTrueShares,
      totalShares: car.totalShares,
      totalEscrowedShares,
      ownershipPct,
      totalCarNetRevenue: totalCarNetRevenue.toString(),
      myEarnedRevenue: myEarnedRevenue.toString(),
      myClaimedDividends: myClaimedDividends.toString(),
      myPendingDividends: myPendingDividends.toString(),
      allShareholders,
    };
  }

  // ─── Owner: per-car full distribution history grouped by distribution event ──

  async getCarDistributionHistory(carId: number) {
    // Fetch all completed dividends for this car, ordered by paidAt desc
    const dividends = await this.prisma.dividend.findMany({
      where: { carId, status: 'completed' },
      orderBy: { paidAt: 'desc' },
      include: {
        investor: { select: { id: true, name: true, walletAddress: true } },
      },
    });

    // Group by txHash prefix (format: "<txHash>-<userId>") to reconstruct distributions
    const distributionMap = new Map<
      string,
      {
        txHash: string;
        distributedAt: Date;
        totalAmount: string;
        recipients: Array<{
          userId: string;
          name: string;
          walletAddress: string | null;
          amount: string;
        }>;
      }
    >();

    for (const d of dividends) {
      // txHash format: "0x<hash>-<userId>" — extract the base tx hash
      const baseTxHash = d.txHash?.includes('-')
        ? d.txHash.substring(0, d.txHash.lastIndexOf('-'))
        : (d.txHash ?? `event-${d.paidAt?.toISOString()}`);

      if (!distributionMap.has(baseTxHash)) {
        distributionMap.set(baseTxHash, {
          txHash: baseTxHash,
          distributedAt: d.paidAt ?? d.createdAt,
          totalAmount: '0',
          recipients: [],
        });
      }

      const entry = distributionMap.get(baseTxHash)!;
      entry.totalAmount = (BigInt(entry.totalAmount) + BigInt(d.amount)).toString();
      entry.recipients.push({
        userId: d.investorId,
        name: d.investor.name,
        walletAddress: d.investor.walletAddress,
        amount: d.amount,
      });
    }

    // Sort by distributedAt desc and return as array
    const distributions = Array.from(distributionMap.values()).sort(
      (a, b) => b.distributedAt.getTime() - a.distributedAt.getTime(),
    );

    return { carId, distributions };
  }

  // ─── Investor: per-car dividend history (what I received from this car) ──

  async getInvestorCarDividendHistory(userId: string, carId: number) {
    const dividends = await this.prisma.dividend.findMany({
      where: { carId, investorId: userId, status: 'completed' },
      orderBy: { paidAt: 'desc' },
      include: {
        car: { select: { id: true, name: true, make: true, model: true } },
      },
    });

    const totalClaimed = dividends.reduce((s, d) => s + BigInt(d.amount), 0n);

    return {
      carId,
      dividends,
      totalClaimed: totalClaimed.toString(),
    };
  }

  async getActivityHistory(userId: string, page = 1, limit = 20) {
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);

    // Enrich with car names
    const carIds = [...new Set(transactions.map((t) => t.carId))];
    const cars = await this.prisma.car.findMany({
      where: { id: { in: carIds } },
      select: { id: true, name: true, make: true, model: true },
    });
    const carMap = new Map(cars.map((c) => [c.id, c]));

    const data = transactions.map((t) => ({
      ...t,
      car: carMap.get(t.carId) || null,
    }));

    return paginate(data, total, page, limit);
  }
}
