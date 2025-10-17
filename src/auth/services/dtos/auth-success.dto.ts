// auth-success.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';

export class AuthSuccessDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: ['read:reports', 'write:users'] })
  permissions: string[];

  @ApiProperty({
    example: {
      userName: "Pepito",
    }
  })
  user: User;

  @ApiProperty({
    example: 'Authentication successful',
  })
  message: string;
}
