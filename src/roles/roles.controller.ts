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
  HttpException,
  Inject,
  Req,
} from '@nestjs/common';
import { RoleWSO2Service } from './services/role_wso2.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SessionTokenGuard } from '../guards/session-token.guard';
import { AUTH_SERVICE_TOKEN, IAuthenticationService } from 'src/auth/auth.interface';
import { Request } from 'express';
import { RoleMapper } from './role.mapper';
@Controller('roles')
@UseGuards(SessionTokenGuard)
export class RolesController {
  constructor(private readonly _rolesService: RoleWSO2Service,
    @Inject(AUTH_SERVICE_TOKEN)
    private readonly authenticateService: IAuthenticationService) { }

  @Post()
  // Añadir "Req" a las importaciones desde '@nestjs/common'
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @Req() req: Request,
  ) {
    try {
      const sessionId = req.sessionID || req.session?.id;
      if (!sessionId) {
        throw new HttpException('Session ID not found', HttpStatus.UNAUTHORIZED);
      }

      const token = await this.authenticateService.getTokenOfSessionId(sessionId);
      if (!token) {
        throw new HttpException('Token not found for session', HttpStatus.UNAUTHORIZED);
      }

      return await this._rolesService.createRole(RoleMapper.fromCreateDto(createRoleDto), token);
    } catch (error: any) {
      throw new HttpException(error.message || 'Error creating role', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async getRoles(@Req() req: Request) {
    const sessionId = req.sessionID || req.session?.id;
    if (!sessionId) {
      throw new HttpException('Session ID not found', HttpStatus.UNAUTHORIZED);
    }

    const token = await this.authenticateService.getTokenOfSessionId(sessionId);
    if (!token) {
      throw new HttpException('Token not found for session', HttpStatus.UNAUTHORIZED);
    }
    return this._rolesService.getRoles(token);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // return this._rolesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    //return this._rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    //return this._rolesService.remove(id);
  }
}
