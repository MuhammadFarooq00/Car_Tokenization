import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportListingCreatedDto {
  @ApiProperty({ description: 'Transaction hash from blockchain' })
  @IsString()
  txHash: string;

  @ApiProperty({ description: 'Listing ID (on-chain)' })
  @IsInt()
  @Min(0)
  listingId: number;

  @ApiProperty({ description: 'Car ID (on-chain)' })
  @IsInt()
  @Min(0)
  carId: number;

  @ApiProperty({ description: 'Number of shares listed' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Price per share in wei (string)' })
  @IsString()
  pricePerShare: string;
}
