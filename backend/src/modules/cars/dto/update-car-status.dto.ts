import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CarStatus } from '@prisma/client';

export class UpdateCarStatusDto {
  @ApiProperty({ enum: CarStatus })
  @IsEnum(CarStatus)
  status!: CarStatus;
}
