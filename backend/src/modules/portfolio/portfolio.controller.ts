import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Portfolio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'Get portfolio summary with holdings' })
  async getSummary(@CurrentUser('id') userId: string) {
    return this.portfolioService.getPortfolioSummary(userId);
  }

  @Get('holdings')
  @ApiOperation({ summary: 'Get detailed holdings' })
  async getHoldings(@CurrentUser('id') userId: string) {
    return this.portfolioService.getHoldings(userId);
  }

  @Get('car/:carId')
  @ApiOperation({ summary: 'Get holding for a specific car' })
  async getCarHolding(
    @CurrentUser('id') userId: string,
    @Param('carId', ParseIntPipe) carId: number,
  ) {
    return this.portfolioService.getCarHolding(userId, carId);
  }

  @Get('car/:carId/revenue')
  @ApiOperation({ summary: 'Get per-car revenue stats for investor — includes all shareholder breakdown, earned/claimed/pending' })
  async getCarRevenueForInvestor(
    @CurrentUser('id') userId: string,
    @Param('carId', ParseIntPipe) carId: number,
  ) {
    return this.portfolioService.getCarRevenueForInvestor(userId, carId);
  }

  @Get('car/:carId/distributions')
  @ApiOperation({ summary: 'Get full distribution history for a car grouped by distribution event — for fleet owners' })
  async getCarDistributionHistory(
    @Param('carId', ParseIntPipe) carId: number,
  ) {
    return this.portfolioService.getCarDistributionHistory(carId);
  }

  @Get('car/:carId/dividends')
  @ApiOperation({ summary: 'Get dividend (received payments) history for this investor for a specific car' })
  async getInvestorCarDividendHistory(
    @CurrentUser('id') userId: string,
    @Param('carId', ParseIntPipe) carId: number,
  ) {
    return this.portfolioService.getInvestorCarDividendHistory(userId, carId);
  }

  @Get('dividends')
  @ApiOperation({ summary: 'Get dividend history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getDividends(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.portfolioService.getDividendHistory(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get all activity history (car creation, purchases, listings, etc.)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getActivityHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.portfolioService.getActivityHistory(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
