import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RemoveRoleDto {
  @ApiProperty({ enum: ['investor', 'car_owner', 'driver'] })
  @IsEnum(UserRole)
  role!: UserRole;
}
