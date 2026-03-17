import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class SubmitKYCDto {
  @ApiProperty({ example: 'passport' })
  @IsString()
  documentType!: string;

  @ApiProperty({ description: 'Encrypted document URL' })
  @IsString()
  documentUrl!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  selfieUrl?: string;
}
