import { Type } from 'class-transformer';
import { IsString, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Structure } from '../entities/structure.entity';
import { OmitType } from '@nestjs/mapped-types';

export class CreateStructureDto extends OmitType(Structure, ["id", "displayName", "parent", "children"]) {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  parentName?: string | null;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateStructureDto)
  children?: CreateStructureDto[];
}
