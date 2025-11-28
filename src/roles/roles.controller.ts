import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpException, Req
} from '@nestjs/common';
import { RoleWSO2Service } from './providers/wso2/role_wso2.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SessionGuard } from '../guards/session.guard';
import { Request } from 'express';
import { RoleMapper } from './role.mapper';
import { SessionService } from 'src/session/session.service';
@Controller('roles')
@UseGuards(SessionGuard)
export class RolesController {
  constructor(
    private readonly _rolesService: RoleWSO2Service,
    private readonly sessionService: SessionService,
  ) { }

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto, @Req() req: Request) {
    try {
      const token =
        await this.sessionService.getTokenFromSession(req);

      return await this._rolesService.createRole(
        RoleMapper.fromCreateDto(createRoleDto),
        token,
      );
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error creating role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getRoles(@Req() req: Request) {
    const token = await this.sessionService.getTokenFromSession(req);
    return this._rolesService.getRoles(token);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    throw new HttpException('Not implemented', HttpStatus.NOT_IMPLEMENTED);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    throw new HttpException('Not implemented', HttpStatus.NOT_IMPLEMENTED);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    throw new HttpException('Not implemented', HttpStatus.NOT_IMPLEMENTED);
  }
}
