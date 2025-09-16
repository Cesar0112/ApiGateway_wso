// dto/create-user.dto.ts
import {
  IsString,
  MinLength,
  IsEmail,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUsersDto {
  @IsString()
  @MinLength(3)
  @ApiProperty({ example: 'jdoe' })
  username!: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ example: 'a8*f14d5h?yu89l*_Secr3t!' })
  plainCipherPassword!: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ example: 'jdoe@corp.com' })
  email?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ default: true })
  isActive?: boolean = true;

  /*  Relaciones: solo IDs (strings)  */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String], example: ['admin', 'viewer'] })
  roleIds?: string[]; // nombres o UUIDs de roles

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  @ApiPropertyOptional({
    type: [String],
    example: ['uuid-str-1', 'uuid-str-2'],
  })
  structureIds?: string[]; // UUIDs de estructuras
}
