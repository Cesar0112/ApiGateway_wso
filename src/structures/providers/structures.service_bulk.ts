import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStructureDto } from '../dto/create-structure.dto';
import { UpdateStructureDto } from '../dto/update-structure.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Structure } from '../entities/structure.entity';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CreateBulkDto } from '../dto/create-bulk.dto';
@Injectable()
export class StructuresService {
  constructor(
    @InjectRepository(Structure)
    private readonly _structureRepository: Repository<Structure>,
    @InjectQueue('structure-bulk') private _bulkQueue: Queue,
  ) { }
  /* 1.  Jerarquía pequeña (cascade) */
  async create(createStructureDto: CreateStructureDto): Promise<Structure> {
    const newStructure = this._structureRepository.create({
      ...createStructureDto,
      children: createStructureDto.children?.map((child) =>
        this._structureRepository.create(child),
      ),
    });
    return await this._structureRepository.save(newStructure);
  }
  /* 2.  Carga masiva – encola job y devuelve ID */
  async createBulk(dto: CreateBulkDto): Promise<number> {
    const job = await this._bulkQueue.add('import', dto, {
      removeOnComplete: true,
      removeOnFail: false,
    });
    return job.id as number;
  }
  /* 3.  Estado del job */
  async getBulkStatus(
    jobId: string,
  ): Promise<{ progress: number; status: string }> {
    const job = await this._bulkQueue.getJob(jobId);
    if (!job) throw new NotFoundException('Job no encontrado');
    return {
      progress: job.progress(),
      status: await job.getState(),
    };
  }
  /* 4.  Hijo puntual */
  async createChild(
    parentId: string,
    dto: CreateStructureDto,
  ): Promise<Structure> {
    const parent = await this._structureRepository.findOneBy({ id: parentId });
    if (!parent) throw new NotFoundException(`Parent ${parentId} not found`);
    const child = this._structureRepository.create({ ...dto, parent });
    return this._structureRepository.save(child);
  }
  async findAll(): Promise<Structure[]> {
    return this._structureRepository.find({
      relations: ['parent', 'children'], // carga árbol completo
    });
  }

  async findOne(id: string): Promise<Structure> {
    const structure = await this._structureRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!structure) throw new NotFoundException(`Structure ${id} not found`);
    return structure;
  }
  async findOneByName(name: string): Promise<Structure> {
    const structure = await this._structureRepository.findOne({
      where: { name },
      relations: ['parent', 'children'],
    });
    if (!structure) throw new NotFoundException(`Structure ${name} not found`);
    return structure;
  }

  /*FIXME Tengo que arreglar updateStructureDto porque cuando lo intento estandarizar entre 
    los distintos servicios me da errores descomentar las lineas de codigo siguiente para que lo veas 
  */
  /*async update(
    id: string,
    updateStructureDto: UpdateStructureDto,
  ): Promise<Structure> {
    const structure = await this.findOne(id); // lanza 404 si no existe
    this._structureRepository.merge(structure, updateStructureDto); // aplica cambios
    return this._structureRepository.save(structure); // persistencia + eventos
  }/*
  /*async updateByCurrentName(
    CurrentName: string,
    updateStructureDto: UpdateStructureDto,
  ): Promise<Structure> {
    const structure: Structure = await this.findOneByName(CurrentName); // lanza 404 si no existe
    this._structureRepository.merge(structure, updateStructureDto); // aplica cambios
    return this._structureRepository.save(structure); // persistencia + eventos
  }*/

  async remove(id: string): Promise<void> {
    const structure = await this.findOne(id);
    await this._structureRepository.remove(structure);
  }
}
