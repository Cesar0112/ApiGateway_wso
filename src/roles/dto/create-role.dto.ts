import {
  IsString,
  MinLength,
  IsArray,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @ApiProperty({ example: 'admin' })
  name!: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String], example: ['user:read', 'user:write'] })
  permissionIds?: string[]; // solo IDs o nombres de permisos
}
