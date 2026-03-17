import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SiweMessage } from 'siwe';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma.service';
import { MailerService } from '../mailer/mailer.service';
import type { SignupDto, LoginDto, WalletLoginDto } from './dto/index';
import type { JwtPayload, TokenPair } from '../../shared/types/index';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly nonces = new Map<string, { nonce: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  // ─── Signup ──────────────────────────────────────────────────────
  async signup(dto: SignupDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    if (dto.walletAddress) {
      const walletExists = await this.prisma.user.findUnique({
        where: { walletAddress: dto.walletAddress.toLowerCase() },
      });
      if (walletExists) {
        throw new ConflictException('Wallet address already linked to another account');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Use exactly the roles the user selected; default to investor if none provided
    const ALLOWED_ROLES = ['investor', 'car_owner', 'driver'] as const;
    type AllowedRole = typeof ALLOWED_ROLES[number];
    const requestedRoles = (dto.roles ?? []).filter(
      (r): r is AllowedRole => (ALLOWED_ROLES as readonly string[]).includes(r),
    );
    const roles: AllowedRole[] = requestedRoles.length > 0 ? requestedRoles : ['investor'];
    const activeRole: AllowedRole = roles[0];

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        walletAddress: dto.walletAddress?.toLowerCase(),
        roles,
        activeRole,
        emailVerified: true, // auto-verified — email sending disabled for local dev
      },
    });

    this.logger.log(`New user registered: ${user.email} (auto-verified, local dev mode)`);
    return { message: 'Account created successfully. You can now log in.' };
  }

  // ─── Verify Email ────────────────────────────────────────────────
  async verifyEmail(token: string): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification link');
    }

    if (user.emailVerified) {
      // Already verified — just log them in
      return this.generateTokens(user);
    }

    if (!user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
      throw new BadRequestException('Verification link has expired. Please request a new one.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    this.logger.log(`Email verified for user ${user.id}`);
    return this.generateTokens(updatedUser);
  }

  // ─── Resend Verification Email ───────────────────────────────────
  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || !user.email) {
      return { message: 'If that email exists and is unverified, a new link has been sent.' };
    }

    if (user.emailVerified) {
      return { message: 'This email address is already verified.' };
    }

    const newToken = uuidv4();
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: newToken,
        emailVerificationExpiry: newExpiry,
      },
    });

    await this.mailerService.sendVerificationEmail(user.email, user.name, newToken);
    this.logger.log(`Resent verification email to ${email}`);
    return { message: 'If that email exists and is unverified, a new link has been sent.' };
  }

  // ─── Login ────────────────────────────────────────────────────────
  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Block unverified email/password accounts (wallet-only users bypass this)
    if (user.email && !user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in. Check your inbox for the verification link.',
      );
    }

    return this.generateTokens(user);
  }

  // ─── SIWE Nonce ───────────────────────────────────────────────────
  generateNonce(walletAddress: string): string {
    const nonce = uuidv4().replace(/-/g, '');
    this.nonces.set(walletAddress.toLowerCase(), {
      nonce,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    return nonce;
  }

  // ─── Wallet Login ─────────────────────────────────────────────────
  async walletLogin(dto: WalletLoginDto): Promise<TokenPair> {
    const siweMessage = new SiweMessage(dto.message);

    const stored = this.nonces.get(siweMessage.address.toLowerCase());
    if (!stored || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('Nonce expired or not found. Request a new one.');
    }

    if (siweMessage.nonce !== stored.nonce) {
      throw new UnauthorizedException('Invalid nonce');
    }

    try {
      await siweMessage.verify({ signature: dto.signature });
    } catch {
      throw new UnauthorizedException('Invalid signature');
    }

    this.nonces.delete(siweMessage.address.toLowerCase());

    let user = await this.prisma.user.findUnique({
      where: { walletAddress: siweMessage.address.toLowerCase() },
    });

    if (!user) {
      // Wallet-only users are auto-verified (no email to verify)
      user = await this.prisma.user.create({
        data: {
          walletAddress: siweMessage.address.toLowerCase(),
          name: `${siweMessage.address.slice(0, 6)}...${siweMessage.address.slice(-4)}`,
          roles: ['investor'],
          activeRole: 'investor',
          emailVerified: true, // wallet auth bypasses email verification
        },
      });
      this.logger.log(`New wallet user created: ${user.id}`);
    }

    return this.generateTokens(user);
  }

  // ─── Refresh Tokens ───────────────────────────────────────────────
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ─── Get Profile ──────────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        walletAddress: true,
        roles: true,
        activeRole: true,
        kycVerified: true,
        emailVerified: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  // ─── Change Password ──────────────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new BadRequestException('Password change not available for wallet-only accounts');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    this.logger.log(`Password changed for user ${userId}`);
    return { message: 'Password changed successfully' };
  }

  // ─── Forgot Password (DB-backed, sends link via email) ───────────
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || !user.email || !user.passwordHash) {
      this.logger.warn(`Password reset requested for unknown/wallet-only email: ${email}`);
      return { message: 'If that email exists, a reset link has been sent' };
    }

    const token = uuidv4();
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiry: expiry,
      },
    });

    await this.mailerService.sendPasswordResetEmail(user.email, user.name, token);
    this.logger.log(`Password reset email sent to ${email}`);
    return { message: 'If that email exists, a reset link has been sent' };
  }

  // ─── Reset Password (validates DB token) ─────────────────────────
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    this.logger.log(`Password reset completed for user ${user.id}`);
    return { message: 'Password has been reset successfully' };
  }

  // ─── Internal: Generate JWT pair ──────────────────────────────────
  private generateTokens(user: {
    id: string;
    email?: string | null;
    walletAddress?: string | null;
    roles: string[];
    activeRole?: string | null;
  }): TokenPair {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email ?? undefined,
      walletAddress: user.walletAddress ?? undefined,
      roles: user.roles,
      activeRole: user.activeRole ?? undefined,
    };

    return {
      accessToken: this.jwtService.sign({ ...payload }, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiration') as any,
      }),
      refreshToken: this.jwtService.sign({ ...payload }, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiration') as any,
      }),
    };
  }
}
