import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreatePermissionDto {
  @IsString()
  @MinLength(2)
  @IsNotEmpty()
  @ApiProperty({ example: 'camera:read' })
  value!: string; // será la PK y debe ser única
}
