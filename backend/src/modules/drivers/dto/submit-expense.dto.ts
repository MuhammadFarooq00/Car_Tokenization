import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';

export class SubmitExpenseDto {
  @ApiProperty()
  @IsInt()
  carId!: number;

  @ApiProperty({ enum: ['fuel', 'maintenance', 'cleaning', 'insurance', 'other'] })
  @IsEnum(['fuel', 'maintenance', 'cleaning', 'insurance', 'other'])
  type!: 'fuel' | 'maintenance' | 'cleaning' | 'insurance' | 'other';

  @ApiProperty({ description: 'Amount in wei' })
  @IsString()
  amount!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'IPFS CID for receipt' })
  @IsOptional()
  @IsString()
  receipt?: string;
}
