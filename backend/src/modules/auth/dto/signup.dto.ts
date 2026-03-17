import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, Matches, IsArray, IsIn } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ required: false, example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' })
  @IsOptional()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid Ethereum address format' })
  walletAddress?: string;

  @ApiProperty({ required: false, example: ['investor', 'driver'], isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(['investor', 'car_owner', 'driver'], { each: true })
  roles?: string[];
}
