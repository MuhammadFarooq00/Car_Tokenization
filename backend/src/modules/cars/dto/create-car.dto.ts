import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min } from 'class-validator';

export class CreateCarDto {
  @ApiProperty()
  @IsInt()
  id!: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  make!: string;

  @ApiProperty()
  @IsString()
  model!: string;

  @ApiProperty()
  @IsInt()
  @Min(1900)
  year!: number;

  @ApiProperty()
  @IsString()
  vin!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  totalShares!: number;

  @ApiProperty()
  @IsString()
  pricePerShare!: string;

  @ApiProperty()
  @IsString()
  metadataCID!: string;
}
