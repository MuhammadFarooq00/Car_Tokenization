import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string | null;
  walletAddress: string | null;
  kycVerified: boolean;
  joinedAt: Date;
  // Role-specific stats
  totalCars?: number;
  totalRides?: number;
  totalSharesBought?: number;
}

export interface LeaderboardStats {
  totalUsers: number;
  totalCars: number;
  totalRides: number;
  totalTransactions: number;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<LeaderboardStats> {
    const [totalUsers, totalCars, totalRides, totalTransactions] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.car.count(),
        this.prisma.ride.count(),
        this.prisma.transaction.count(),
      ]);
    return { totalUsers, totalCars, totalRides, totalTransactions };
  }

  async getTopInvestors(limit = 10): Promise<LeaderboardEntry[]> {
    // Rank investors by number of share transactions (primary_purchase)
    const investors = await this.prisma.user.findMany({
      where: { roles: { has: 'investor' } },
      include: {
        transactions: {
          where: { type: 'primary_purchase' },
          select: { id: true },
        },
      },
      take: 50,
    });

    return investors
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        walletAddress: u.walletAddress,
        kycVerified: u.kycVerified,
        joinedAt: u.createdAt,
        totalSharesBought: u.transactions.length,
      }))
      .sort((a, b) => b.totalSharesBought - a.totalSharesBought)
      .slice(0, limit);
  }

  async getTopOwners(limit = 10): Promise<LeaderboardEntry[]> {
    // Rank owners by number of cars listed
    const owners = await this.prisma.user.findMany({
      where: { roles: { has: 'car_owner' } },
      include: {
        ownedCars: {
          select: { id: true },
        },
      },
      take: 50,
    });

    return owners
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        walletAddress: u.walletAddress,
        kycVerified: u.kycVerified,
        joinedAt: u.createdAt,
        totalCars: u.ownedCars.length,
      }))
      .sort((a, b) => b.totalCars - a.totalCars)
      .slice(0, limit);
  }

  async getTopDrivers(limit = 10): Promise<LeaderboardEntry[]> {
    // Rank drivers by number of rides completed
    const drivers = await this.prisma.user.findMany({
      where: { roles: { has: 'driver' } },
      include: {
        rides: {
          select: { id: true },
        },
      },
      take: 50,
    });

    return drivers
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        walletAddress: u.walletAddress,
        kycVerified: u.kycVerified,
        joinedAt: u.createdAt,
        totalRides: u.rides.length,
      }))
      .sort((a, b) => b.totalRides - a.totalRides)
      .slice(0, limit);
  }
}
