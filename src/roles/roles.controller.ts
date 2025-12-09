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
  HttpException, Req,
  Inject
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SessionGuard } from '../guards/session.guard';
import { Request } from 'express';
import { RoleMapper } from './role.mapper';
import { SessionService } from '../session/session.service';
import { IRoleServiceProvider, ROLE_SERVICE_PROVIDER_TOKEN } from './interfaces/role.service.interface';
@Controller('roles')
@UseGuards(SessionGuard)
export class RolesController {
  constructor(
    @Inject(ROLE_SERVICE_PROVIDER_TOKEN) private readonly _rolesService: IRoleServiceProvider,
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
