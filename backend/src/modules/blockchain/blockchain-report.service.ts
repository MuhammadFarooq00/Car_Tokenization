import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BlockchainService } from './blockchain.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ReportPrimaryPurchaseDto,
  ReportListingCreatedDto,
  ReportListingFilledDto,
  ReportListingCancelledDto,
  ReportCarCreatedDto,
  ReportEarningsDistributedDto,
  ReportPublicSupplyWithdrawnDto,
} from './dto/index';

@Injectable()
export class BlockchainReportService {
  private readonly logger = new Logger(BlockchainReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── CAR CREATED ──────────────────────────────────────────────────────────

  async reportCarCreated(userId: string, dto: ReportCarCreatedDto) {
    const { txHash, carId, totalShares, publicSupply, pricePerShare } = dto;

    // Get block info from on-chain tx receipt
    const { blockNumber, timestamp } = await this.getBlockInfo(txHash);

    // Create owner ShareHolding (totalShares - publicSupply = owner's retained shares)
    const ownerShares = totalShares - publicSupply;
    if (ownerShares > 0) {
      await this.prisma.shareHolding.upsert({
        where: { userId_carId: { userId, carId } },
        create: { userId, carId, shares: ownerShares },
        update: { shares: ownerShares },
      });
    }

    // Store sale tracking fields on Car record (car was registered before this report)
    // primarySaleActive stays true regardless of publicSupply — it is only closed via
    // reportPublicSupplyWithdrawn (owner calls withdrawPublicSupply on-chain)
    const carRecord = await this.prisma.car.update({
      where: { id: carId },
      data: {
        publicSupply,
        remainingPublicSupply: publicSupply,
        sharesSold: 0,
        primarySaleActive: true,
      },
      select: { name: true },
    });

    // Record car_created transaction
    await this.prisma.transaction.upsert({
      where: { txHash },
      create: {
        userId,
        type: 'car_created',
        carId,
        amount: totalShares,
        price: pricePerShare,
        txHash,
        blockNumber,
        timestamp,
      },
      update: {},
    });

    // Notify owner that car is live on-chain
    await this.notifications.send(
      userId,
      'Car Registered On-Chain',
      `"${carRecord.name}" is now live on the blockchain! ${publicSupply > 0 ? `${publicSupply} shares are available for public sale.` : `You hold all ${totalShares} shares.`}`,
      'success',
    );

    this.logger.log(
      `Car created reported: carId=${carId}, ownerShares=${ownerShares}, publicSupply=${publicSupply}`,
    );
    return { success: true, carId, ownerShares, publicSupply };
  }

  // ─── PRIMARY PURCHASE ─────────────────────────────────────────────────────

  async reportPrimaryPurchase(userId: string, dto: ReportPrimaryPurchaseDto) {
    const { txHash, carId, amount, totalCost } = dto;

    const { blockNumber, timestamp } = await this.getBlockInfo(txHash);

    // Record transaction
    await this.prisma.transaction.upsert({
      where: { txHash },
      create: {
        userId,
        type: 'primary_purchase',
        carId,
        amount,
        price: totalCost,
        txHash,
        blockNumber,
        timestamp,
      },
      update: {},
    });

    // Update buyer's ShareHolding
    await this.prisma.shareHolding.upsert({
      where: { userId_carId: { userId, carId } },
      create: { userId, carId, shares: amount },
      update: { shares: { increment: amount } },
    });

    // Keep sale tracking in sync — decrement remainingPublicSupply, increment sharesSold
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      select: { remainingPublicSupply: true, sharesSold: true, name: true, ownerId: true },
    });
    if (car) {
      const newRemaining = Math.max(0, car.remainingPublicSupply - amount);
      // Mirror what the contract does: if all shares are sold, auto-close the sale in DB too
      const allSold = newRemaining === 0;
      await this.prisma.car.update({
        where: { id: carId },
        data: {
          sharesSold: { increment: amount },
          remainingPublicSupply: newRemaining,
          ...(allSold && { primarySaleActive: false }),
        },
      });

      const costEth = this.weiToEth(totalCost);

      // Notify the buyer
      await this.notifications.send(
        userId,
        'Shares Purchased',
        `You successfully bought ${amount} share${amount !== 1 ? 's' : ''} of "${car.name}" for ${costEth} ETH.`,
        'success',
      );

      // Notify the car owner (if different from buyer)
      if (car.ownerId !== userId) {
        await this.notifications.send(
          car.ownerId,
          'Shares Sold',
          `${amount} share${amount !== 1 ? 's' : ''} of "${car.name}" were purchased. ${newRemaining} shares remaining.`,
          'info',
        );
      }
    }

