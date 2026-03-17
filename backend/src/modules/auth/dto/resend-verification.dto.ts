import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({ description: 'Email address to resend verification link to' })
  @IsEmail()
  email!: string;
}
