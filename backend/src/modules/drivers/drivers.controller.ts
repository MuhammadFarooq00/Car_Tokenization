import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { ApplyDriverDto, LogRideDto, SubmitExpenseDto, ReviewApplicationDto } from './dto/index';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Apply to be a driver for a car' })
  async apply(
    @CurrentUser('id') userId: string,
    @Body() dto: ApplyDriverDto,
  ) {
    return this.driversService.applyAsDriver(userId, dto);
  }

  @Get('applications')
  @ApiOperation({ summary: 'Get my driver applications' })
  async getApplications(@CurrentUser('id') userId: string) {
    return this.driversService.getMyApplications(userId);
  }

  // ─── OWNER ENDPOINTS ──────────────────────────────────────────────

  @Get('list')
  @ApiOperation({ summary: 'List all users with the driver role (for owner assign-driver picker)' })
  async listDriverUsers() {
    return this.driversService.listDriverUsers();
  }

  @Get('applications/for-my-cars')
  @Roles('car_owner')
  @ApiOperation({ summary: 'Get driver applications for cars I own' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getApplicationsForMyCars(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.driversService.getApplicationsForMyCars(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('applications/:id/review')
  @Roles('car_owner')
  @ApiOperation({ summary: 'Approve or reject a driver application (owner)' })
  async reviewApplication(
    @CurrentUser('id') userId: string,
    @Param('id') applicationId: string,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.driversService.reviewApplicationAsOwner(
      userId,
      applicationId,
      dto.status,
      dto.reviewNote,
    );
  }

  @Get('profile')
  @Roles('driver')
  @ApiOperation({ summary: 'Get driver profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.driversService.getDriverProfile(userId);
  }

  @Get('stats')
  @Roles('driver')
  @ApiOperation({ summary: 'Get driver dashboard stats (monthly/weekly/today earnings)' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.driversService.getDriverStats(userId);
  }

  @Post('rides')
  @Roles('driver')
  @ApiOperation({ summary: 'Log a completed ride' })
  async logRide(
    @CurrentUser('id') userId: string,
    @Body() dto: LogRideDto,
  ) {
    return this.driversService.logRide(userId, dto);
  }

  @Get('rides')
  @Roles('driver')
  @ApiOperation({ summary: 'Get ride history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getRides(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.driversService.getRides(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('expenses')
  @Roles('driver')
  @ApiOperation({ summary: 'Submit an expense' })
  async submitExpense(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitExpenseDto,
  ) {
    return this.driversService.submitExpense(userId, dto);
  }

  @Get('expenses')
  @Roles('driver')
  @ApiOperation({ summary: 'Get submitted expenses' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getExpenses(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.driversService.getExpenses(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
