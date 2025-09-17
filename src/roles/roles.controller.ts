import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SessionTokenGuard } from '../guards/session-token.guard';

@Controller('roles')
@UseGuards(SessionTokenGuard)
export class RolesController {
  constructor(private readonly _rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this._rolesService.create(createRoleDto);
  }

  @Get()
  findAll() {
    return this._rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this._rolesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this._rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this._rolesService.remove(id);
  }
}
