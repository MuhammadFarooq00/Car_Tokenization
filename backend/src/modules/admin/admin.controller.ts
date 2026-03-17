import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import {
  ReviewKYCDto,
  ReviewApplicationDto,
  ReviewExpenseDto,
  UpdateUserRolesDto,
  ReviewOnboardingRoleDto,
} from './dto/index';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── USERS ────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Put('users/:id/roles')
  @ApiOperation({ summary: 'Update user roles' })
  async updateRoles(
    @Param('id') id: string,
    @Body() dto: UpdateUserRolesDto,
  ) {
    return this.adminService.updateUserRoles(id, dto.roles);
  }

  // ─── KYC ──────────────────────────────────────────────────────────

  @Get('kyc/pending')
  @ApiOperation({ summary: 'Get pending KYC verifications' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPendingKYC(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getPendingKYC(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('kyc/:id/review')
  @ApiOperation({ summary: 'Review KYC submission' })
  async reviewKYC(
    @Param('id') id: string,
    @Body() dto: ReviewKYCDto,
  ) {
    return this.adminService.reviewKYC(id, dto.status, dto.reviewNote);
  }

  // ─── DRIVER APPLICATIONS ──────────────────────────────────────────

  @Get('applications/pending')
  @ApiOperation({ summary: 'Get pending driver applications' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPendingApplications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getPendingApplications(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('applications/:id/review')
  @ApiOperation({ summary: 'Review driver application' })
  async reviewApplication(
    @Param('id') id: string,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.adminService.reviewApplication(id, dto.status, dto.reviewNote);
  }

  // ─── EXPENSES ─────────────────────────────────────────────────────

  @Get('expenses/pending')
  @ApiOperation({ summary: 'Get pending expenses' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPendingExpenses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getPendingExpenses(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('expenses/:id/review')
  @ApiOperation({ summary: 'Approve or reject expense' })
  async reviewExpense(
    @Param('id') id: string,
    @Body() dto: ReviewExpenseDto,
  ) {
    return this.adminService.reviewExpense(id, dto.status);
  }

  // ─── ONBOARDING ROLE REQUESTS ─────────────────────────────────────

  @Get('onboarding/pending')
  @ApiOperation({ summary: 'Get users with pending role requests from onboarding' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPendingOnboardingRequests(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getPendingOnboardingRequests(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('onboarding/:userId/role/review')
  @ApiOperation({ summary: 'Approve or reject a pending onboarding role request' })
  async reviewOnboardingRole(
    @Param('userId') userId: string,
    @Body() dto: ReviewOnboardingRoleDto,
  ) {
    return this.adminService.reviewOnboardingRole(
      userId,
      dto.role,
      dto.decision,
      dto.reviewNote,
    );
  }

  // ─── TRANSACTIONS ─────────────────────────────────────────────────

  @Get('transactions')
  @ApiOperation({ summary: 'Get all platform transactions' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getTransactions(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // ─── CARS ─────────────────────────────────────────────────────────

  @Get('cars')
  @ApiOperation({ summary: 'Get all cars (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getCars(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getCars(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // ─── BLOCKCHAIN SYNC ─────────────────────────────────────────────

  @Post('sync')
  @ApiOperation({ summary: 'Trigger blockchain event indexing' })
  async triggerSync() {
    return this.adminService.triggerSync();
  }

  // ─── ANALYTICS ────────────────────────────────────────────────────

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform analytics' })
  async getAnalytics() {
    return this.adminService.getPlatformAnalytics();
  }
}
