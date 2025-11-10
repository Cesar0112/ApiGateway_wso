// ../roles/services/role.wso2.service.ts
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
import { Role } from '../entities/role.entity';
import { RoleMapper } from '../role.mapper';
import { IRoleService } from '../interfaces/role.service.interface';

@Injectable()
export class RoleWSO2Service implements IRoleService {
  private readonly logger = new Logger(RoleWSO2Service.name);
  private readonly baseUrl: string;

  constructor(protected readonly configService: ConfigService) {
    const wso2Config = this.configService.getConfig().WSO2;
    this.baseUrl =
      `${wso2Config.HOST}:${wso2Config.PORT}/scim2/v2/Roles`.trim();
  }

  private getRequestOptions(token: string): AxiosRequestConfig {
    return {
      //TODO Configurar proxy por configuraciones no directamente
      proxy: false as const,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized:
          this.configService.getConfig().NODE_ENV === 'production',
      }),
    };
  }

  async createRole(data: Role, token: string): Promise<Role> {
    try {
      const payload = RoleMapper.toWSO2Payload(data);
      const res: AxiosResponse<any> = await axios.post(
        this.baseUrl,
        payload,
        this.getRequestOptions(token),
      );
      return RoleMapper.fromWSO2Response(res.data);
    } catch (err) {
      this.logger.error('Error creando rol en WSO2', err);
      throw new InternalServerErrorException('No se pudo crear el rol');
    }
  }

  async getRoles(token: string): Promise<Role[]> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this.baseUrl}?count=1000`, // 👈 trae el máximo
        this.getRequestOptions(token),
      );
      return res.data.Resources.map((r: any) => RoleMapper.fromWSO2Response(r));
    } catch (err) {
      this.logger.error('Error obteniendo roles en WSO2', err);
      throw new InternalServerErrorException(
        'No se pudieron obtener los roles',
      );
    }
  }

  async getRoleById(id: string, token: string): Promise<Role> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this.baseUrl}/${id}`,
        this.getRequestOptions(token),
      );
      return RoleMapper.fromWSO2Response(res.data);
    } catch (err) {
      this.logger.error(`Error obteniendo rol ${id} en WSO2`, err);
      throw new InternalServerErrorException('No se pudo obtener el rol');
    }
  }
  async getRoleByName(name: string, token: string): Promise<Role> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this.baseUrl}?filter=displayName eq "${name}"`,
        this.getRequestOptions(token),
      );

      const roleData = res.data.Resources?.[0];
      if (!roleData) throw new NotFoundException(`Rol ${name} no encontrado`);

      return RoleMapper.fromWSO2Response(roleData);
    } catch (err) {
      this.logger.error(`Error buscando rol ${name}`, err);
      throw new InternalServerErrorException('No se pudo obtener el rol');
    }
  }
  async getRoleIdByName(name: string, token: string): Promise<string> {
    const role = await this.getRoleByName(name, token);
    if (!role) throw new NotFoundException(`Rol "${name}" no existe`);
    return role.id;
  }
  async updateRole(id: string, data: Role, token: string): Promise<Role> {
    try {
      const payload = RoleMapper.toWSO2Payload(data);
      const res: AxiosResponse<any> = await axios.put(
        `${this.baseUrl}/${id}`,
        payload,
        this.getRequestOptions(token),
      );
      return RoleMapper.fromWSO2Response(res.data);
    } catch (err) {
      this.logger.error(`Error actualizando rol ${id} en WSO2`, err);
      throw new InternalServerErrorException('No se pudo actualizar el rol');
    }
  }

  async deleteRole(id: string, token: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/${id}`,
        this.getRequestOptions(token),
      );
    } catch (err) {
      this.logger.error(`Error eliminando rol ${id} en WSO2`, err);
      throw new InternalServerErrorException('No se pudo eliminar el rol');
    }
  }
  async updateByCurrentName(
    currentName: string,
    data: Partial<Role>,
    token: string,
  ): Promise<Role> {
    try {
      const existingRole = await this.getRoleByName(currentName, token);
      if (!existingRole) {
        throw new NotFoundException(
          `Role with name "${currentName}" not found`,
        );
      }

      const payload = RoleMapper.toWSO2Payload(data);
      const updateRes = await axios.put(
        `${this.baseUrl}/${existingRole.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        },
      );

      return RoleMapper.fromWSO2Response(updateRes.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new NotFoundException(error.response.data);
      }
      if (error.response?.status === 409) {
        throw new ConflictException(error.response.data);
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteByName(name: string, token: string): Promise<void> {
    try {
      const existingRole = await this.getRoleByName(name, token);
      if (!existingRole) {
        throw new NotFoundException(`Role with name "${name}" not found`);
      }

      await axios.delete(
        `${this.baseUrl}/${existingRole.id}`,
        this.getRequestOptions(token),
      );
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new NotFoundException(error.response.data);
      }
      throw new InternalServerErrorException(error.message);
    }
  }
  async getUserRoles(userId: string, token: string): Promise<Role[]> {
    const allRoles = await this.getRoles(token);
    const rolesWithUser: Role[] = [];
    const validRoles = allRoles.filter((r): r is Role & { id: string } =>
      Boolean(r.id),
    );

    for (const role of validRoles) {
      const users = await this.getUsersFromRole(role.id, token);
      if (users.some((u) => u.value === userId)) {
        rolesWithUser.push(role);
      }
    }

    return rolesWithUser;
  }
  async getUsersFromRole(
    roleId: string,
    token: string,
  ): Promise<{ value: string; display: string }[]> {
    const res = await axios.get(
      `${this.baseUrl}/${roleId}`,
      this.getRequestOptions(token),
    );
    return res.data.users ?? [];
  }
  /**
   * This method isn't tested
   * @description I think the filter is incorrect, look for a previous method to look for the user
   * @param username
   * @param token
   * @returns
   */
  async getUserRolesByUsername(
    username: string,
    token: string,
  ): Promise<Role[]> {
    try {
      // 1️⃣ Obtener usuario desde el username
      const userResponse = await axios.get(
        `${this.configService.getConfig().WSO2.HOST}:${this.configService.getConfig().WSO2.PORT
        }/scim2/Users?filter=userName eq "${username}"`,
        this.getRequestOptions(token),
      );

      const user = userResponse.data.Resources?.[0];
      if (!user || !user.id) {
        throw new NotFoundException(`Usuario "${username}" no encontrado`);
      }

      // 2️⃣ Reutilizar método existente
      return await this.getUserRoles(user.id, token);
    } catch (error) {
      this.logger.error(
        `Error al obtener roles del usuario ${username} en WSO2`,
        error.response?.data ?? error.message,
      );
      throw new InternalServerErrorException(
        `Error al obtener roles del usuario: ${error.message}`,
      );
    }
  }

  /* Agregarle un rol a un usuario */
  async addUserToRole(
    roleId: string,
    userId: string,
    token: string,
  ): Promise<void> {

    await axios.patch(
      `${this.baseUrl}/${roleId}`,
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: [
          {
            op: 'add',
            path: 'users',
            value: [{ value: userId }],
          },
        ],
      },
      this.getRequestOptions(token),
    );
  }
  /* Asignar un usuario a un rol */
  async removeUserFromRole(roleId: string, userId: string, token: string): Promise<void> {
    await axios.patch(
      `${this.baseUrl}/${roleId}`,
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: [
          {
            op: 'remove',
            path: `users[value eq "${userId}"]`,
          },
        ],
      },
      this.getRequestOptions(token),
    );
  }
}
