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
import { UsersWSO2Service } from './providers/wso2/users_wso2.service';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { ApiBody, ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import {
  AUTH_SERVICE_TOKEN
} from '../auth/auth.interface';
import { UserResponseDto } from './dto/user-response.dto';
import { UserMapper } from './providers/user.mapper';
import { SessionService } from 'src/session/session.service';
import { IUsersService, USERS_SERVICE_PROVIDER_TOKEN } from './interfaces/users.interface.service';

@Controller('users')
export class UsersController {
  constructor(
    @Inject(USERS_SERVICE_PROVIDER_TOKEN)
    private readonly _usersService: IUsersService,
    @Inject(AUTH_SERVICE_TOKEN)
    private readonly sessionService: SessionService,
  ) { }

  @Post()
  @ApiBody({ type: CreateUsersDto })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  async create(@Body() createUsersDto: CreateUsersDto, @Req() req: Request) {
    const token = await this.sessionService.getTokenFromSession(req);
    const user = await this._usersService.create(createUsersDto, token);
    return UserMapper.toResponseDto(user);
  }

  @ApiOkResponse({ type: [UserResponseDto] })
  @Get()
  async findAll(@Req() req: Request): Promise<UserResponseDto[]> {
    const token = await this.sessionService.getTokenFromSession(req);
    const users = await this._usersService.getUsers(token);
    return UserMapper.toResponseList(users);
  }

  @ApiOkResponse({ type: UserResponseDto })
  @Get(':id')
  async findById(@Param('id') id: string, @Req() req: Request) {
    const token = await this.sessionService.getTokenFromSession(req);
    const user = await this._usersService.getUserById(id, token);
    return UserMapper.toResponseDto(user);
  }

  @Patch(':id') //Es un patch pero por dentro hace put o patch segun convenga
  async update(
    @Param('id') id: string,
    @Body() updateUsersDto: UpdateUsersDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const token = await this.sessionService.getTokenFromSession(req);
    const user = await this._usersService.update(id, updateUsersDto, token);
    return UserMapper.toResponseDto(user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const token = await this.sessionService.getTokenFromSession(req);
    return this._usersService.delete(id, token);
  }

  @Get('by-username/:username')
  async findByUsername(
    @Param('username') username: string,
    @Req() req: Request,
  ) {
    const token = await this.sessionService.getTokenFromSession(req);
    const user = await this._usersService.getUserByUsername(username, token);
    return UserMapper.toResponseDto(user);
  }

  @Patch('by-username/:username')
  async updateByUsername(
    @Param('username') username: string,
    @Body() updateUsersDto: UpdateUsersDto,
    @Req() req: Request,
  ) {
    const token = await this.sessionService.getTokenFromSession(req);
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
    const token = await this.sessionService.getTokenFromSession(req);
    return this._usersService.deleteByUsername(username, token);
  }

}
