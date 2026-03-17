import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BlockchainReportService } from './blockchain-report.service';
import {
  ReportPrimaryPurchaseDto,
  ReportListingCreatedDto,
  ReportListingFilledDto,
  ReportListingCancelledDto,
  ReportCarCreatedDto,
  ReportEarningsDistributedDto,
  ReportPublicSupplyWithdrawnDto,
} from './dto/index';

@ApiTags('Blockchain Reports')
@Controller('blockchain/report')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BlockchainController {
  private readonly logger = new Logger(BlockchainController.name);

  constructor(private readonly reportService: BlockchainReportService) {}

  @Post('car-created')
  @ApiOperation({ summary: 'Report a car creation tx — creates ShareHolding + Transaction' })
  async reportCarCreated(
    @CurrentUser('id') userId: string,
    @Body() dto: ReportCarCreatedDto,
  ) {
    this.logger.log(`User ${userId} reporting car-created tx: ${dto.txHash}`);
    return this.reportService.reportCarCreated(userId, dto);
  }

  @Post('primary-purchase')
  @ApiOperation({ summary: 'Report a primary share purchase tx' })
  async reportPrimaryPurchase(
    @CurrentUser('id') userId: string,
    @Body() dto: ReportPrimaryPurchaseDto,
  ) {
    this.logger.log(`User ${userId} reporting primary-purchase tx: ${dto.txHash}`);
    return this.reportService.reportPrimaryPurchase(userId, dto);
  }

  @Post('listing-created')
  @ApiOperation({ summary: 'Report a listing creation tx' })
  async reportListingCreated(
    @CurrentUser('id') userId: string,
    @Body() dto: ReportListingCreatedDto,
  ) {
    this.logger.log(`User ${userId} reporting listing-created tx: ${dto.txHash}`);
    return this.reportService.reportListingCreated(userId, dto);
  }

  @Post('listing-filled')
  @ApiOperation({ summary: 'Report a listing fill (secondary purchase) tx' })
  async reportListingFilled(
    @CurrentUser('id') userId: string,
    @Body() dto: ReportListingFilledDto,
  ) {
    this.logger.log(`User ${userId} reporting listing-filled tx: ${dto.txHash}`);
    return this.reportService.reportListingFilled(userId, dto);
  }

  @Post('listing-cancelled')
  @ApiOperation({ summary: 'Report a listing cancellation tx' })
  async reportListingCancelled(
    @CurrentUser('id') userId: string,
    @Body() dto: ReportListingCancelledDto,
  ) {
    this.logger.log(`User ${userId} reporting listing-cancelled tx: ${dto.txHash}`);
    return this.reportService.reportListingCancelled(userId, dto);
  }

  @Post('earnings-distributed')
  @ApiOperation({
    summary:
      'Report on-chain earnings distribution — creates Dividend records + notifies shareholders',
  })
  async reportEarningsDistributed(
    @CurrentUser('id') userId: string,
    @Body() dto: ReportEarningsDistributedDto,
  ) {
    this.logger.log(
      `User ${userId} reporting earnings-distributed for car ${dto.carId.toString()}`,
    );
    return this.reportService.reportEarningsDistributed(userId, dto);
  }

  @Post('public-supply-withdrawn')
  @ApiOperation({
    summary:
      'Report withdrawPublicSupply tx — closes primary sale, assigns unsold shares to owner, notifies assigned driver',
  })
  async reportPublicSupplyWithdrawn(
    @CurrentUser('id') userId: string,
    @Body() dto: ReportPublicSupplyWithdrawnDto,
  ) {
    this.logger.log(
      `User ${userId} reporting public-supply-withdrawn for car ${dto.carId.toString()}`,
    );
    return this.reportService.reportPublicSupplyWithdrawn(userId, dto);
  }
}
