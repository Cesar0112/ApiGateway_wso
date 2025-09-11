import { Injectable } from '@nestjs/common';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';

@Injectable()
export class StructuresService {
  create(createStructureDto: CreateStructureDto) {
    return 'This action adds a new structure';
  }

  findAll() {
    return `This action returns all structures`;
  }

  findOne(id: number) {
    return `This action returns a #${id} structure`;
  }

  update(id: number, updateStructureDto: UpdateStructureDto) {
    return `This action updates a #${id} structure`;
  }

  remove(id: number) {
    return `This action removes a #${id} structure`;
  }
}
