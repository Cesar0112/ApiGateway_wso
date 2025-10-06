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
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { StructuresService } from './services/structures.service';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
import { CreateBulkDto } from './dto/create-bulk.dto';
import { StructuresWSO2Service } from './services/structures_wso2.service';

@Controller('structures')
export class StructuresController {
  constructor(private readonly _structuresService: StructuresWSO2Service) {}

  /* 1.  Jerarquía pequeña (≤ 20 nodos) – 1 HTTP call */
  @Post()
  create(@Body() createStructureDto: CreateStructureDto) {
    throw new NotFoundException();
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

  /* 4.  Nodo a nodo (edición puntual) */
  @Post(':id/children')
  createChild(
    @Param('id') parentId: string,
    @Body() createStructureDto: CreateStructureDto,
  ) {
    //    return this._structuresService.createChild(parentId, createStructureDto);
    throw new NotFoundException();
  }

  @Get()
  findAll(@Req() req: Request) {
    //const token = await this.getTokenFromSession(req);
    //return this._structuresService.findAll();
    throw new NotFoundException();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    //  return this._structuresService.findOne(id);
    throw new NotFoundException();
  }
  @Get(':name')
  findOneByName(@Param('name') name: string) {
    //return this._structuresService.findOneByName(name);
    throw new NotFoundException();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStructureDto: UpdateStructureDto,
  ) {
    //return this._structuresService.update(id, updateStructureDto);
    throw new NotFoundException();
  }
  @Patch(':currentName')
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
  remove(@Param('id') id: string) {
    //    return this._structuresService.remove(id);
    throw new NotFoundException();
  }
  /*private async getTokenFromSession(req: Request): Promise<string> {
    const sessionId = req.sessionID || req.session?.id;
    if (!sessionId) {
      throw new HttpException('Session ID not found', HttpStatus.UNAUTHORIZED);
    }

    const token =
      await this._authenticateService.getTokenOfSessionId(sessionId);
    if (!token) {
      throw new HttpException(
        'Token not found for session',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return token;
  }*/
}
