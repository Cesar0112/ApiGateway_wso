import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { UsersWSO2Service } from './services/users_wso2.service';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { ApiBody, ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import {
  AUTH_SERVICE_TOKEN,
  IAuthenticationService,
} from '../auth/auth.interface';
import { UserResponseDto } from './dto/user-response.dto';
import { UserMapper } from './user_mapper';

@Controller('users')
export class UsersController {
  constructor(
    private readonly _usersService: UsersWSO2Service,
    @Inject(AUTH_SERVICE_TOKEN)
    private readonly _authenticateService: IAuthenticationService,
  ) {}

  @Post()
  @ApiBody({ type: CreateUsersDto })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  async create(@Body() createUsersDto: CreateUsersDto, @Req() req: Request) {
    const token = await this.getTokenFromSession(req);
    const user = await this._usersService.create(createUsersDto, token);
    return UserMapper.toResponseDto(user);
  }

  @ApiOkResponse({ type: [UserResponseDto] })
  @Get()
  async findAll(@Req() req: Request): Promise<UserResponseDto[]> {
    const token = await this.getTokenFromSession(req);
    const users = await this._usersService.findAll(token);
    return UserMapper.toResponseList(users);
  }

  @ApiOkResponse({ type: UserResponseDto })
  @Get(':id')
  async findById(@Param('id') id: string, @Req() req: Request) {
    const token = await this.getTokenFromSession(req);
    const user = await this._usersService.findById(id, token);
    return UserMapper.toResponseDto(user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUsersDto: UpdateUsersDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const token = await this.getTokenFromSession(req);
    const user = await this._usersService.update(id, updateUsersDto, token);
    return UserMapper.toResponseDto(user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const token = await this.getTokenFromSession(req);
    return this._usersService.remove(id, token);
  }

  @Get('by-username/:username')
  async findByUsername(
    @Param('username') username: string,
    @Req() req: Request,
  ) {
    const token = await this.getTokenFromSession(req);
    const user = await this._usersService.findByUsername(username, token);
    return UserMapper.toResponseDto(user);
  }

  @Patch('by-username/:username')
  async updateByUsername(
    @Param('username') username: string,
    @Body() updateUsersDto: UpdateUsersDto,
    @Req() req: Request,
  ) {
    const token = await this.getTokenFromSession(req);
    const user = await this._usersService.updateByUsername(
      username,
      updateUsersDto,
      token,
    );
    return UserMapper.toResponseDto(user);
  }

  @Delete('by-username/:username')
  async removeByUsername(
    @Param('username') username: string,
    @Req() req: Request,
  ) {
    const token = await this.getTokenFromSession(req);
    return this._usersService.removeByUsername(username, token);
  }
  private async getTokenFromSession(req: Request): Promise<string> {
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
  }
}
//TODO Terminar esta clase para que la hereden todos los controladores que necesiten el token de un usuario dado su sessionId
/*export class ControllerWithTokenFromSessionID {
  private async getTokenFromSession(req: Request): Promise<string> {
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
  }
}*/
