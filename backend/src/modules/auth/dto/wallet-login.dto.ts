import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class WalletNonceDto {
  @ApiProperty({ example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid Ethereum address format' })
  walletAddress!: string;
}

export class WalletLoginDto {
  @ApiProperty({ description: 'SIWE message string' })
  @IsString()
  message!: string;

  @ApiProperty({ description: 'Wallet signature of the message' })
  @IsString()
  signature!: string;
}
