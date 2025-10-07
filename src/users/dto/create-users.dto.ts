// dto/create-user.dto.ts
import {
  IsString,
  MinLength,
  IsEmail,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsBoolean,
  IsUUID,
  ValidateIf,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUsersDto {
  @IsString()
  @MinLength(3)
  @ApiProperty({ example: 'jdoe' })
  username!: string;

  @IsString()
  @ApiProperty({ example: 'a8*f14d5h?yu89l*_Secr3t!' })
  plainCipherPassword!: string;

  @IsString()
  @MinLength(3)
  @ApiProperty({ example: 'Carlos' })
  firstName?: string;

  @IsString()
  @MinLength(3)
  @ApiProperty({ example: 'Perez' })
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ example: 'jdoe@corp.com' })
  email?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ default: true })
  isActive?: boolean = true;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  @ValidateIf((o) => !!o.roleIds)
  @ApiPropertyOptional({ type: [String], example: ['admin', 'viewer'] })
  rolesNames?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @IsUUID('all', { each: true })
  @ValidateIf((o) => !!o.rolesNames)
  @ApiPropertyOptional({ type: [String], example: ['uuid-1', 'uuid-2'] })
  roleIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  @ValidateIf((o) => !!o.structureIds)
  @ApiPropertyOptional({
    type: [String],
    example: ['Sede Central', 'Sede Norte'],
  })
  structureNames?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @IsUUID('all', { each: true })
  @ValidateIf((o) => !!o.structureNames)
  @ApiPropertyOptional({
    type: [String],
    example: ['uuid-str-1', 'uuid-str-2'],
  })
  structureIds?: string[];
}
