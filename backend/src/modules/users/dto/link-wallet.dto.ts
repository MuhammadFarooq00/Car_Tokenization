import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LinkWalletDto {
  @ApiProperty({ description: 'Ethereum wallet address' })
  @IsString()
  walletAddress!: string;
}
