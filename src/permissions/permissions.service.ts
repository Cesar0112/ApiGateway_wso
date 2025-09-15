import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import axios, { AxiosResponse } from 'axios';

import * as https from 'https';
import { jwtDecode } from 'jwt-decode';
import { IDecodedToken } from '../auth/auth.interface';

import {
  IPermission,
  IRoleSearchResponse,
} from '../roles/interfaces/role_search_response.interface';
import { ConfigService } from '../config/config.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly configService: ConfigService) {}
  create(createPermissionDto: CreatePermissionDto) {
    return 'This action adds a new permission';
  }

  findAll() {
    return `This action returns all permissions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} permission`;
  }

  update(id: number, updatePermissionDto: UpdatePermissionDto) {
    return `This action updates a #${id} permission`;
  }

  remove(id: number) {
    return `This action removes a #${id} permission`;
  }

  hasScope(token: string, requiredScope: string): boolean {
    const decodedToken = jwtDecode<IDecodedToken>(token);

    if (!decodedToken.scope) {
      return false;
    }

    return decodedToken.scope.includes(requiredScope);
  }

  /**
   * Obtiene los permisos asociados a los roles de un usuario.
   * @param roles - Un array de roles o un único rol.
   * @param token - El token de acceso del usuario.
   * @returns Un array de objetos que contienen el rol y sus permisos asociados.
   */
  async getPermissionsForRoles(
    roles: string[] | string,
    token: string,
  ): Promise<{ role: string; permissions: IPermission[] }[]> {
    const scopes: { role: string; permissions: IPermission[] }[] = [];
    const rolesArray = Array.isArray(roles) ? roles : [roles];

    if (!this.hasScope(token, 'internal_role_mgt_view')) {
      throw new Error(
        'El token no tiene el alcance necesario para ver los roles y permisos.',
      );
    }
    for (const role of rolesArray) {
      try {
        const url: string = `${this.configService.get('WSO2')?.HOST}:${this.configService.get('WSO2')?.PORT}/scim2/${this.configService.get('WSO2')?.API_VERSION}/Roles/.search`;
        const { data }: AxiosResponse<IRoleSearchResponse> =
          await axios.post<IRoleSearchResponse>(
            url,
            {
              filter: `displayName eq ${role}`,
              schemas: ['urn:ietf:params:scim:api:messages:2.0:SearchRequest'],
              startIndex: 1,
              count: 1,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/scim+json',
              },
              httpsAgent: new https.Agent({
                rejectUnauthorized:
                  this.configService.getConfig().NODE_ENV === 'production',
              }),
              proxy: false, //TODO Cambiar por carga de configuración
            },
          );

        // Extrae los permisos del primer recurso encontrado (si existe)
        const resources = data.Resources;
        if (resources && resources.length > 0) {
          const permissions = resources[0].permissions || [];
          scopes.push({
            role,
            permissions,
          });
        }
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'message' in err &&
          typeof err.message === 'string'
        ) {
          console.error(
            `Error obteniendo permisos para el rol ${role}:`,
            err.message,
          );
        }
      }
    }

    return scopes;
  }
}
