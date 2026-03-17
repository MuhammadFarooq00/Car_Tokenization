import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('Leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get public platform statistics' })
  async getStats() {
    return this.leaderboardService.getStats();
  }

  @Public()
  @Get('investors')
  @ApiOperation({ summary: 'Get top investors' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopInvestors(@Query('limit') limit?: string) {
    return this.leaderboardService.getTopInvestors(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Public()
  @Get('owners')
  @ApiOperation({ summary: 'Get top car owners' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopOwners(@Query('limit') limit?: string) {
    return this.leaderboardService.getTopOwners(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Public()
  @Get('drivers')
  @ApiOperation({ summary: 'Get top drivers' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopDrivers(@Query('limit') limit?: string) {
    return this.leaderboardService.getTopDrivers(
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
