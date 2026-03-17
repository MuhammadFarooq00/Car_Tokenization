import { IsString, IsInt, IsArray, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportEarningsDistributedDto {
  @ApiProperty({ description: 'Transaction hash from blockchain' })
  @IsString()
  txHash: string;

  @ApiProperty({ description: 'Car ID (on-chain)' })
  @IsInt()
  @Min(1)
  carId: number;

  @ApiProperty({ description: 'Total amount distributed in wei (string)' })
  @IsString()
  totalAmount: string;

  @ApiProperty({ description: 'Block number of the transaction' })
  @IsInt()
  blockNumber: number;

  @ApiProperty({ description: 'Per-shareholder payouts: array of { userId, amount }' })
  @IsArray()
  shareholders: Array<{ userId: string; amount: string }>;
}
