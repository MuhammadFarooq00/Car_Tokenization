import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/index';
import { UpdateCarStatusDto } from './dto/update-car-status.dto';
import { CarStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Cars')
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all cars (discover page)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: CarStatus,
  ) {
    return this.carsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 12,
      status,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new car (after on-chain creation)' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCarDto,
  ) {
    return this.carsService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('owner/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get cars owned by current user' })
  async findMyOwnedCars(@CurrentUser('id') userId: string) {
    return this.carsService.findByOwner(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('owner/me/rides')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get rides on cars owned by current user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'carId', required: false })
  async getOwnerCarRides(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('carId') carId?: string,
  ) {
    return this.carsService.getOwnerCarRides(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      carId ? parseInt(carId, 10) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('owner/me/expenses')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Car owner logs an expense directly (auto-approved, notifies shareholders)' })
  async submitOwnerExpense(
    @CurrentUser('id') userId: string,
    @Body() body: { carId: number; type: string; amount: string; description?: string; receipt?: string },
  ) {
    return this.carsService.submitOwnerExpense(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('owner/me/expenses')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get expenses on cars owned by current user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'carId', required: false })
  async getOwnerCarExpenses(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('carId') carId?: string,
  ) {
    return this.carsService.getOwnerCarExpenses(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      carId ? parseInt(carId, 10) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('owner/me/expenses/:id/review')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject an expense on your car' })
  async reviewExpenseAsOwner(
    @CurrentUser('id') userId: string,
    @Param('id') expenseId: string,
    @Body() body: { status: 'approved' | 'rejected' },
  ) {
    return this.carsService.reviewExpenseAsOwner(userId, expenseId, body.status);
  }

  @UseGuards(JwtAuthGuard)
  @Get('owner/me/shareholders')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Count unique shareholders across owned cars' })
  async getOwnerShareholders(@CurrentUser('id') userId: string) {
    return this.carsService.getOwnerShareholders(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('owner/me/share-overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get aggregate share stats across all owned cars' })
  async getFleetShareOverview(@CurrentUser('id') userId: string) {
    return this.carsService.getFleetShareOverview(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('owner/me/fleet-revenue')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fleet-wide aggregate revenue stats (rides commission - expenses)' })
  async getFleetRevenueStats(@CurrentUser('id') userId: string) {
    return this.carsService.getFleetRevenueStats(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('owner/me/car/:carId/revenue-stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Per-car revenue stats with shareholder earnings breakdown' })
  async getCarRevenueStats(
    @CurrentUser('id') userId: string,
    @Param('carId', ParseIntPipe) carId: number,
  ) {
    return this.carsService.getCarRevenueStats(userId, carId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('owner/me/car/:carId/history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chronological event history for a car (rides, expenses, dividends)' })
  async getCarHistory(
    @CurrentUser('id') userId: string,
    @Param('carId', ParseIntPipe) carId: number,
  ) {
    return this.carsService.getCarHistory(userId, carId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('owner/me/car/:carId/shareholders')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List shareholders for a specific owned car' })
  async getCarShareholders(
    @CurrentUser('id') userId: string,
    @Param('carId', ParseIntPipe) carId: number,
  ) {
    return this.carsService.getCarShareholders(userId, carId);
  }

  @Public()
  @Get('on-chain/next-id')
  @ApiOperation({ summary: 'Get next car ID from smart contract' })
  async getNextCarId() {
    return this.carsService.getNextCarId();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get car details with on-chain data' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.carsService.findById(id);
  }

  @Public()
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get car statistics' })
  async getStats(@Param('id', ParseIntPipe) id: number) {
    return this.carsService.getCarStats(id);
  }

  @Public()
  @Get(':id/on-chain')
  @ApiOperation({ summary: 'Get on-chain config for a car' })
  async getOnChainConfig(@Param('id', ParseIntPipe) id: number) {
    return this.carsService.getOnChainConfig(id);
  }

  @Public()
  @Get(':id/balance/:address')
  @ApiOperation({ summary: 'Get share balance for an address on a car' })
  async getBalance(
    @Param('id', ParseIntPipe) id: number,
    @Param('address') address: string,
  ) {
    return this.carsService.getShareBalance(id, address);
  }

  @UseGuards(JwtAuthGuard)
  @Post('owner/me/car/:carId/assign-driver')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually assign a driver user to your car' })
  async assignDriverToCar(
    @CurrentUser('id') userId: string,
    @Param('carId', ParseIntPipe) carId: number,
    @Body() body: { driverUserId: string },
  ) {
    return this.carsService.assignDriverToCar(userId, carId, body.driverUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update car status (owner only)' })
  async updateCarStatus(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCarStatusDto,
  ) {
    return this.carsService.updateStatusByOwner(userId, id, dto.status);
  }
}
