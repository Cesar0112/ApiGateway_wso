import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { ApiBody, ApiResponse } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly _usersService: UsersService) {}
  @Post()
  @ApiBody({ type: CreateUsersDto })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  create(@Body() createUsersDto: CreateUsersDto) {
    return this._usersService.create(createUsersDto);
  }

  @Get()
  findAll() {
    return this._usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this._usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsers2Dto: UpdateUsersDto) {
    return this._usersService.update(+id, updateUsers2Dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this._usersService.remove(+id);
  }
}
