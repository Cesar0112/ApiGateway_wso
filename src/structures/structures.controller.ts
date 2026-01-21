import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  Req,
  Query,
  Inject,
} from '@nestjs/common';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
import { CreateBulkDto } from './dto/create-bulk.dto';
import { StructuresWSO2Service } from './providers/wso2/structures_wso2.service';
import { SessionService } from 'src/session/session.service';
import { Request } from "express";
import { StructureMapper } from './structure.mapper';
import { BaseStructureServiceProvider, STRUCTURE_SERVICE_PROVIDER } from './interface/structure.interface';
@Controller('structures')
export class StructuresController {
  //FIXME Arreglar inyección de dependencias para que se cambie en tiempo de ejecución según configuración
  constructor(@Inject(STRUCTURE_SERVICE_PROVIDER) private readonly _structuresService: BaseStructureServiceProvider, private readonly sessionService: SessionService) { }
  @Post()
  async create(@Body() createStructureDto: CreateStructureDto, @Req() req: Request) {
    const structure = await this._structuresService.create(createStructureDto, await this.sessionService.getTokenFromSession(req))

    return StructureMapper.fromStructureToStructureDto(structure);
  }

  /* 2.  Carga masiva – 202 Accepted + jobId */
  @Post('bulk')
  async createBulk(@Body() createStructureDto: CreateBulkDto) {
    throw new NotFoundException();
    //    const JOB_ID = await this._structuresService.createBulk(createStructureDto);
    //  return { jobId: JOB_ID, status: 'accepted' };
  }

  /* 3.  Consultar progreso del job */
  @Get('bulk/:jobId')
  async getBulkStatus(@Param('jobId') jobId: string) {
    //return this._structuresService.getBulkStatus(jobId);
    throw new NotFoundException();
  }

  @Get()
  async findAll(@Req() req: Request) {
    const token = await this.sessionService.getTokenFromSession(req);
    const structures = await this._structuresService.findAll(token);
    return structures.map((structure) => StructureMapper.fromStructureToStructureDto(structure));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request, @Query('include') include?: string) {
    const token = await this.sessionService.getTokenFromSession(req);
    const struct = await this._structuresService.findOne(id, token, include);
    if (!struct) {
      throw new NotFoundException(`Structure with id ${id} not found`);
    }
    return StructureMapper.fromStructureToStructureDto(struct);
  }
  @Get('/by_name/:name')
  async findOneByName(@Param('name') name: string, @Req() req: Request) {
    const token = await this.sessionService.getTokenFromSession(req);
    const struct = await this._structuresService.findOneByName(name, token);
    if (!struct) {
      throw new NotFoundException(`Structure with name ${name} not found`);
    }
    return StructureMapper.fromStructureToStructureDto(struct);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStructureDto: UpdateStructureDto, @Req() req: Request
  ) {

    const token = await this.sessionService.getTokenFromSession(req);
    return StructureMapper.fromStructureToStructureDto(await this._structuresService.update(id, updateStructureDto, token));
  }
  @Patch('/by_name/:currentName')
  updateByName(
    @Param('currentName') currentName: string,
    @Body() updateStructureDto: UpdateStructureDto,
  ) {
    /*return this._structuresService.updateByCurrentName(
      currentName,
      updateStructureDto,
    );*/
    throw new NotFoundException();
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const token = await this.sessionService.getTokenFromSession(req);
    return await this._structuresService.remove(id, token);

  }
}
