import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Public()
  @Get('listings')
  @ApiOperation({ summary: 'Get active marketplace listings' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getActiveListings(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.getActiveListings(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 12,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('listings/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user active listings' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getMyListings(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.getUserListings(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Get('listings/:id')
  @ApiOperation({ summary: 'Get listing details' })
  async getListingById(@Param('id', ParseIntPipe) id: number) {
    return this.marketplaceService.getListingById(id);
  }

  @Public()
  @Get('cost/:listingId/:amount')
  @ApiOperation({ summary: 'Calculate cost for buying from a listing' })
  async calculateCost(
    @Param('listingId', ParseIntPipe) listingId: number,
    @Param('amount', ParseIntPipe) amount: number,
  ) {
    return this.marketplaceService.calculateCost(listingId, amount);
  }

  @Public()
  @Get('next-listing-id')
  @ApiOperation({ summary: 'Get next listing ID from smart contract' })
  async getNextListingId() {
    return this.marketplaceService.getNextListingId();
  }

  @Public()
  @Get('fee')
  @ApiOperation({ summary: 'Get global platform fee in basis points' })
  async getGlobalFee() {
    return this.marketplaceService.getGlobalFee();
  }

  @UseGuards(JwtAuthGuard)
  @Get('trades/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user trade history' })
  async getMyTradeHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.getUserTradeHistory(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Get('trades/:carId')
  @ApiOperation({ summary: 'Get trade history for a car' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTradeHistory(
    @Param('carId', ParseIntPipe) carId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.getTradeHistory(
      carId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
