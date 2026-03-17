import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsArray, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class ReviewKYCDto {
  @ApiProperty({ enum: ['verified', 'rejected'] })
  @IsString()
  @IsIn(['verified', 'rejected'])
  status!: 'verified' | 'rejected';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

export class ReviewApplicationDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsString()
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

export class ReviewExpenseDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsString()
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';
}

export class UpdateUserRolesDto {
  @ApiProperty({ enum: UserRole, isArray: true })
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles!: UserRole[];
}

export class ReviewOnboardingRoleDto {
  @ApiProperty({
    description: 'The role to approve or reject',
    example: 'driver',
  })
  @IsString()
  @IsIn(['car_owner', 'driver'])
  role!: string;

  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsString()
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
