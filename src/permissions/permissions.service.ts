import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import axios, { AxiosResponse } from 'axios';

import * as https from 'https';
import { jwtDecode } from 'jwt-decode';
import { IDecodedToken } from '../auth/auth.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';

import {
  IPermission,
  IRoleSearchResponse,
} from '../roles/interfaces/role_search_response.interface';
import { ConfigService } from '../config/config.service';
import { IScope } from './scope.interface';
//TODO Esta clase tiene que tener la capacidad de hacer el CRUD también con WSO2
// para tener las bases de datos tanto locales como de WSO2 consistentes
@Injectable()
export class PermissionsService {
  constructor(
    private readonly _configService: ConfigService,
    @InjectRepository(Permission)
    private readonly _permRepo: Repository<Permission>,
  ) {}
  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const EXISTS = await this._permRepo.exists({
      where: { value: createPermissionDto.value },
    });
    if (EXISTS)
      throw new ConflictException(
        `Permission ${createPermissionDto.value} already exists`,
      );
    return this._permRepo.save(this._permRepo.create(createPermissionDto));
  }
  /*
   TODO Falta por terminar
  async createWSO2Permission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<Permission> {
      const EXISTS = await this._permRepo.exists({
      where: { value: createPermissionDto.value },
    });
    if (EXISTS)
      throw new ConflictException(
        `Permission ${createPermissionDto.value} already exists`,
      );
    return this._permRepo.save(this._permRepo.create(createPermissionDto));
  }*/

  findAll(): Promise<Permission[]> {
    return this._permRepo.find();
  }
  async getScopesFromApiResource(
    token: string,
    apiResourceId: string = 'backend',
  ): Promise<IScope[]> {
    if (!this.hasScope(token, 'internal_api_resource_view')) {
      throw new Error(
        'El token no tiene el alcance necesario para ver los scopes de recursos.',
      );
    }

    try {
      const URL = `${this._configService.getConfig().WSO2.HOST}:${this._configService.getConfig().WSO2.PORT}/api/server/v1/api-resources/${apiResourceId}/scopes`;

      const { data: SCOPES }: AxiosResponse<IScope[]> = await axios.get<
        IScope[]
      >(URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized:
            this._configService.getConfig().NODE_ENV === 'production',
        }),
        proxy: false,
      });

      return SCOPES;
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof err.message === 'string'
      ) {
        console.error(
          `Error obteniendo scopes para apiResourceId=${apiResourceId}:`,
          err.message,
        );
      }
      return [];
    }
  }

  async findOne(value: string): Promise<Permission> {
    const perm = await this._permRepo.findOneBy({ value });
    if (!perm) throw new NotFoundException(`Permission ${value} not found`);
    return perm;
  }

  async update(
    currentValue: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const currentPermission: Permission = await this.findOne(currentValue);
    currentPermission.value = updatePermissionDto.value;
    return this._permRepo.save(currentPermission);
  }

  async remove(value: string): Promise<void> {
    const perm = await this.findOne(value);
    await this._permRepo.remove(perm);
  }

  hasScope(token: string, requiredScope: string): boolean {
    const decodedToken = jwtDecode<IDecodedToken>(token);

    if (!decodedToken.scope) {
      return false;
    }

    return decodedToken.scope.includes(requiredScope);
  }

  /**
   * It obtains the permissions associated with the roles of a user when using WSO2 as an identity provider.
   * @param roles -an array of roles or a single role.
   * @param Token -User's access token.
   * @returns an array of objects that contain the role and its associated permits.
   */
  async getPermissionsFromRoles(
    roles: string[] | string,
    token: string,
  ): Promise<{ role: string; permissions: IPermission[] }[]> {
    const SCOPES: { role: string; permissions: IPermission[] }[] = [];
    const ROLES_ARRAY = Array.isArray(roles) ? roles : [roles];

    if (!this.hasScope(token, 'internal_role_mgt_view')) {
      throw new Error(
        'El token no tiene el alcance necesario para ver los roles y permisos.',
      );
    }
    for (const ROLE of ROLES_ARRAY) {
      try {
        const URL: string = this._configService.getConfig().WSO2.ROLE_SEARCH;
        const { data }: AxiosResponse<IRoleSearchResponse> =
          await axios.post<IRoleSearchResponse>(
            URL,
            {
              filter: `displayName eq ${ROLE}`,
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
                  this._configService.getConfig().NODE_ENV === 'production',
              }),
              proxy: false, //TODO Cambiar por carga de configuración
            },
          );

        // Extrae los permisos del primer recurso encontrado (si existe)
        const RESOURCES = data.Resources;
        if (RESOURCES && RESOURCES.length > 0) {
          const PERMISSIONS = RESOURCES[0].permissions || [];
          SCOPES.push({
            role: ROLE,
            permissions: PERMISSIONS,
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
            `Error obteniendo permisos para el rol ${ROLE}:`,
            err.message,
          );
        }
      }
    }

    return SCOPES;
  }
}
