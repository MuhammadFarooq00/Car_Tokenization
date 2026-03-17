import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, ArrayNotEmpty } from 'class-validator';

// Roles the user can request during onboarding (admin excluded)
const ALLOWED_ROLES = ['investor', 'car_owner', 'driver'] as const;

export class CompleteOnboardingDto {
  @ApiProperty({
    description: 'Roles to assign based on questionnaire answers',
    example: ['investor', 'driver'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ALLOWED_ROLES, { each: true })
  roles!: string[];
}
