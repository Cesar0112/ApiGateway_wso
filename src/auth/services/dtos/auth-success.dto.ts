// auth-success.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AuthSuccessDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: ['read:reports', 'write:users'] })
  permissions: string[];

  @ApiProperty({
    example: 'Authentication successful',
  })
  message: string;
}
