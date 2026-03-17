import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportCarCreatedDto {
  @ApiProperty({ description: 'Transaction hash from blockchain' })
  @IsString()
  txHash: string;

  @ApiProperty({ description: 'Car ID (on-chain)' })
  @IsInt()
  @Min(0)
  carId: number;

  @ApiProperty({ description: 'Total shares of the car' })
  @IsInt()
  @Min(1)
  totalShares: number;

  @ApiProperty({ description: 'Public supply available for sale' })
  @IsInt()
  @Min(0)
  publicSupply: number;

  @ApiProperty({ description: 'Price per share in wei (string)' })
  @IsString()
  pricePerShare: string;
}
