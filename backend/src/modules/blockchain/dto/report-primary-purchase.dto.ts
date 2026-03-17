import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportPrimaryPurchaseDto {
  @ApiProperty({ description: 'Transaction hash from blockchain' })
  @IsString()
  txHash: string;

  @ApiProperty({ description: 'Car ID (on-chain)' })
  @IsInt()
  @Min(0)
  carId: number;

  @ApiProperty({ description: 'Number of shares purchased' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Total cost in wei (string)' })
  @IsString()
  totalCost: string;
}
