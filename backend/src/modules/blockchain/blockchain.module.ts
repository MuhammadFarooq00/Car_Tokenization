import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainReportService } from './blockchain-report.service';
import { BlockchainController } from './blockchain.controller';

@Module({
  controllers: [BlockchainController],
  providers: [BlockchainService, BlockchainReportService],
  exports: [BlockchainService, BlockchainReportService],
})
export class BlockchainModule {}
