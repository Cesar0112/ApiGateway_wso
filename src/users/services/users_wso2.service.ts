// ../users/services/users.wso2.service.ts
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
import { Role } from '../../roles/entities/role.entity';
import { RoleWSO2Service } from '../../roles/services/role_wso2.service';
import { EncryptionsService } from '../../encryptions/encryptions.service';
import { StructuresService } from '../../structures/services/structures.service';
import { StructuresWSO2Service } from '../../structures/services/structures_wso2.service';
import { Structure } from '../../structures/entities/structure.entity';
import { ChangeUsernameInternalDto } from '../dto/change-username-internal.dto';

@Injectable()
export class UsersWSO2Service {
  private readonly _logger = new Logger(UsersWSO2Service.name);
  private readonly _baseUrl: string;

  constructor(
    private readonly _configService: ConfigService,
    private readonly _rolesService: RoleWSO2Service,
    private readonly _encryptionsService: EncryptionsService,
    private readonly _structureService: StructuresWSO2Service,
  ) {
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
  /*async create(dto: CreateUsersDto, token: string): Promise<User> {
    try {
      dto.plainCipherPassword = this._encryptionsService.decrypt(
        dto.plainCipherPassword,
      );
      // 1. Crear usuario en SCIM2
      const payload = UserMapper.fromCreateUsersDtoToWSO2Payload(dto);
      const resCreate: AxiosResponse<any> = await axios.post(
        this._baseUrl,
        payload,
        this._getRequestOptions(token),
      );
      const createdUser = resCreate.data;
      
      let roles: Role[] = [];
      if (dto.rolesNames) {
        roles = await this._rolesService.getUserRoles(createdUser.id, token);
      }
      // 2. Resolver IDs de roles (nombres o IDs) *****************************
      let roleIds: string[] = [];
      if (dto.rolesNames?.length) {
        // Resuelvo nombres → IDs
        roleIds = await Promise.all(
          dto.rolesNames.map((name) =>
            this._rolesService.getRoleIdByName(name, token),
          ),
        );
      } else if (dto.roleIds?.length) {
        roleIds = dto.roleIds;
      }
      let structures: Structure[] = [];
      if (dto.structureIds) {
        structures = await this._structureService.findByIds(
          dto.structureIds,
          token,
        );
      }
      return UserMapper.fromWSO2ResponseToUser(createdUser, roles, structures);
    } catch (err: any) {
      this._logger.error('Error creando usuario en WSO2', err);
      if (err.response?.status === 409) {
        throw new ConflictException('Usuario ya existe');
      }
      throw new InternalServerErrorException('No se pudo crear el usuario');
    }
  }*/

  async create(dto: CreateUsersDto, token: string): Promise<User> {
    try {
      dto.plainCipherPassword = this._encryptionsService.decrypt(
        dto.plainCipherPassword,
      );

      /* 1. Crear usuario en SCIM2 ********************************************/
      const payload = UserMapper.fromCreateUsersDtoToWSO2Payload(dto);
      const resCreate = await axios.post(
        this._baseUrl,
        payload,
        this._getRequestOptions(token),
      );
      const createdUser = resCreate.data;

      /* 2. Resolver IDs de roles (nombres o IDs) *****************************/
      let roleIds: string[] = [];
      if (dto.rolesNames?.length) {
        // Resuelvo nombres → IDs
        roleIds = await Promise.all(
          dto.rolesNames.map((name) =>
            this._rolesService.getRoleIdByName(name, token),
          ),
        );
      } else if (dto.roleIds?.length) {
        roleIds = dto.roleIds;
      }

      /* 3. Resolver IDs de estructuras (nombres o IDs) ***********************/
      let structureIds: string[] = [];
      if (dto.structureNames?.length) {
        // Resuelvo nombres → IDs
        structureIds = await Promise.all(
          dto.structureNames.map((name) =>
            this._structureService.getStructureIdByName(name, token),
          ),
        );
      } else if (dto.structureIds?.length) {
        structureIds = dto.structureIds;
      }

      /* 4. Asignar roles al usuario ******************************************/
      for (const roleId of roleIds) {
        await this._rolesService.addUserToRole(roleId, createdUser.id, token);
      }

      /* 5. Asignar grupos (estructuras) al usuario ***************************/
      for (const structId of structureIds) {
        await this._structureService.addUserToStructure(
          structId,
          createdUser.id,
          createdUser.userName,
          token,
        );
      }

      /* 6. Obtener estado final **********************************************/
      const finalRoles = await this._rolesService.getUserRoles(
        createdUser.id,
        token,
      );
      const finalStructures = await this._structureService.findByIds(
        structureIds,
        token,
      );

      return UserMapper.fromWSO2ResponseToUser(
        createdUser,
        finalRoles,
        finalStructures,
      );
    } catch (error: any) {
      this._logger.error(
        'Error creando usuario en WSO2',
        error.response ? error.response?.data?.detail : error.response,
      );
      if (error.response?.status === 409) {
        throw new ConflictException('Usuario ya existe');
      }
      throw new InternalServerErrorException(
        'No se pudo crear el usuario',
        error.response?.data?.detail,
      );
    }
  }
  async findAll(token: string): Promise<User[]> {
    try {
      // 1. Traer usuarios con sus grupos
      const res: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}?count=1000&attributes=id,userName,emails,active,groups`,
        this._getRequestOptions(token),
      );
      const resources = res.data?.Resources ?? [];

      // 2. Traer TODAS las estructuras (grupos) una sola vez
      const allStructures = await this._structureService.findAll(token);

      // 3. Armar usuarios con roles y estructuras
      return await Promise.all(
        resources.map(async (u: any) => {
          const userRoles = await this._rolesService.getUserRoles(u.id, token);

          // 4. Mapear grupos a estructuras
          const userStructures = allStructures.filter(
            (s) => u.groups?.some((g: any) => g.value === s.id),
          );

          return UserMapper.fromWSO2ResponseToUser(
            u,
            userRoles,
            userStructures,
          );
        }),
      );
    } catch (err) {
      this._logger.error('Error obteniendo usuarios en WSO2', err);
      throw new InternalServerErrorException('No se pudieron obtener usuarios');
    }
  }
  async findById(id: string, token: string): Promise<User> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}/${id}`,
        this._getRequestOptions(token),
      );
      const userRoles = await this._rolesService.getUserRoles(
        res.data.id,
        token,
      );
      return UserMapper.fromWSO2ResponseToUser(res.data, userRoles);
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
      if (!userData)
        throw new NotFoundException(`Usuario ${username} no encontrado`);
      const userRoles = await this._rolesService.getUserRoles(
        res.data.id,
        token,
      );
      return UserMapper.fromWSO2ResponseToUser(userData, userRoles);
    } catch (err) {
      this._logger.error(
        `Error buscando usuario por username ${username}`,
        err,
      );
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('No se pudo obtener el usuario');
    }
  }

  async update(id: string, dto: UpdateUsersDto, token: string): Promise<User> {
    try {
      if (dto.username)
        throw new InternalServerErrorException(
          'No se puede cambiar el username de un usuario ya creado',
        );
      const payload = UserMapper.fromUpdateUsersDtoToWSO2Payload(dto);
      const res: AxiosResponse<any> = await axios.put(
        `${this._baseUrl}/${id}`,
        payload,
        this._getRequestOptions(token),
      );
      let rolesMap: Role[] = [];
      if (dto.id) {
        rolesMap = await this._rolesService.getUserRoles(dto.id, token);
      } else if (dto.username) {
        rolesMap = await this._rolesService.getUserRolesByUsername(
          dto.username,
          token,
        );
      }
      return UserMapper.fromWSO2ResponseToUser(res.data, rolesMap);
    } catch (err) {
      this._logger.error(`Error actualizando usuario ${id}`, err);
      throw new InternalServerErrorException(
        err.message ?? 'No se pudo actualizar el usuario',
      );
    }
  }
  async updateByUsername(
    username: string,
    dto: UpdateUsersDto,
    token: string,
  ): Promise<User> {
    try {
      // buscar por username
      const resGet: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}?filter=userName eq "${username}"`,
        this._getRequestOptions(token),
      );
      const existing = resGet.data?.Resources?.[0];
      if (!existing)
        throw new NotFoundException(`Usuario ${username} no encontrado`);

      const payload = UserMapper.fromUpdateUsersDtoToWSO2Payload(dto);
      const resUpdate: AxiosResponse<any> = await axios.put(
        `${this._baseUrl}/${existing.id}`,
        payload,
        this._getRequestOptions(token),
      );

      return UserMapper.fromWSO2ResponseToUser(resUpdate.data);
    } catch (err: any) {
      this._logger.error(
        `Error actualizando usuario por username ${username}`,
        err,
      );
      if (err.response?.status === 404)
        throw new NotFoundException(err.response.data);
      throw new InternalServerErrorException(
        'No se pudo actualizar el usuario',
      );
    }
  }

  async remove(id: string, token: string): Promise<void> {
    try {
      await axios.delete(
        `${this._baseUrl}/${id}`,
        this._getRequestOptions(token),
      );
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
        `${this._baseUrl}?filter=userName eq "${username}"`,
        this._getRequestOptions(token),
      );
      const existing = resGet.data?.Resources?.[0];
      if (!existing)
        throw new NotFoundException(`Usuario ${username} no encontrado`);
      await axios.delete(
        `${this._baseUrl}/${existing.id}`,
        this._getRequestOptions(token),
      );
    } catch (err: any) {
      this._logger.error(
        `Error eliminando usuario por username ${username}`,
        err,
      );
      if (err.response?.status === 404)
        throw new NotFoundException(err.response.data);
      throw new InternalServerErrorException('No se pudo eliminar el usuario');
    }
  }
}
