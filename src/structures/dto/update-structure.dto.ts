import { IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';


//FIXME Cambiar por export class UpdateStructureDto extends PartialType(OmitType(CreateStructureDto, [""] as const)) {
export class UpdateStructureDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    parentName?: string | null;

    @IsOptional()
    @IsUUID("4", { each: true })
    childrenIds?: string[];

    //FIXME Tengo que arreglar este campo para que sea consistente con la actualización usando TypeORM 
    @IsOptional()
    users?: string[] | null
}
