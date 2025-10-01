import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateStructureDto } from './create-structure.dto';
import { Type } from 'class-transformer';

export class UpdateStructureDto {
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
