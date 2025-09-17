// dto/create-bulk.dto.ts (plano)
import { IsArray, ValidateNested, IsString, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

class FlatNode {
  @IsString() name: string;
  /* uno de los dos obligatorio, no ambos */
  @IsString()
  @ValidateIf((o: FlatNode) => !o.parentId) // solo si NO hay parentId
  parentName?: string;

  @IsString()
  @ValidateIf((o: FlatNode) => !o.parentName) // solo si NO hay parentName
  parentId?: string;
}

export class CreateBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlatNode)
  structures: FlatNode[];
}
