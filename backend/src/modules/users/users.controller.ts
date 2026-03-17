import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, SubmitKYCDto, LinkWalletDto, AddRoleDto, RemoveRoleDto, CompleteOnboardingDto } from './dto/index';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get own profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update profile (name, avatar, activeRole)' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('wallet')
  @ApiOperation({ summary: 'Link wallet address to account (legacy — also adds to wallets)' })
  async linkWallet(
    @CurrentUser('id') userId: string,
    @Body() dto: LinkWalletDto,
  ) {
    return this.usersService.linkWallet(userId, dto.walletAddress);
  }

  // ─── Multi-wallet endpoints ─────────────────────────────────────────────

  @Get('wallets')
  @ApiOperation({ summary: 'Get all connected wallets' })
  async getWallets(@CurrentUser('id') userId: string) {
    return this.usersService.getUserWallets(userId);
  }

  @Post('wallets')
  @ApiOperation({ summary: 'Add a new wallet' })
  async addWallet(
    @CurrentUser('id') userId: string,
    @Body() dto: LinkWalletDto,
  ) {
    return this.usersService.addWallet(userId, dto.walletAddress);
  }

  @Patch('wallets/:address/primary')
  @ApiOperation({ summary: 'Set a wallet as primary' })
  async setPrimaryWallet(
    @CurrentUser('id') userId: string,
    @Param('address') address: string,
  ) {
    return this.usersService.setPrimaryWallet(userId, address);
  }

  @Delete('wallets/:address')
  @ApiOperation({ summary: 'Remove a wallet' })
  async removeWallet(
    @CurrentUser('id') userId: string,
    @Param('address') address: string,
  ) {
    return this.usersService.removeWallet(userId, address);
  }

  @Post('role')
  @ApiOperation({ summary: 'Add a role to current user' })
  async addRole(
    @CurrentUser('id') userId: string,
    @Body() dto: AddRoleDto,
  ) {
    return this.usersService.addRole(userId, dto.role);
  }

  @Delete('role')
  @ApiOperation({ summary: 'Remove a role from current user' })
  async removeRole(
    @CurrentUser('id') userId: string,
    @Body() dto: RemoveRoleDto,
  ) {
    return this.usersService.removeRole(userId, dto.role);
  }

  @Get('wallet/:address')
  @ApiOperation({ summary: 'Find user by wallet address' })
  async findByWallet(@Param('address') address: string) {
    return this.usersService.findByWallet(address);
  }

  @Post('onboarding/complete')
  @ApiOperation({ summary: 'Complete onboarding questionnaire — assigns roles based on answers' })
  async completeOnboarding(
    @CurrentUser('id') userId: string,
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.usersService.completeOnboarding(userId, dto.roles);
  }

  @Post('kyc')
  @ApiOperation({ summary: 'Submit KYC documents' })
  async submitKYC(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitKYCDto,
  ) {
    return this.usersService.submitKYC(userId, dto);
  }

  @Get('kyc/status')
  @ApiOperation({ summary: 'Get KYC verification status' })
  async getKYCStatus(@CurrentUser('id') userId: string) {
    return this.usersService.getKYCStatus(userId);
  }
}
