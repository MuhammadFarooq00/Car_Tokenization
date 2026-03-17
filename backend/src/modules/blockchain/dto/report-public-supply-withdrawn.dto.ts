import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportPublicSupplyWithdrawnDto {
  @ApiProperty({ description: 'Transaction hash of the withdrawPublicSupply call' })
  @IsString()
  txHash: string;

  @ApiProperty({ description: 'Car ID whose public supply was withdrawn' })
  @IsInt()
  @Min(1)
  carId: number;

  @ApiProperty({ description: 'Number of shares withdrawn (the unsold public supply)' })
  @IsInt()
  @Min(0)
  amount: number;
}
