import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { createPublicClient, http, type PublicClient, type Address } from 'viem';
import { PrismaService } from '../prisma.service';
import { CAR_SHARES_ABI } from './abis/car-shares.abi';
import { MARKETPLACE_ABI } from './abis/marketplace.abi';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private client!: PublicClient;
  private carSharesAddress!: Address;
  private marketplaceAddress!: Address;
  private isIndexing = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const rpcUrl = this.configService.get<string>('blockchain.rpcUrl')!;
    const chainId = this.configService.get<number>('blockchain.chainId')!;

    this.client = createPublicClient({
      transport: http(rpcUrl),
      chain: {
        id: chainId,
        name: 'hoodi',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: [rpcUrl] } },
      },
    }) as PublicClient;

    this.carSharesAddress = this.configService.get<string>('blockchain.carSharesContract') as Address;
    this.marketplaceAddress = this.configService.get<string>('blockchain.marketplaceContract') as Address;

    this.logger.log(`Blockchain service initialized (chain ${chainId})`);
  }

  getClient(): PublicClient {
    return this.client;
  }

  async getCarConfig(carId: number) {
    return this.client.readContract({
      address: this.carSharesAddress,
      abi: CAR_SHARES_ABI,
      functionName: 'getCarConfig',
      args: [BigInt(carId)],
    });
  }

  async getNextCarId(): Promise<number> {
    const result = await this.client.readContract({
      address: this.carSharesAddress,
      abi: CAR_SHARES_ABI,
      functionName: 'nextCarId',
    });
    return Number(result);
  }

  async getBalanceOf(account: Address, carId: number): Promise<bigint> {
    return this.client.readContract({
      address: this.carSharesAddress,
      abi: CAR_SHARES_ABI,
      functionName: 'balanceOf',
      args: [account, BigInt(carId)],
    });
  }

  async getGlobalFeeBps(): Promise<number> {
    const result = await this.client.readContract({
      address: this.carSharesAddress,
      abi: CAR_SHARES_ABI,
      functionName: 'globalFeeBps',
    });
    return Number(result);
  }

  async getAccumulatedFees(): Promise<bigint> {
    return this.client.readContract({
      address: this.carSharesAddress,
      abi: CAR_SHARES_ABI,
      functionName: 'accumulatedFees',
    });
  }

  async getListing(listingId: number) {
    return this.client.readContract({
      address: this.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'getListing',
      args: [BigInt(listingId)],
    });
  }

  async getNextListingId(): Promise<number> {
    const result = await this.client.readContract({
      address: this.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'nextListingId',
    });
    return Number(result);
  }

  async calculateCost(listingId: number, amount: number) {
    return this.client.readContract({
      address: this.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'calculateCost',
      args: [BigInt(listingId), BigInt(amount)],
    });
  }

  // ─── EVENT INDEXING ─────────────────────────────────────────────────

  // Cron job disabled — DB is now updated immediately via POST /blockchain/report/* endpoints
  // called by the frontend after each successful blockchain transaction.
  // @Cron('*/5 * * * *')
  async indexEvents() {
    if (this.isIndexing) {
      this.logger.warn('Indexing already in progress, skipping');
      return;
    }

    this.logger.log('Cron job triggered: Starting blockchain event indexing');
    this.isIndexing = true;
    try {
      const syncState = await this.prisma.blockchainSyncState.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', lastProcessedBlock: 0 },
        update: {},
      });

      const currentBlock = await this.client.getBlockNumber();
      const fromBlock = BigInt(syncState.lastProcessedBlock + 1);
      const toBlock = currentBlock;

      if (fromBlock > toBlock) {
        this.logger.debug('No new blocks to process');
        return;
      }

      // Process in chunks of 2000 blocks
      const chunkSize = 2000n;
      let chunkStart = fromBlock;

      while (chunkStart <= toBlock) {
        const chunkEnd = chunkStart + chunkSize - 1n > toBlock
          ? toBlock
          : chunkStart + chunkSize - 1n;

        await this.processCarCreatedEvents(chunkStart, chunkEnd);
        await this.processPrimaryPurchaseEvents(chunkStart, chunkEnd);
        await this.processListingCreatedEvents(chunkStart, chunkEnd);
        await this.processListingFilledEvents(chunkStart, chunkEnd);
        await this.processListingCancelledEvents(chunkStart, chunkEnd);

        await this.prisma.blockchainSyncState.update({
          where: { id: 'singleton' },
          data: { lastProcessedBlock: Number(chunkEnd) },
        });

        chunkStart = chunkEnd + 1n;
      }

      this.logger.log(`Indexed blocks ${fromBlock} to ${toBlock}`);
    } catch (error) {
      this.logger.error('Event indexing failed', error instanceof Error ? error.stack : error);
    } finally {
      this.isIndexing = false;
    }
  }

  private async processCarCreatedEvents(fromBlock: bigint, toBlock: bigint) {
    const logs = await this.client.getLogs({
      address: this.carSharesAddress,
      event: {
        type: 'event',
        name: 'CarCreated',
        inputs: [
          { name: 'carId', type: 'uint256', indexed: true },
          { name: 'owner', type: 'address', indexed: true },
          { name: 'totalSupply', type: 'uint256', indexed: false },
          { name: 'publicSupply', type: 'uint256', indexed: false },
          { name: 'pricePerShare', type: 'uint256', indexed: false },
          { name: 'minPrimaryBuy', type: 'uint256', indexed: false },
          { name: 'metadataCID', type: 'string', indexed: false },
        ],
      },
      fromBlock,
      toBlock,
    });

    for (const log of logs) {
      const args = log.args;
      if (!args.carId || !args.owner) continue;

      const carId = Number(args.carId);

      // Find or create owner user
      let user = await this.prisma.user.findUnique({
        where: { walletAddress: args.owner.toLowerCase() },
      });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            walletAddress: args.owner.toLowerCase(),
            name: `${args.owner.slice(0, 6)}...${args.owner.slice(-4)}`,
            roles: ['car_owner'],
            activeRole: 'car_owner',
          },
        });
      }

      // Fetch metadata from IPFS to get car details
      let name = `Car #${carId}`;
      let make = 'Unknown';
      let model = 'Unknown';
      let year = 2024;
      let vin = `VIN-${carId}`;

      const metadataCID = args.metadataCID;
      if (metadataCID) {
        try {
          const gateway = this.configService.get<string>('PINATA_GATEWAY') || 'https://gateway.pinata.cloud/ipfs/';
          const response = await fetch(`${gateway}${metadataCID}`);
          if (response.ok) {
            const metadata = await response.json() as Record<string, unknown>;
            name = (metadata['name'] as string) || name;
            const attrs = metadata['attributes'] as Array<{ trait_type: string; value: string }> | undefined;
            if (attrs) {
              make = attrs.find((a) => a.trait_type === 'Make')?.value || make;
              model = attrs.find((a) => a.trait_type === 'Model')?.value || model;
              year = parseInt(attrs.find((a) => a.trait_type === 'Year')?.value || String(year), 10);
              vin = attrs.find((a) => a.trait_type === 'VIN')?.value || vin;
            }
          }
        } catch {
          this.logger.warn(`Failed to fetch metadata for car ${carId}`);
        }
      }

      await this.prisma.car.upsert({
        where: { id: carId },
        create: {
          id: carId,
          ownerId: user.id,
          name,
          make,
          model,
          year,
          vin,
          totalShares: Number(args.totalSupply || 0),
          pricePerShare: (args.pricePerShare || 0n).toString(),
          metadataCID: metadataCID || '',
        },
        update: {
          metadataCID: metadataCID || undefined,
        },
      });

      // Create ShareHolding for the car owner (totalSupply - publicSupply = owner's retained shares)
      const totalSupply = Number(args.totalSupply || 0);
      const publicSupply = Number(args.publicSupply || 0);
      const ownerShares = totalSupply - publicSupply;
      if (ownerShares > 0) {
        await this.prisma.shareHolding.upsert({
          where: { userId_carId: { userId: user.id, carId } },
          create: { userId: user.id, carId, shares: ownerShares },
          update: { shares: ownerShares },
        });
      }

      // Record a car_created transaction
      if (log.transactionHash) {
        const block = await this.client.getBlock({ blockNumber: log.blockNumber! });
        await this.prisma.transaction.upsert({
          where: { txHash: log.transactionHash },
          create: {
            userId: user.id,
            type: 'car_created',
            carId,
            amount: totalSupply,
            price: '0',
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
            timestamp: new Date(Number(block.timestamp) * 1000),
          },
          update: {},
        });
      }

      this.logger.log(`Indexed CarCreated: carId=${carId}`);
    }
  }

  private async processPrimaryPurchaseEvents(fromBlock: bigint, toBlock: bigint) {
    const logs = await this.client.getLogs({
      address: this.carSharesAddress,
      event: {
        type: 'event',
        name: 'PrimaryPurchase',
        inputs: [
          { name: 'carId', type: 'uint256', indexed: true },
          { name: 'buyer', type: 'address', indexed: true },
          { name: 'amount', type: 'uint256', indexed: false },
          { name: 'totalCost', type: 'uint256', indexed: false },
          { name: 'fee', type: 'uint256', indexed: false },
        ],
      },
      fromBlock,
      toBlock,
    });

    for (const log of logs) {
      const args = log.args;
      if (!args.carId || !args.buyer || !log.transactionHash) continue;

      // Find or create buyer user
      let user = await this.prisma.user.findUnique({
        where: { walletAddress: args.buyer.toLowerCase() },
      });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            walletAddress: args.buyer.toLowerCase(),
            name: `${args.buyer.slice(0, 6)}...${args.buyer.slice(-4)}`,
            roles: ['investor'],
            activeRole: 'investor',
          },
        });
      }

      const block = await this.client.getBlock({ blockNumber: log.blockNumber! });

      await this.prisma.transaction.upsert({
        where: { txHash: log.transactionHash },
        create: {
          userId: user.id,
          type: 'primary_purchase',
          carId: Number(args.carId),
          amount: Number(args.amount || 0),
          price: (args.totalCost || 0n).toString(),
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: new Date(Number(block.timestamp) * 1000),
        },
        update: {},
      });

      // Update ShareHolding for buyer
      const carId = Number(args.carId);
      const amount = Number(args.amount || 0);
      await this.prisma.shareHolding.upsert({
        where: { userId_carId: { userId: user.id, carId } },
        create: { userId: user.id, carId, shares: amount },
        update: { shares: { increment: amount } },
      });
    }
  }

  private async processListingCreatedEvents(fromBlock: bigint, toBlock: bigint) {
    const logs = await this.client.getLogs({
      address: this.marketplaceAddress,
      event: {
        type: 'event',
        name: 'ListingCreated',
        inputs: [
          { name: 'listingId', type: 'uint256', indexed: true },
          { name: 'seller', type: 'address', indexed: true },
          { name: 'carId', type: 'uint256', indexed: true },
          { name: 'amount', type: 'uint256', indexed: false },
          { name: 'pricePerShare', type: 'uint256', indexed: false },
        ],
      },
      fromBlock,
      toBlock,
    });

    for (const log of logs) {
      const args = log.args;
      if (!args.listingId || !args.seller || !log.transactionHash) continue;

      let user = await this.prisma.user.findUnique({
        where: { walletAddress: args.seller.toLowerCase() },
      });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            walletAddress: args.seller.toLowerCase(),
            name: `${args.seller.slice(0, 6)}...${args.seller.slice(-4)}`,
            roles: ['investor'],
            activeRole: 'investor',
          },
        });
      }

      const block = await this.client.getBlock({ blockNumber: log.blockNumber! });

      await this.prisma.transaction.upsert({
        where: { txHash: log.transactionHash },
        create: {
          userId: user.id,
          type: 'listing_created',
          carId: Number(args.carId || 0),
          amount: Number(args.amount || 0),
          price: (args.pricePerShare || 0n).toString(),
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: new Date(Number(block.timestamp) * 1000),
        },
        update: {},
      });

      // Create Listing record in DB
      const listingId = Number(args.listingId);
      const carId = Number(args.carId || 0);
      const amount = Number(args.amount || 0);
      await this.prisma.listing.upsert({
        where: { id: listingId },
        create: {
          id: listingId,
          sellerId: user.id,
          carId,
          amount,
          remainingAmount: amount,
          pricePerShare: (args.pricePerShare || 0n).toString(),
          status: 'active',
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          createdAt: new Date(Number(block.timestamp) * 1000),
        },
        update: {},
      });

      // Reduce seller's ShareHolding (shares are escrowed in marketplace contract)
      const existing = await this.prisma.shareHolding.findUnique({
        where: { userId_carId: { userId: user.id, carId } },
      });
      if (existing) {
        await this.prisma.shareHolding.update({
          where: { userId_carId: { userId: user.id, carId } },
          data: { shares: Math.max(0, existing.shares - amount) },
        });
      }
    }
  }

  private async processListingFilledEvents(fromBlock: bigint, toBlock: bigint) {
    const logs = await this.client.getLogs({
      address: this.marketplaceAddress,
      event: {
        type: 'event',
        name: 'ListingFilled',
        inputs: [
          { name: 'listingId', type: 'uint256', indexed: true },
          { name: 'buyer', type: 'address', indexed: true },
          { name: 'amount', type: 'uint256', indexed: false },
          { name: 'totalCost', type: 'uint256', indexed: false },
          { name: 'fee', type: 'uint256', indexed: false },
        ],
      },
      fromBlock,
      toBlock,
    });

    for (const log of logs) {
      const args = log.args;
      if (!args.listingId || !args.buyer || !log.transactionHash) continue;

      let user = await this.prisma.user.findUnique({
        where: { walletAddress: args.buyer.toLowerCase() },
      });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            walletAddress: args.buyer.toLowerCase(),
            name: `${args.buyer.slice(0, 6)}...${args.buyer.slice(-4)}`,
            roles: ['investor'],
            activeRole: 'investor',
          },
        });
      }

      // Resolve carId from the listing on-chain
      let carId = 0;
      try {
        const listing = await this.getListing(Number(args.listingId));
        carId = Number(listing.carId);
      } catch {
        // Try to resolve from DB listing
        const dbListing = await this.prisma.listing.findUnique({ where: { id: Number(args.listingId) } });
        if (dbListing) carId = dbListing.carId;
        else this.logger.warn(`Could not resolve carId for listing ${args.listingId}`);
      }

      const block = await this.client.getBlock({ blockNumber: log.blockNumber! });

      await this.prisma.transaction.upsert({
        where: { txHash: log.transactionHash },
        create: {
          userId: user.id,
          type: 'listing_filled',
          carId,
          amount: Number(args.amount || 0),
          price: (args.totalCost || 0n).toString(),
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: new Date(Number(block.timestamp) * 1000),
        },
        update: {},
      });

      // Update Listing record - reduce remainingAmount
      const listingId = Number(args.listingId);
      const filledAmount = Number(args.amount || 0);
      const dbListing = await this.prisma.listing.findUnique({ where: { id: listingId } });
      if (dbListing) {
        const newRemaining = Math.max(0, dbListing.remainingAmount - filledAmount);
        await this.prisma.listing.update({
          where: { id: listingId },
          data: {
            remainingAmount: newRemaining,
            status: newRemaining === 0 ? 'filled' : 'active',
            filledAt: newRemaining === 0 ? new Date(Number(block.timestamp) * 1000) : undefined,
          },
        });
      }

      // Update buyer's ShareHolding
      if (carId > 0) {
        await this.prisma.shareHolding.upsert({
          where: { userId_carId: { userId: user.id, carId } },
          create: { userId: user.id, carId, shares: filledAmount },
          update: { shares: { increment: filledAmount } },
        });
      }
    }
  }

  private async processListingCancelledEvents(fromBlock: bigint, toBlock: bigint) {
    const logs = await this.client.getLogs({
      address: this.marketplaceAddress,
      event: {
        type: 'event',
        name: 'ListingCancelled',
        inputs: [
          { name: 'listingId', type: 'uint256', indexed: true },
          { name: 'remainingAmount', type: 'uint256', indexed: false },
        ],
      },
      fromBlock,
      toBlock,
    });

    for (const log of logs) {
      const args = log.args;
      if (!args.listingId || !log.transactionHash) continue;

      // We can't easily determine the user from a cancel event without the listing data
      // Just record the transaction if we can find the listing
      try {
        // Try DB first, then on-chain
        let seller: string | undefined;
        let carId = 0;
        let remainingAmount = Number(args.remainingAmount || 0);

        const dbListing = await this.prisma.listing.findUnique({ where: { id: Number(args.listingId) } });
        if (dbListing) {
          seller = dbListing.sellerId;
          carId = dbListing.carId;
        } else {
          const listing = await this.getListing(Number(args.listingId));
          seller = listing.seller as string;
          carId = Number(listing.carId);
        }

        // Find user - by DB id (from dbListing) or by wallet address (from on-chain)
        let user;
        if (dbListing) {
          user = await this.prisma.user.findUnique({ where: { id: seller! } });
        } else {
          user = await this.prisma.user.findUnique({
            where: { walletAddress: (seller as string).toLowerCase() },
          });
        }
        if (!user) continue;

        const block = await this.client.getBlock({ blockNumber: log.blockNumber! });

        await this.prisma.transaction.upsert({
          where: { txHash: log.transactionHash },
          create: {
            userId: user.id,
            type: 'listing_cancelled',
            carId,
            amount: remainingAmount,
            price: '0',
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
            timestamp: new Date(Number(block.timestamp) * 1000),
          },
          update: {},
        });

        // Update Listing record
        if (dbListing) {
          await this.prisma.listing.update({
            where: { id: Number(args.listingId) },
            data: {
              status: 'cancelled',
              remainingAmount: 0,
              cancelledAt: new Date(Number(block.timestamp) * 1000),
            },
          });
        }

        // Restore seller's ShareHolding (cancelled shares return to seller)
        if (remainingAmount > 0 && carId > 0) {
          await this.prisma.shareHolding.upsert({
            where: { userId_carId: { userId: user.id, carId } },
            create: { userId: user.id, carId, shares: remainingAmount },
            update: { shares: { increment: remainingAmount } },
          });
        }
      } catch {
        this.logger.warn(`Could not process cancel event for listing ${args.listingId}`);
      }
    }
  }
}
