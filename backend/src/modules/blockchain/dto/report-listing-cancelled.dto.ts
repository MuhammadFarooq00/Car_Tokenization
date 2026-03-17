import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportListingCancelledDto {
  @ApiProperty({ description: 'Transaction hash from blockchain' })
  @IsString()
  txHash: string;

  @ApiProperty({ description: 'Listing ID (on-chain)' })
  @IsInt()
  @Min(0)
  listingId: number;
}
