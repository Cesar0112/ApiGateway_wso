import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionCasdoorService } from './providers/casdoor/permission.casdoor.service';
import { Request } from 'express';
import { SessionService } from '../session/session.service';
import { IPermissionCasdoor } from './providers/casdoor/permission.casdoor.interface';
//TODO Crear una bifurcación para que detecte si es la autenticación local o por wso2
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly _permissionsService: PermissionCasdoorService, private readonly sessionService: SessionService) { }
  @Post()
  async create(@Body() createPermissionDto: CreatePermissionDto, @Req() req: Request) {
    const token = await this.sessionService.getTokenFromSession(req);
    return this._permissionsService.create(createPermissionDto, token);
  }
  @Post("bulk")
  async createBulk(@Body() createPermissionDtoList: CreatePermissionDto[], @Req() req: Request) {
    const token = await this.sessionService.getTokenFromSession(req);

    await Promise.all(createPermissionDtoList.map(async (createPermissionDto) => {
      await this._permissionsService.create(createPermissionDto, token);
    }));

  }

  @Get()
  async findAll(@Req() req: Request) {
    const token = await this.sessionService.getTokenFromSession(req);
    return this._permissionsService.findAll(token);
  }

  /*  @Get(':value')
    findOne(@Param('value') value: string) {
      return this._permissionsService.findOne(value);
    }
  
    @Patch(':value')
    update(
      @Param('value') value: string,
      @Body() updatePermissionDto: UpdatePermissionDto,
    ) {
      return this._permissionsService.update(value, updatePermissionDto);
    }
  
    @Delete(':value')
    remove(@Param('value') value: string) {
      return this._permissionsService.remove(value);
    }*/
}
