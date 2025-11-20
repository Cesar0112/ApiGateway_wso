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
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUsersDto } from 'src/users/dto/create-users.dto';
import { OmitType } from '@nestjs/mapped-types';
import { ICasdoorUser } from '../users.casdoor.interface';

export class CreateCasdoorUsersDto extends OmitType(CreateUsersDto, [
  'rolesNames',
  'roleIds',
  'structureNames',
  'structureIds',
] as const) implements Partial<ICasdoorUser> {

  @IsString()
  @MinLength(3)
  @ApiProperty({ example: 'jdoe' })
  userName!: string;

  @IsString()
  @ApiProperty({ example: 'a8*f14d5h?yu89l*_Secr3t!' })
  plainCipherPassword!: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @ApiPropertyOptional({ example: 'Carlos' })
  firstName: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @ApiPropertyOptional({ example: 'Perez' })
  lastName: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ example: 'jdoe@corp.com' })
  email: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ default: true })
  isActive?: boolean;

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

  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  displayName: string;
}