    this.logger.log(`Primary purchase reported: carId=${carId}, amount=${amount}, buyer=${userId}`);
    return { success: true, carId, amount };
  }

  // ─── PUBLIC SUPPLY BURNED ─────────────────────────────────────────────────

  async reportPublicSupplyWithdrawn(userId: string, dto: ReportPublicSupplyWithdrawnDto) {
    const { txHash, carId, amount } = dto;

    // A zero txHash means all shares were sold and the contract auto-closed the sale
    // on the last buyPrimary() call — no burnPublicSupply() tx was needed.
    const isAllSoldSync = txHash === `0x${'0'.repeat(64)}`;

    // Mark primary sale closed.
    // If there were unsold shares (amount > 0), they were BURNED on-chain —
    // reduce totalShares so the DB matches the new circulating supply.
    await this.prisma.car.update({
      where: { id: carId },
      data: {
        remainingPublicSupply: 0,
        primarySaleActive: false,
        // Burned shares reduce totalShares — do NOT add to owner's holding
        ...(amount > 0 && { totalShares: { decrement: amount } }),
      },
    });

    // Burned shares are NOT added to owner's ShareHolding (they no longer exist)

    // Record as a transaction only when there was an actual on-chain tx
    if (!isAllSoldSync) {
      const { blockNumber, timestamp } = await this.getBlockInfo(txHash);
      await this.prisma.transaction.upsert({
        where: { txHash },
        create: {
          userId,
          type: 'car_created', // closest type — no dedicated enum value needed
          carId,
          amount,
          price: '0',
          txHash,
          blockNumber,
          timestamp,
        },
        update: {},
      });
    }

    // Notify owner + assigned driver that the car is now on-road
    const carRecord = await this.prisma.car.findUnique({
      where: { id: carId },
      select: {
        name: true,
        assignedDriver: { select: { userId: true } },
      },
    });

    const carName = carRecord?.name ?? `Car #${carId}`;

    // Notify the owner
    await this.notifications.send(
      userId,
      'Sale Closed — Car On Road',
      `The public share sale for "${carName}" is now closed. ${amount > 0 ? `${amount} unsold share${amount !== 1 ? 's' : ''} were burned — total supply reduced by ${amount}.` : 'All shares were sold.'} The car is cleared for road operations.`,
      'success',
    );

    // Notify the assigned driver (if any)
    if (carRecord?.assignedDriver?.userId) {
      await this.notifications.send(
        carRecord.assignedDriver.userId,
        'Car is Ready — Start Riding!',
        `"${carName}" has been finalised and is now on the road. You can start logging rides!`,
        'success',
      );
    }

    this.logger.log(
      `Public supply burned: carId=${carId}, burned=${amount}, primarySale=closed`,
    );
    return { success: true, carId, burnedShares: amount, primarySaleActive: false };
  }

  // ─── LISTING CREATED ──────────────────────────────────────────────────────

  async reportListingCreated(userId: string, dto: ReportListingCreatedDto) {
    const { txHash, listingId, carId, amount, pricePerShare } = dto;

    const { blockNumber, timestamp } = await this.getBlockInfo(txHash);

    // Record transaction
    await this.prisma.transaction.upsert({
      where: { txHash },
      create: {
        userId,
        type: 'listing_created',
        carId,
        amount,
        price: pricePerShare,
        txHash,
        blockNumber,
        timestamp,
      },
      update: {},
    });

    // Create Listing record in DB
    await this.prisma.listing.upsert({
      where: { id: listingId },
      create: {
        id: listingId,
        sellerId: userId,
        carId,
        amount,
        remainingAmount: amount,
        pricePerShare,
        status: 'active',
        txHash,
        blockNumber,
        createdAt: timestamp,
      },
      update: {},
    });

    // Reduce seller's ShareHolding (shares are escrowed in marketplace contract)
    const existing = await this.prisma.shareHolding.findUnique({
      where: { userId_carId: { userId, carId } },
    });
    if (existing) {
      await this.prisma.shareHolding.update({
        where: { userId_carId: { userId, carId } },
        data: { shares: Math.max(0, existing.shares - amount) },
      });
    }

    // Notify the seller that their listing is live
    const carForNotif = await this.prisma.car.findUnique({
      where: { id: carId },
      select: { name: true },
    });
    const priceEth = this.weiToEth(pricePerShare);
    await this.notifications.send(
      userId,
      'Listing Created',
      `Your listing for ${amount} share${amount !== 1 ? 's' : ''} of "${carForNotif?.name ?? `Car #${carId}`}" at ${priceEth} ETH/share is now live on the marketplace.`,
      'success',
    );

    this.logger.log(`Listing created reported: listingId=${listingId}, carId=${carId}, amount=${amount}`);
    return { success: true, listingId, carId, amount };
  }

  // ─── LISTING FILLED ───────────────────────────────────────────────────────

  async reportListingFilled(userId: string, dto: ReportListingFilledDto) {
    const { txHash, listingId, amount, totalCost, carId } = dto;

    const { blockNumber, timestamp } = await this.getBlockInfo(txHash);

    // Record transaction
    await this.prisma.transaction.upsert({
      where: { txHash },
      create: {
        userId,
        type: 'listing_filled',
        carId,
        amount,
        price: totalCost,
        txHash,
        blockNumber,
        timestamp,
      },
      update: {},
    });

    // Update Listing record — reduce remainingAmount
    const dbListing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (dbListing) {
      const newRemaining = Math.max(0, dbListing.remainingAmount - amount);
      await this.prisma.listing.update({
        where: { id: listingId },
        data: {
          remainingAmount: newRemaining,
          status: newRemaining === 0 ? 'filled' : 'active',
          filledAt: newRemaining === 0 ? timestamp : undefined,
        },
      });
    }

    // Update buyer's ShareHolding
    if (carId > 0) {
      await this.prisma.shareHolding.upsert({
        where: { userId_carId: { userId, carId } },
        create: { userId, carId, shares: amount },
        update: { shares: { increment: amount } },
      });
    }

    // Notify buyer and seller
    const carForFill = carId > 0
      ? await this.prisma.car.findUnique({ where: { id: carId }, select: { name: true } })
      : null;
    const carNameFill = carForFill?.name ?? `Car #${carId}`;
    const costEth = this.weiToEth(totalCost);

    // Notify buyer
    await this.notifications.send(
      userId,
      'Shares Purchased',
      `You bought ${amount} share${amount !== 1 ? 's' : ''} of "${carNameFill}" for ${costEth} ETH from the marketplace.`,
      'success',
    );

    // Notify seller if we have listing info
    if (dbListing && dbListing.sellerId !== userId) {
      const soldEth = this.weiToEth(totalCost);
      await this.notifications.send(
        dbListing.sellerId,
        'Listing Filled',
        `${amount} share${amount !== 1 ? 's' : ''} of "${carNameFill}" from your listing were sold for ${soldEth} ETH.`,
        'success',
      );
    }

    this.logger.log(`Listing filled reported: listingId=${listingId}, amount=${amount}, buyer=${userId}`);
    return { success: true, listingId, carId, amount };
  }

  // ─── LISTING CANCELLED ────────────────────────────────────────────────────

  async reportListingCancelled(userId: string, dto: ReportListingCancelledDto) {
    const { txHash, listingId } = dto;

    const { blockNumber, timestamp } = await this.getBlockInfo(txHash);

    // Get listing info from DB
    const dbListing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    const carId = dbListing?.carId || 0;
    const remainingAmount = dbListing?.remainingAmount || 0;

    // Record transaction
    await this.prisma.transaction.upsert({
      where: { txHash },
      create: {
        userId,
        type: 'listing_cancelled',
        carId,
        amount: remainingAmount,
        price: '0',
        txHash,
        blockNumber,
        timestamp,
      },
      update: {},
    });

    // Update Listing record
    if (dbListing) {
      await this.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: 'cancelled',
          remainingAmount: 0,
          cancelledAt: timestamp,
        },
      });
    }

    // Restore seller's ShareHolding (cancelled shares return to seller)
    if (remainingAmount > 0 && carId > 0) {
      await this.prisma.shareHolding.upsert({
        where: { userId_carId: { userId, carId } },
        create: { userId, carId, shares: remainingAmount },
        update: { shares: { increment: remainingAmount } },
      });
    }

    // Notify the seller that their listing was cancelled
    if (dbListing) {
      const carForCancel = carId > 0
        ? await this.prisma.car.findUnique({ where: { id: carId }, select: { name: true } })
        : null;
      const carNameCancel = carForCancel?.name ?? `Car #${carId}`;
      await this.notifications.send(
        userId,
        'Listing Cancelled',
        `Your listing for ${remainingAmount} share${remainingAmount !== 1 ? 's' : ''} of "${carNameCancel}" was cancelled. Shares have been returned to your wallet.`,
        'info',
      );
    }

    this.logger.log(`Listing cancelled reported: listingId=${listingId}, restored=${remainingAmount} shares`);
    return { success: true, listingId, carId, restoredShares: remainingAmount };
  }

  // ─── EARNINGS DISTRIBUTED ─────────────────────────────────────────────────

  async reportEarningsDistributed(
    _userId: string,
    dto: ReportEarningsDistributedDto,
  ) {
    const now = new Date();

    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
      select: { name: true },
    });
    const carName = car?.name ?? `Car #${dto.carId.toString()}`;

    // Create ALL dividend records atomically in one transaction.
    // If any record fails the whole batch rolls back — no partial state.
    // skipDuplicates handles idempotent retries (same txHash already saved).
    await this.prisma.$transaction(
      dto.shareholders.map((sh) =>
        this.prisma.dividend.create({
          data: {
            investorId: sh.userId,
            carId: dto.carId,
            amount: sh.amount,
            txHash: `${dto.txHash}-${sh.userId}`,
            status: 'completed',
            paidAt: now,
          },
        }),
      ),
    );

    // Send notifications after DB is committed (best-effort, non-blocking)
    for (const sh of dto.shareholders) {
      this.notifications.send(
        sh.userId,
        'Earnings Distributed',
        `You received ${this.weiToEth(sh.amount)} ETH from "${carName}". Check your wallet.`,
        'success',
      ).catch((e) => this.logger.warn(`Notification failed for ${sh.userId}: ${e?.message}`));
    }

    this.logger.log(
      `Earnings distributed carId=${dto.carId.toString()}, total=${dto.totalAmount}, recipients=${dto.shareholders.length.toString()}`,
    );
    return {
      success: true,
      carId: dto.carId,
      totalAmount: dto.totalAmount,
      recipientCount: dto.shareholders.length,
    };
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  private weiToEth(wei: string): string {
    try {
      return (Number(BigInt(wei)) / 1e18).toFixed(4);
    } catch {
      return '0';
    }
  }

  private async getBlockInfo(txHash: string): Promise<{ blockNumber: number; timestamp: Date }> {
    try {
      const client = this.blockchain.getClient();
      const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
      const block = await client.getBlock({ blockNumber: receipt.blockNumber });
      return {
        blockNumber: Number(receipt.blockNumber),
        timestamp: new Date(Number(block.timestamp) * 1000),
      };
    } catch (error) {
      this.logger.warn(`Could not fetch block info for tx ${txHash}, using current time`);
      return {
        blockNumber: 0,
        timestamp: new Date(),
      };
    }
  }
}
