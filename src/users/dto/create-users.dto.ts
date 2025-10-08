// dto/create-user.dto.ts
import {
  IsString,
  MinLength,
  IsEmail,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OneOf } from 'src/common/decorators/one-of.decorator';

@OneOf({ properties: ['rolesNames', 'roleIds'], allowAllEmpty: true })
@OneOf({ properties: ['structureNames', 'structureIds'], allowAllEmpty: true })
export class CreateUsersDto {
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @IsString()
  @MinLength(3)
  @ApiProperty({ example: 'jdoe' })
  username!: string;

  @IsString()
  @ApiProperty({ example: 'a8*f14d5h?yu89l*_Secr3t!' })
  plainCipherPassword!: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @ApiPropertyOptional({ example: 'Carlos' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @ApiPropertyOptional({ example: 'Perez' })
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ example: 'jdoe@corp.com' })
  email?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ default: true })
  isActive?: boolean = true;

  /* XOR grupo 1 */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String], example: ['admin', 'viewer'] })
  rolesNames?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  @ApiPropertyOptional({ type: [String], example: ['uuid-1', 'uuid-2'] })
  roleIds?: string[];

  /* XOR grupo 2 */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String], example: ['HQ', 'Store'] })
  structureNames?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ApiPropertyOptional({ type: [String], example: ['uuid-3', 'uuid-4'] })
  structureIds?: string[];
}
