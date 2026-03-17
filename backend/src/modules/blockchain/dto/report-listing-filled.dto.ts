import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportListingFilledDto {
  @ApiProperty({ description: 'Transaction hash from blockchain' })
  @IsString()
  txHash: string;

  @ApiProperty({ description: 'Listing ID (on-chain)' })
  @IsInt()
  @Min(0)
  listingId: number;

  @ApiProperty({ description: 'Number of shares purchased from listing' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Total cost in wei (string)' })
  @IsString()
  totalCost: string;

  @ApiProperty({ description: 'Car ID (on-chain) — needed to update buyer holdings' })
  @IsInt()
  @Min(0)
  carId: number;
}
