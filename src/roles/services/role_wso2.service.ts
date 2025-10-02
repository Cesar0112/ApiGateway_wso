// src/roles/services/role.wso2.service.ts
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as https from 'https';
import { ConfigService } from 'src/config/config.service';
import { Role } from '../entities/role.entity';
import { RoleMapper } from '../role.mapper';

@Injectable()
export class RoleWSO2Service {
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
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const roleData = res.data.Resources?.[0];
      if (!roleData) throw new NotFoundException(`Rol ${name} no encontrado`);

      return RoleMapper.fromWSO2Response(roleData);
    } catch (err) {
      this.logger.error(`Error buscando rol ${name}`, err);
      throw new InternalServerErrorException('No se pudo obtener el rol');
    }
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
  /*async getUserRoles(userId: string, token: string): Promise<Role[]> {
    try {
      const res = await axios.get(
        `${this.baseUrl}?filter=users.value eq "${userId}"&count=1000`,
        this.getRequestOptions(token),
      );

      const resources = res.data.Resources ?? [];

      return resources.map((role: any) => RoleMapper.fromWSO2Response(role));
    } catch (error) {
      throw new Error(`Error al obtener roles del usuario: ${error}`);
    }
  }*/
  /* async getUserRoles(userId: string, token: string): Promise<Role[]> {
    try {
      const params = new URLSearchParams({
        filter: `users.value eq "${userId}"`,
        count: '1000',
      });
      const finalUrl = `${this.baseUrl}?${params.toString()}`;
      this.logger.log('URL llamada: ' + finalUrl); // 👈 ver en consola
      const res = await axios.get(
        finalUrl, // 👈 solo la ruta base
        {
          ...this.getRequestOptions(token),
          params, // 👈 axios concatena y codifica correctamente
        },
      );

      return (
        res.data.Resources?.map((r) => RoleMapper.fromWSO2Response(r)) ?? []
      );
    } catch (err: any) {
      this.logger.error(`Error obteniendo roles del usuario ${userId}`, err);
      throw new InternalServerErrorException(
        'No se pudieron obtener los roles del usuario',
      );
    }
  }*/

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
  async getUserRolesByUsername(
    username: string,
    token: string,
  ): Promise<Role[]> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this.baseUrl}?filter=users.display eq "${username}"&count=1000`,
        this.getRequestOptions(token),
      );
      return res.data.Resources?.map((role: any) =>
        RoleMapper.fromWSO2Response(role),
      );
    } catch (error) {
      throw new Error(`Error al obtener roles del usuario: ${error.message}`);
    }
  }
}
