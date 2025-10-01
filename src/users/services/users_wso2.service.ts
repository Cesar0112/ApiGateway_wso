// src/users/services/users.wso2.service.ts
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as https from 'https';
import { ConfigService } from '../../config/config.service';
import { User } from '../entities/user.entity';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UpdateUsersDto } from '../dto/update-users.dto';
import { UserMapper } from '../user_mapper';
import { Role } from 'src/roles/entities/role.entity';
import { RoleWSO2Service } from 'src/roles/services/role_wso2.service';
import { EncryptionsService } from 'src/encryptions/encryptions.service';
import { StructuresService } from 'src/structures/services/structures.service';



@Injectable()
export class UsersWSO2Service {
  private readonly _logger = new Logger(UsersWSO2Service.name);
  private readonly _baseUrl: string;

  constructor(private readonly _configService: ConfigService, private readonly _rolesService: RoleWSO2Service, private readonly _encryptionsService: EncryptionsService, private readonly _structureService: StructuresService) {
    const wso2Config = this._configService.getConfig().WSO2;
    this._baseUrl = `${wso2Config.HOST}:${wso2Config.PORT}/scim2/Users`;
  }

  private _getRequestOptions(token: string): AxiosRequestConfig {
    return {
      proxy: false as const,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized:
          this._configService.getConfig().NODE_ENV === 'production',
      }),
    };
  }
  private async _buildRolesMap(token: string): Promise<Map<string, Role>> {
    try {
      const roles = await this._rolesService.getRoles(token); // devuelve Role[] con permissions si tu RoleMapper lo hace
      const map = new Map<string, Role>();
      roles.forEach((r) => {
        if (r?.id) map.set(r.id, r);
      });
      return map;
    } catch (err) {
      this._logger.warn('No se pudieron obtener roles para enriquecer usuarios (seguir sin permisos de rol).', err);
      return new Map();
    }
  }
  async create(dto: CreateUsersDto, token: string): Promise<User> {
    try {
      dto.plainCipherPassword = this._encryptionsService.decrypt(dto.plainCipherPassword);
      // 1. Crear usuario en SCIM2
      const payload = UserMapper.fromCreateUsersDtoToWSO2Payload(dto);
      const resCreateResponse: AxiosResponse<any> = await axios.post(
        this._baseUrl,
        payload,
        this._getRequestOptions(token),
      );
      const createdUser = resCreateResponse.data;
      //const rolesMap = await this._buildRolesMap(token);
      const roles = await this._rolesService.getUserRoles(createdUser.id, token);
      const structures = await this._structureService.findByIds(dto.structureIds);
      return UserMapper.fromWSO2ResponseToUser(createdUser, roles, structure.map((s) => s));
    } catch (err: any) {
      this._logger.error('Error creando usuario en WSO2', err);
      if (err.response?.status === 409) {
        throw new ConflictException('Usuario ya existe');
      }
      throw new InternalServerErrorException('No se pudo crear el usuario');
    }
  }

  async findAll(token: string): Promise<User[]> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        this._baseUrl,
        this._getRequestOptions(token),
      );
      const rolesMap = await this._buildRolesMap(token);
      const resources = res.data?.Resources ?? [];
      return resources.map((u: any) => UserMapper.fromResponse(u, rolesMap));
    } catch (err) {
      this._logger.error('Error obteniendo usuarios en WSO2', err);
      throw new InternalServerErrorException('No se pudieron obtener usuarios');
    }
  }

  async findById(id: string, token: string): Promise<User> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}/${(id)}`,
        this._getRequestOptions(token),
      );
      const rolesMap = await this._buildRolesMap(token);
      return UserMapper.fromWSO2Response(res.data, rolesMap);
    } catch (err) {
      if (err.response?.status === 404) {
        throw new NotFoundException(`Usuario ${id} no encontrado`);
      }
      this._logger.error(`Error obteniendo usuario ${id}`, err);
      throw new InternalServerErrorException('No se pudo obtener el usuario');
    }
  }

  async findByUsername(username: string, token: string): Promise<User> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}?filter=userName eq "${username}"`,
        this._getRequestOptions(token),
      );
      const userData = res.data?.Resources?.[0];
      if (!userData) throw new NotFoundException(`Usuario ${username} no encontrado`);
      const rolesMap = await this._buildRolesMap(token);
      return UserMapper.fromWSO2Response(userData, rolesMap);
    } catch (err) {
      this._logger.error(`Error buscando usuario por username ${username}`, err);
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('No se pudo obtener el usuario');
    }
  }

  async update(id: string, dto: UpdateUsersDto, token: string): Promise<User> {
    try {
      const payload = UserMapper.toWSO2PayloadForUpdate(dto);
      const res: AxiosResponse<any> = await axios.put(
        `${this._baseUrl}/${(id)}`,
        payload,
        this._getRequestOptions(token),
      );
      let rolesMap: Role[];
      if (dto.id) {
        rolesMap = await this._rolesService.getUserRoles(dto.id, token);
      } else if (dto.username) {
        rolesMap = await this._rolesService.getUserRolesByUsername(dto.username, token);
      }
      return UserMapper.fromWSO2ResponseToUser(res.data, rolesMap);
    } catch (err) {
      this._logger.error(`Error actualizando usuario ${id}`, err);
      throw new InternalServerErrorException('No se pudo actualizar el usuario');
    }
  }
  async updateByUsername(username: string, dto: UpdateUsersDto, token: string): Promise<User> {
    try {
      // buscar por username
      const resGet: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}?filter=userName eq "${(username)}"`,
        this._getRequestOptions(token),
      );
      const existing = resGet.data?.Resources?.[0];
      if (!existing) throw new NotFoundException(`Usuario ${username} no encontrado`);

      const payload = UserMapper.fromUpdateUsersDtoToWSO2Payload(dto);
      const resUpdate: AxiosResponse<any> = await axios.put(
        `${this._baseUrl}/${(existing.id)}`,
        payload,
        this._getRequestOptions(token),
      );

      return UserMapper.fromWSO2ResponseToUser(resUpdate.data);
    } catch (err: any) {
      this._logger.error(`Error actualizando usuario por username ${username}`, err);
      if (err.response?.status === 404) throw new NotFoundException(err.response.data);
      throw new InternalServerErrorException('No se pudo actualizar el usuario');
    }
  }

  async remove(id: string, token: string): Promise<void> {
    try {
      await axios.delete(`${this._baseUrl}/${(id)}`, this._getRequestOptions(token));
    } catch (err: any) {
      if (err.response?.status === 404) {
        throw new NotFoundException(`Usuario ${id} no encontrado`);
      }
      throw new InternalServerErrorException('No se pudo eliminar el usuario');
    }
  }


  async removeByUsername(username: string, token: string): Promise<void> {
    try {
      const resGet: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}?filter=userName eq "${(username)}"`,
        this._getRequestOptions(token),
      );
      const existing = resGet.data?.Resources?.[0];
      if (!existing) throw new NotFoundException(`Usuario ${username} no encontrado`);
      await axios.delete(`${this._baseUrl}/${(existing.id)}`, this._getRequestOptions(token));
    } catch (err: any) {
      this._logger.error(`Error eliminando usuario por username ${username}`, err);
      if (err.response?.status === 404) throw new NotFoundException(err.response.data);
      throw new InternalServerErrorException('No se pudo eliminar el usuario');
    }
  }

}
