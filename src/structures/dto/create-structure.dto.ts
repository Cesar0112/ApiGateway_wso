import { Type } from 'class-transformer';
import { IsString, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class CreateStructureDto {
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
