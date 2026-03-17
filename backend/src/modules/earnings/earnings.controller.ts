import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EarningsService } from './earnings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Earnings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('earnings')
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get()
  @ApiOperation({ summary: 'Get earnings summary across all roles' })
  async getSummary(@CurrentUser('id') userId: string) {
    return this.earningsService.getEarningsSummary(userId);
  }

  @Get('breakdown')
  @ApiOperation({ summary: 'Get earnings breakdown by period' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year'] })
  async getBreakdown(
    @CurrentUser('id') userId: string,
    @Query('period') period?: 'week' | 'month' | 'year',
  ) {
    return this.earningsService.getEarningsBreakdown(userId, period || 'month');
  }
}
