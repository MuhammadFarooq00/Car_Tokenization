import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, IsObject } from 'class-validator';

export class ApplyDriverDto {
  @ApiProperty()
  @IsInt()
  carId!: number;

  @ApiProperty()
  @IsString()
  license!: string;

  @ApiProperty({ description: 'Years of experience' })
  @IsInt()
  @Min(0)
  experience!: number;

  @ApiProperty({ description: 'Uploaded document URLs as JSON' })
  @IsObject()
  documents!: Record<string, string>;
}
