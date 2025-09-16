import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStructureDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  // Usuarios que pertenecen a esta estructura
  @IsOptional()
  @IsArray()
  usersIds?: string[];

  // Estructuras hijas (recursivo)
  @IsOptional()
  @IsArray()
  childrenIds?: string[];
}
