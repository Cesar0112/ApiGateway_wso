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
} from '@nestjs/common';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
import { CreateBulkDto } from './dto/create-bulk.dto';
import { StructuresWSO2Service } from './services/structures_wso2.service';
import { SessionService } from 'src/session/session.service';
import { Request } from "express";
import { StructureMapper } from './structure.mapper';
@Controller('structures')
export class StructuresController {
  constructor(private readonly _structuresService: StructuresWSO2Service, private readonly sessionService: SessionService) { }
  //FIXME Arreglar que no se mande la entidad estructura sino un dto de estructura, osea aquí hay que mapear similar a como se hace en el controller
  /* 1.  Jerarquía pequeña (≤ 20 nodos) – 1 HTTP call */
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
    return (await this._structuresService.findAll(token)).map((s) => StructureMapper.fromStructureToStructureDto(s));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request, @Query('include') include?: string) {
    const token = await this.sessionService.getTokenFromSession(req);
    return StructureMapper.fromStructureToStructureDto(await this._structuresService.findOne(id, token, include));

  }
  @Get('/by_name/:name')
  async findOneByName(@Param('name') name: string, @Req() req: Request) {
    const token = await this.sessionService.getTokenFromSession(req);
    return StructureMapper.fromStructureToStructureDto(await this._structuresService.findOneByName(name, token));
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
