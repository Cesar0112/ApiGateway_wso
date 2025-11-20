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
import { ConfigService } from '../../../config/config.service';
import { User } from '../../entities/user.entity';
import { CreateUsersDto } from '../../dto/create-users.dto';
import { UpdateUsersDto } from '../../dto/update-users.dto';
import { UserMapper, WSO2Payload } from './user.wso2.mapper';
import { RoleWSO2Service } from '../../../roles/providers/wso2/role_wso2.service';
import { EncryptionsService } from '../../../encryptions/encryptions.service';
import { Structure } from '../../../structures/entities/structure.entity';
import { IUsersService } from '../../interfaces/users.interface.service';
import { StructuresWSO2Service } from '../../../structures/providers/wso2/structures_wso2.service';

@Injectable()
export class UsersWSO2Service implements IUsersService {
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
        'Content-Type': 'application/scim+json',
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized:
          this._configService.getConfig().NODE_ENV === 'production',
      }),
    };
  }
  async create(dto: CreateUsersDto, token: string): Promise<User> {
    try {
      dto.plainCipherPassword = this._encryptionsService.decrypt(
        dto.plainCipherPassword,
      );

      /* 1. Crear usuario en SCIM2 ********************************************/
      const payload: WSO2Payload =
        UserMapper.fromCreateUsersDtoToWSO2Payload(dto);
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

      /* 3.  Resolver IDs de estructuras (nombres o IDs) ***********************/
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
  async getUsers(token: string): Promise<User[]> {
    try {
      // 1. Traer usuarios con sus grupos
      const res: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}?count=1000&attributes=id,userName,name,emails,active,groups`,
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
      throw new InternalServerErrorException('No se pudieron obtener usuarios', (err.response?.data?.status === 401) ? `${err.response?.data?.detail ?? "401"}` : "");
    }
  }
  async getUserById(id: string, token: string): Promise<User> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}/${id}?attributes=id,userName,roles,emails,name,groups,active`,
        this._getRequestOptions(token),
      );
      const userRoles = await this._rolesService.getUserRoles(
        res.data.id,
        token,
      );
      const structs = await this._structureService.getStructuresFromUser(id, token);
      return UserMapper.fromWSO2ResponseToUser(res.data, userRoles, structs);
    } catch (err) {
      if (err.response?.status === 404) {
        throw new NotFoundException(`Usuario ${id} no encontrado`);
      }
      this._logger.error(`Error obteniendo usuario ${id}`, err);
      throw new InternalServerErrorException('No se pudo obtener el usuario');
    }
  }

  async getUserByUsername(username: string, token: string): Promise<User> {
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

  async getUsersFromStructure(structId: string, token: string): Promise<User[]> {
    const res = await axios.get(
      `${this._baseUrl}/${structId}`,
      this._getRequestOptions(token),
    );
    return res.data?.Resources?.map((u) => UserMapper.fromWSO2ResponseToUser(u)) ?? [];
  }
  async getUsersFromStructureName(structName: string, token: string): Promise<User[]> {
    const { id } = await this._structureService.findOneByName(structName, token);
    const res = await axios.get(
      `${this._baseUrl}/${id}`,
      this._getRequestOptions(token),
    );
    return res.data?.Resources?.map((u) => UserMapper.fromWSO2ResponseToUser(u)) ?? [];
  }
  async update(id: string, dto: UpdateUsersDto, token: string): Promise<User> {
    try {
      /* ---------- 0. validaciones ---------- */
      if (dto.userName)
        throw new InternalServerErrorException(
          'No se puede cambiar el userName de un usuario ya creado',
        );
      if (dto.id)
        throw new InternalServerErrorException(
          'No se puede cambiar el identificador de un usuario',
        );

      const currentUser = await this.getUserById(id, token);

      /* ---------- 1. ROLES (sincronización completa) ---------- */
      if (dto.roleIds?.length || dto.rolesNames?.length) {
        /* 1.1 roles actuales del usuario */
        const currentRoles = await this._rolesService.getUserRoles(id, token);
        const currentRoleIds = currentRoles.map((r) => r.id);

        /* 1.2 IDs nuevos (sin duplicados) */
        const newRoleIds = [
          ...(dto.roleIds ?? []),
          ...(await Promise.all(
            (dto.rolesNames ?? []).map((n) =>
              this._rolesService.getRoleIdByName(n, token),
            ),
          )),
        ].filter((v, i, a) => a.indexOf(v) === i); // uniq

        /* 1.3 quitar roles que ya no quiere */
        for (const rid of currentRoleIds) {
          if (!newRoleIds.includes(rid)) {
            await this._rolesService.removeUserFromRole(rid, id, token);
          }
        }

        /* 1.4 añadir roles nuevos */
        for (const rid of newRoleIds) {
          if (!currentRoleIds.includes(rid)) {
            await this._rolesService.addUserToRole(rid, id, token);
          }
        }
      }

      /* ---------- 2. estructuras (grupos) ---------- */
      if (dto.structureIds?.length) {
        await this.updateUserStructuresByIds(id, dto.structureIds, token);
      }

      /* ---------- 3. PATCH único con el resto de campos ---------- */
      const value: any = {};

      if ('firstName' in dto || 'lastName' in dto) {
        value.name = {
          givenName: dto.firstName ?? currentUser.firstName,
          familyName: dto.lastName ?? currentUser.lastName,
        };
      }

      if ('email' in dto) {
        value.emails = [dto.email];
      }

      if ('isActive' in dto) {
        value.active = dto.isActive;
      }

      if (Object.keys(value).length) {
        await axios.patch(
          `${this._baseUrl}/${id}`,
          {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: [{ op: 'replace', value }],
          },
          this._getRequestOptions(token),
        );
      }

      /* ---------- 4. devolver usuario actualizado ---------- */
      return await this.getUserById(id, token);
    } catch (err) {
      this._logger.error(
        `Error actualizando usuario ${id}`,
        err.response?.data?.detail ?? err.message,
      );
      throw new InternalServerErrorException(
        `No se pudo actualizar el usuario por ${err.message ?? err.response?.data?.detail}`,
      );
    }
  }

  /**
   * Reemplaza **todas** las estructuras (grupos) del usuario por las nuevas.
   * SCIM 2.0: PATCH /Users/{id}  →  replace groups
   */
  async updateUserStructuresByIds(
    userId: string,
    structuresIds: string[],
    token: string,
  ): Promise<void> {
    const { userName } = await this.getUserById(userId, token);
    const currentStructuresOfUser =
      await this._structureService.getStructuresFromUser(userId, token);


    await Promise.all(
      currentStructuresOfUser.map((g) => {
        if (!structuresIds.includes(g.id)) {
          this._structureService.removeUserFromStructure(
            g.id,
            userId,
            token,
          );
        }
      })
    )


    /*for (const g of currentStructuresOfUser) {
      if (!structuresIds.includes(g.id)) {
        await this._structureService.removeUserFromStructure(
          g.id,
          userId,
          token,
        );
      }
    }*/
    await Promise.all(
      structuresIds.map((id) => {
        const exists = currentStructuresOfUser.some(
          (g: Structure) => g.id === id,
        );
        if (!exists) {
          this._structureService.addUserToStructure(
            id,
            userId,
            userName,
            token,
          );
        }
      })
    )
    /*for (const id of structuresIds) {
      const exists = currentStructuresOfUser.some(
        (g: Structure) => g.id === id,
      );
      if (!exists) {
        await this._structureService.addUserToStructure(
          id,
          userId,
          userName,
          token,
        );
      }
    }*/
  }
  async updateByUsername(
    username: string,
    dto: UpdateUsersDto,
    token: string,
  ): Promise<User> {
    try {
      // buscar por username
      const resGet: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}?filter=userName eq "${username}"?attributes=id,userName,emails,name,groups,active`,
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

  async delete(id: string, token: string): Promise<void> {
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

  async deleteByUsername(username: string, token: string): Promise<void> {
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
  preserveMissingFields<T extends object>(partial: T, full: T): T {
    const result = { ...partial };
    for (const [key, value] of Object.entries(full)) {
      if (
        result[key] === undefined ||
        result[key] === null ||
        (typeof result[key] === 'string' && result[key] === '') ||
        (Array.isArray(result[key]) && result[key].length === 0)
      ) {
        result[key] = value;
      } else if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        value !== null
      ) {
        result[key] = this.preserveMissingFields(
          result[key] as any,
          value as any,
        );
      }
    }
    return result;
  }
  /**
   *
   * @param userId
   * @param active by desault false
   * @param token
   */
  async disableOrEnableUser(
    userId: string,
    active: boolean = false,
    token: string,
  ): Promise<void> {
    const payload = {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
      Operations: [
        {
          op: 'replace',
          value: { active },
        },
      ],
    };

    const res: AxiosResponse<any> = await axios.patch(
      `${this._baseUrl}/${userId}`,
      payload,
      this._getRequestOptions(token),
    );
    console.log(res.data)
  }
}
