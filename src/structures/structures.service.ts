import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';

type Structure = CreateStructureDto & { id: number };

@Injectable()
export class StructuresService {
  private _structures: Structure[] = [];
  private _nextId = 1;

  create(createStructureDto: CreateStructureDto): Structure {
    const newStructure: Structure = {
      id: this._nextId++,
      ...createStructureDto,
    };
    this._structures.push(newStructure);
    return newStructure;
  }

  findAll(): Structure[] {
    return this._structures;
  }

  findOne(id: number): Structure {
    const structure = this._structures.find((s) => s.id === id);
    if (!structure) throw new NotFoundException(`Structure #${id} not found`);
    return structure;
  }

  update(id: number, updateStructureDto: UpdateStructureDto): Structure {
    const IDX = this._structures.findIndex((s) => s.id === id);
    if (IDX === -1) throw new NotFoundException(`Structure #${id} not found`);
    this._structures[IDX] = { ...this._structures[IDX], ...updateStructureDto };
    return this._structures[IDX];
  }

  remove(id: number): void {
    const IDX = this._structures.findIndex((s) => s.id === id);
    if (IDX === -1) throw new NotFoundException(`Structure #${id} not found`);
    this._structures.splice(IDX, 1);
  }
}
