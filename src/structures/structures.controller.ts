import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StructuresService } from './services/structures.service';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
import { CreateBulkDto } from './dto/create-bulk.dto';

@Controller('structures')
export class StructuresController {
  constructor(private readonly _structuresService: StructuresService) { }

  /* 1.  Jerarquía pequeña (≤ 20 nodos) – 1 HTTP call */
  @Post()
  create(@Body() createStructureDto: CreateStructureDto) {
    return this._structuresService.create(createStructureDto);
  }

  /* 2.  Carga masiva – 202 Accepted + jobId */
  @Post('bulk')
  async createBulk(@Body() createStructureDto: CreateBulkDto) {
    const JOB_ID = await this._structuresService.createBulk(createStructureDto);
    return { jobId: JOB_ID, status: 'accepted' };
  }

  /* 3.  Consultar progreso del job */
  @Get('bulk/:jobId')
  async getBulkStatus(@Param('jobId') jobId: string) {
    return this._structuresService.getBulkStatus(jobId);
  }

  /* 4.  Nodo a nodo (edición puntual) */
  @Post(':id/children')
  createChild(
    @Param('id') parentId: string,
    @Body() createStructureDto: CreateStructureDto,
  ) {
    return this._structuresService.createChild(parentId, createStructureDto);
  }

  @Get()
  findAll() {
    return this._structuresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this._structuresService.findOne(id);
  }
  @Get(':name')
  findOneByName(@Param('name') name: string) {
    return this._structuresService.findOneByName(name);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStructureDto: UpdateStructureDto,
  ) {
    return this._structuresService.update(id, updateStructureDto);
  }
  @Patch(':currentName')
  updateByName(
    @Param('currentName') currentName: string,
    @Body() updateStructureDto: UpdateStructureDto,
  ) {
    return this._structuresService.updateByCurrentName(
      currentName,
      updateStructureDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this._structuresService.remove(id);
  }
}
