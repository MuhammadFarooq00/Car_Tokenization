import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import type { TransactionType } from '@prisma/client';
import { paginate } from '../../shared/utils/index';

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
  ) {}

  async getActiveListings(page = 1, limit = 12) {
    const where = { status: 'active' as const };
    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: { select: { id: true, name: true, walletAddress: true } },
          car: { select: { id: true, name: true, make: true, model: true, year: true, metadataCID: true, pricePerShare: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    const data = listings.map((l) => ({
      listingId: l.id,
      seller: l.seller.walletAddress || l.seller.name,
      sellerName: l.seller.name,
      carId: l.carId,
      amount: l.remainingAmount,
      pricePerShare: l.pricePerShare,
      active: l.status === 'active',
      car: l.car,
    }));

    return paginate(data, total, page, limit);
  }

  async getListingById(listingId: number) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        seller: { select: { id: true, name: true, walletAddress: true } },
        car: { select: { id: true, name: true, make: true, model: true, year: true, metadataCID: true, pricePerShare: true } },
      },
    });

    if (!listing) {
      // Fallback to blockchain
      const onChain = await this.blockchain.getListing(listingId);
      return {
        listingId,
        seller: onChain.seller as string,
        carId: Number(onChain.carId),
        amount: Number(onChain.amount),
        pricePerShare: onChain.pricePerShare.toString(),
        active: onChain.active,
      };
    }

    return {
      listingId: listing.id,
      seller: listing.seller.walletAddress || listing.seller.name,
      sellerName: listing.seller.name,
      carId: listing.carId,
      amount: listing.remainingAmount,
      pricePerShare: listing.pricePerShare,
      active: listing.status === 'active',
      car: listing.car,
    };
  }

  async calculateCost(listingId: number, amount: number) {
    const result = await this.blockchain.calculateCost(listingId, amount);
    const [baseCost, fee, total] = result as unknown as [bigint, bigint, bigint];
    return {
      listingId,
      amount,
      baseCost: baseCost.toString(),
      fee: fee.toString(),
      total: total.toString(),
    };
  }

  async getNextListingId() {
    const nextId = await this.blockchain.getNextListingId();
    return { nextListingId: nextId };
  }

  async getGlobalFee() {
    const feeBps = await this.blockchain.getGlobalFeeBps();
    return { feeBps, feePercent: feeBps / 100 };
  }

  async getTradeHistory(carId: number, page = 1, limit = 20) {
    const types: TransactionType[] = ['listing_filled', 'primary_purchase'];
    const where = {
      carId,
      type: { in: types },
    };
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: { select: { id: true, name: true, walletAddress: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return paginate(transactions, total, page, limit);
  }

  async getUserTradeHistory(userId: string, page = 1, limit = 20) {
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: { select: { id: true, name: true, walletAddress: true } },
        },
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);
    return paginate(transactions, total, page, limit);
  }

  async getUserListings(userId: string, page = 1, limit = 20) {
    const where = { sellerId: userId, status: 'active' as const };
    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          car: { select: { id: true, name: true, make: true, model: true, year: true, metadataCID: true, pricePerShare: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    const data = listings.map((l) => ({
      listingId: l.id,
      seller: userId,
      carId: l.carId,
      amount: l.remainingAmount,
      pricePerShare: l.pricePerShare,
      active: l.status === 'active',
      car: l.car,
    }));

    return paginate(data, total, page, limit);
  }
}
