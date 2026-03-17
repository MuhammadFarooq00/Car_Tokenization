import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EarningsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEarningsSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (!user) return null;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    let totalEarnings = 0n;
    let thisMonth = 0n;
    let lastMonth = 0n;
    let pendingPayout = 0n;

    // Role-specific detailed breakdown
    const byRole: Record<string, unknown> = {};

    // Investor earnings (dividends)
    if (user.roles.includes('investor')) {
      const [allDividends, thisMonthDividends, lastMonthDividends, pendingDividends] = await Promise.all([
        this.prisma.dividend.findMany({
          where: { investorId: userId, status: 'completed' },
          select: { amount: true },
        }),
        this.prisma.dividend.findMany({
          where: { investorId: userId, status: 'completed', createdAt: { gte: thisMonthStart } },
          select: { amount: true },
        }),
        this.prisma.dividend.findMany({
          where: { investorId: userId, status: 'completed', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
          select: { amount: true },
        }),
        this.prisma.dividend.findMany({
          where: { investorId: userId, status: 'pending' },
          select: { amount: true },
        }),
      ]);

      const total = allDividends.reduce((sum, d) => sum + BigInt(d.amount), 0n);
      const thisM = thisMonthDividends.reduce((sum, d) => sum + BigInt(d.amount), 0n);
      const lastM = lastMonthDividends.reduce((sum, d) => sum + BigInt(d.amount), 0n);
      const pending = pendingDividends.reduce((sum, d) => sum + BigInt(d.amount), 0n);

      totalEarnings += total;
      thisMonth += thisM;
      lastMonth += lastM;
      pendingPayout += pending;

      byRole['investor'] = {
        totalDividends: total.toString(),
        dividendCount: allDividends.length,
      };
    }

    // Driver earnings (rides - commission)
    if (user.roles.includes('driver')) {
      const [allRides, thisMonthRides, lastMonthRides] = await Promise.all([
        this.prisma.ride.findMany({
          where: { driverId: userId, status: 'completed' },
          select: { netEarnings: true, grossEarnings: true, commission: true },
        }),
        this.prisma.ride.findMany({
          where: { driverId: userId, status: 'completed', timestamp: { gte: thisMonthStart } },
          select: { netEarnings: true },
        }),
        this.prisma.ride.findMany({
          where: { driverId: userId, status: 'completed', timestamp: { gte: lastMonthStart, lte: lastMonthEnd } },
          select: { netEarnings: true },
        }),
      ]);

      const totalNet = allRides.reduce((sum, r) => sum + BigInt(r.netEarnings), 0n);
      const totalGross = allRides.reduce((sum, r) => sum + BigInt(r.grossEarnings), 0n);
      const totalCommission = allRides.reduce((sum, r) => sum + BigInt(r.commission), 0n);
      const thisM = thisMonthRides.reduce((sum, r) => sum + BigInt(r.netEarnings), 0n);
      const lastM = lastMonthRides.reduce((sum, r) => sum + BigInt(r.netEarnings), 0n);

      totalEarnings += totalNet;
      thisMonth += thisM;
      lastMonth += lastM;

      byRole['driver'] = {
        totalNetEarnings: totalNet.toString(),
        totalGrossEarnings: totalGross.toString(),
        totalCommission: totalCommission.toString(),
        rideCount: allRides.length,
      };
    }

    // Car owner earnings (from rides on their cars)
    if (user.roles.includes('car_owner')) {
      const ownedCars = await this.prisma.car.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const carIds = ownedCars.map((c) => c.id);

      if (carIds.length > 0) {
        const [allRides, thisMonthRides, lastMonthRides, expenses] = await Promise.all([
          this.prisma.ride.findMany({
            where: { carId: { in: carIds }, status: 'completed' },
            select: { commission: true, grossEarnings: true },
          }),
          this.prisma.ride.findMany({
            where: { carId: { in: carIds }, status: 'completed', timestamp: { gte: thisMonthStart } },
            select: { commission: true },
          }),
          this.prisma.ride.findMany({
            where: { carId: { in: carIds }, status: 'completed', timestamp: { gte: lastMonthStart, lte: lastMonthEnd } },
            select: { commission: true },
          }),
          this.prisma.expense.findMany({
            where: { carId: { in: carIds }, status: 'approved' },
            select: { amount: true },
          }),
        ]);

        const totalCommission = allRides.reduce((sum, r) => sum + BigInt(r.commission), 0n);
        const totalGross = allRides.reduce((sum, r) => sum + BigInt(r.grossEarnings), 0n);
        const totalExpenses = expenses.reduce((sum, e) => sum + BigInt(e.amount), 0n);
        const thisM = thisMonthRides.reduce((sum, r) => sum + BigInt(r.commission), 0n);
        const lastM = lastMonthRides.reduce((sum, r) => sum + BigInt(r.commission), 0n);

        totalEarnings += totalCommission;
        thisMonth += thisM;
        lastMonth += lastM;

        byRole['car_owner'] = {
          totalCommission: totalCommission.toString(),
          totalGrossEarnings: totalGross.toString(),
          totalExpenses: totalExpenses.toString(),
          rideCount: allRides.length,
          carsOwned: carIds.length,
        };
      }
    }

    // Calculate next payout date (1st of next month)
    const nextPayoutDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      totalEarnings: totalEarnings.toString(),
      thisMonth: thisMonth.toString(),
      lastMonth: lastMonth.toString(),
      pendingPayout: pendingPayout.toString(),
      nextPayoutDate: nextPayoutDate.toISOString(),
      byRole,
    };
  }

  async getEarningsBreakdown(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const [rides, dividends, expenses] = await Promise.all([
      this.prisma.ride.findMany({
        where: { driverId: userId, timestamp: { gte: startDate } },
        select: { netEarnings: true, grossEarnings: true, timestamp: true },
        orderBy: { timestamp: 'asc' },
      }),
      this.prisma.dividend.findMany({
        where: { investorId: userId, createdAt: { gte: startDate } },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: { submittedById: userId, submittedAt: { gte: startDate }, status: 'approved' },
        select: { amount: true, submittedAt: true },
        orderBy: { submittedAt: 'asc' },
      }),
    ]);

    return { rides, dividends, expenses, period };
  }
}
