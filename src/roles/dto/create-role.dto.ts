import {
  IsString,
  MinLength,
  IsArray,
  ArrayMinSize,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @ApiProperty({ example: 'admin' })
  name!: string;

  @IsOptional()
  @ValidateIf((role: CreateRoleDto) => role.permissionValues === undefined)
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String], example: ['Obtener usuarios', 'Modificar usuarios'] })
  permissionDisplayableName?: string[];

  @IsOptional()
  @ValidateIf((role: CreateRoleDto) => role.permissionDisplayableName === undefined)
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ApiPropertyOptional({ type: [String], example: ['user:read', 'user:write'] })
  permissionValues?: string[];
}
