import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

//TODO Crear una bifurcación para que detecte si es la autenticación local o por wso2
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly _permissionsService: PermissionsService) {}
  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this._permissionsService.create(createPermissionDto);
  }

  @Get()
  findAll() {
    return this._permissionsService.getScopesFromApiResource('asda');
  }

  @Get(':value')
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
  }
}
