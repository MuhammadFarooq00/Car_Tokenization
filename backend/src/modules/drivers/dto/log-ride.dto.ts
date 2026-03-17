import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsNumber, Min } from 'class-validator';

export class LogRideDto {
  @ApiProperty()
  @IsInt()
  carId!: number;

  @ApiProperty()
  @IsString()
  pickup!: string;

  @ApiProperty()
  @IsString()
  dropoff!: string;

  @ApiProperty({ description: 'Distance in km' })
  @IsNumber()
  @Min(0)
  distance!: number;

  @ApiProperty({ description: 'Duration in minutes' })
  @IsInt()
  @Min(0)
  duration!: number;

  @ApiProperty({ description: 'Gross earnings in wei' })
  @IsString()
  grossEarnings!: string;
}
