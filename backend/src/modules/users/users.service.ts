import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { SubmitKYCDto } from './dto/submit-kyc.dto';
import type { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        walletAddress: true,
        roles: true,
        activeRole: true,
        kycVerified: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByWallet(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        walletAddress: true,
        roles: true,
        activeRole: true,
        kycVerified: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.activeRole) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      if (!user.roles.includes(dto.activeRole as UserRole)) {
        throw new BadRequestException(`User does not have role: ${dto.activeRole}`);
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.avatar && { avatar: dto.avatar }),
        ...(dto.activeRole && { activeRole: dto.activeRole }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        walletAddress: true,
        roles: true,
        activeRole: true,
        kycVerified: true,
      },
    });
  }

  async linkWallet(userId: string, walletAddress: string) {
    const normalized = walletAddress.toLowerCase();

    // Check if wallet is already linked to another account
    const existing = await this.prisma.userWallet.findUnique({
      where: { address: normalized },
    });
    if (existing && existing.userId !== userId) {
      throw new ConflictException('Wallet already linked to another account');
    }

    // Check how many wallets the user has
    const walletCount = await this.prisma.userWallet.count({
      where: { userId },
    });

    const isPrimary = walletCount === 0; // first wallet becomes primary

    // Upsert the wallet record
    await this.prisma.userWallet.upsert({
      where: { address: normalized },
      create: {
        userId,
        address: normalized,
        isPrimary,
      },
      update: {}, // already exists for this user — no-op
    });

    // If primary, also sync to User.walletAddress for backwards compatibility
    if (isPrimary) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { walletAddress: normalized },
      });
    }

    return this.findById(userId);
  }

  // ─── Multi-wallet methods ──────────────────────────────────────────────────

  async getUserWallets(userId: string) {
    return this.prisma.userWallet.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { connectedAt: 'asc' }],
      select: {
        id: true,
        address: true,
        isPrimary: true,
        label: true,
        connectedAt: true,
      },
    });
  }

  async addWallet(userId: string, walletAddress: string, label?: string) {
    const normalized = walletAddress.toLowerCase();

    // Check if wallet belongs to another user
    const existing = await this.prisma.userWallet.findUnique({
      where: { address: normalized },
    });
    if (existing && existing.userId !== userId) {
      throw new ConflictException('Wallet already linked to another account');
    }
    if (existing && existing.userId === userId) {
      // Already linked to this user — return existing wallets
      return this.getUserWallets(userId);
    }

    // Check if first wallet → make primary
    const walletCount = await this.prisma.userWallet.count({
      where: { userId },
    });
    const isPrimary = walletCount === 0;

    await this.prisma.userWallet.create({
      data: {
        userId,
        address: normalized,
        isPrimary,
        label: label || null,
      },
    });

    // Sync primary to User.walletAddress
    if (isPrimary) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { walletAddress: normalized },
      });
    }

    return this.getUserWallets(userId);
  }

  async setPrimaryWallet(userId: string, walletAddress: string) {
    const normalized = walletAddress.toLowerCase();

    // Ensure the wallet belongs to this user
    const wallet = await this.prisma.userWallet.findFirst({
      where: { userId, address: normalized },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Unset current primary, set new primary — interactive transaction
    // (array-style $transaction is not supported with driver adapters)
    await this.prisma.$transaction(async (tx) => {
      await tx.userWallet.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
      await tx.userWallet.update({
        where: { id: wallet.id },
        data: { isPrimary: true },
      });
      await tx.user.update({
        where: { id: userId },
        data: { walletAddress: normalized },
      });
    });

    return this.getUserWallets(userId);
  }

  async removeWallet(userId: string, walletAddress: string) {
    const normalized = walletAddress.toLowerCase();

    const wallet = await this.prisma.userWallet.findFirst({
      where: { userId, address: normalized },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    await this.prisma.userWallet.delete({
      where: { id: wallet.id },
    });

    // If we removed the primary, re-assign primary to the oldest remaining wallet
    if (wallet.isPrimary) {
      const oldest = await this.prisma.userWallet.findFirst({
        where: { userId },
        orderBy: { connectedAt: 'asc' },
      });
      if (oldest) {
        await this.prisma.$transaction(async (tx) => {
          await tx.userWallet.update({
            where: { id: oldest.id },
            data: { isPrimary: true },
          });
          await tx.user.update({
            where: { id: userId },
            data: { walletAddress: oldest.address },
          });
        });
      } else {
        // No wallets left — clear User.walletAddress
        await this.prisma.user.update({
          where: { id: userId },
          data: { walletAddress: null },
        });
      }
    }

    return this.getUserWallets(userId);
  }

  async updateWalletLabel(userId: string, walletAddress: string, label: string | null) {
    const normalized = walletAddress.toLowerCase();

    const wallet = await this.prisma.userWallet.findFirst({
      where: { userId, address: normalized },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    await this.prisma.userWallet.update({
      where: { id: wallet.id },
      data: { label },
    });

    return this.getUserWallets(userId);
  }

  async addRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (role === 'admin') {
      throw new BadRequestException('Cannot self-assign admin role');
    }

    if (user.roles.includes(role)) {
      return this.findById(userId);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: { push: role },
      },
    });

    return this.findById(userId);
  }

  async removeRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Validate role exists in user's roles
    if (!user.roles.includes(role)) {
      throw new BadRequestException(`User does not have role: ${role}`);
    }

    // Prevent removing the last role (must keep at least one)
    if (user.roles.length === 1) {
      throw new BadRequestException('Cannot remove the last role. User must have at least one role.');
    }

    // Filter out the role to be removed
    const updatedRoles = user.roles.filter((r) => r !== role);

    // Determine new activeRole if the current activeRole is being removed
    let newActiveRole = user.activeRole;
    if (user.activeRole === role) {
      // Switch to first remaining non-admin role
      newActiveRole = updatedRoles.find((r) => r !== 'admin') || updatedRoles[0];
    }

    // Update user's roles array and activeRole if needed
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: { set: updatedRoles },
        activeRole: newActiveRole,
      },
    });

    return this.findById(userId);
  }

  async submitKYC(userId: string, dto: SubmitKYCDto) {
    const existing = await this.prisma.kYCVerification.findUnique({
      where: { userId },
    });
    if (existing && existing.status === 'verified') {
      throw new BadRequestException('KYC already verified');
    }

    return this.prisma.kYCVerification.upsert({
      where: { userId },
      create: {
        userId,
        documentType: dto.documentType,
        documentUrl: dto.documentUrl,
        selfieUrl: dto.selfieUrl,
        status: 'pending',
      },
      update: {
        documentType: dto.documentType,
        documentUrl: dto.documentUrl,
        selfieUrl: dto.selfieUrl,
        status: 'pending',
        reviewNote: null,
        reviewedAt: null,
      },
    });
  }

  // ─── Onboarding ───────────────────────────────────────────────────────────
  async completeOnboarding(userId: string, requestedRoles: string[]) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const NEEDS_APPROVAL: string[] = ['car_owner', 'driver'];

    // investor is immediate only if user requested it
    const immediateRoles = Array.from(
      new Set([
        ...user.roles,
        ...(requestedRoles.includes('investor') ? ['investor' as UserRole] : []),
      ]),
    ) as UserRole[];

    // car_owner / driver go to pendingRoles awaiting admin approval
    const rolesToQueue = requestedRoles.filter(
      (r) => NEEDS_APPROVAL.includes(r) && !user.roles.includes(r as UserRole),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: immediateRoles,
        pendingRoles: rolesToQueue,
        onboardingCompleted: true,
      },
    });

    // Send notification to admins if there are pending roles to review
    if (rolesToQueue.length > 0) {
      const admins = await this.prisma.user.findMany({
        where: { roles: { has: 'admin' } },
        select: { id: true },
      });
      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: 'New Role Request',
          message: `${user.name} has requested role(s): ${rolesToQueue.join(', ')} during onboarding.`,
          type: 'info' as const,
        })),
        skipDuplicates: true,
      });
    }

    return this.findById(userId);
  }

  async getKYCStatus(userId: string) {
    const kyc = await this.prisma.kYCVerification.findUnique({
      where: { userId },
      select: {
        id: true,
        documentType: true,
        status: true,
        reviewNote: true,
        submittedAt: true,
        reviewedAt: true,
      },
    });
    return kyc;
  }
}
