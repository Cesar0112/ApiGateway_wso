import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CreateStructureDto } from '../dto/create-structure.dto';
import { UpdateStructureDto } from '../dto/update-structure.dto';
import { Structure } from '../entities/structure.entity';
import { ConfigService } from 'src/config/config.service';
import * as https from 'https';
import { StructureNameHelper } from '../structure.helper';
@Injectable()
export class StructuresWSO2Service {
  private readonly _baseUrl: string;
  private readonly logger = new Logger(StructuresWSO2Service.name);
  constructor(protected readonly configService: ConfigService) {
    const wso2Config = this.configService.getConfig().WSO2;
    this._baseUrl = `${wso2Config.HOST}:${wso2Config.PORT}/scim2/Groups`;
  }
  private _getRequestOptions(token: string): AxiosRequestConfig {
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

  // Crear estructura (grupo en SCIM2)
  async create(
    dto: CreateStructureDto,
    token: string,
  ): Promise<Structure | Partial<Structure>> {
    try {
      // Construir nombre jerárquico o raíz
      const displayName = StructureNameHelper.buildPath(
        dto.parentName ? [dto.parentName, dto.name] : [dto.name],
      );

      // Validar unicidad contra lo que ya existe
      const allStructures = await this.findAll(token);
      const existingNames = allStructures.map((s) => s.name);
      StructureNameHelper.ensureUnique(displayName, existingNames);

      // Enviar a WSO2
      const payload = {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        displayName,
      };
      const res: AxiosResponse<any> = await axios.post(
        this._baseUrl,
        payload,
        this._getRequestOptions(token),
      );
      return this._mapFromWSO2(res.data);
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        'Error creando estructura en WSO2',
      );
    }
  }

  // Listar todas las estructuras
  /*async findAll(token: string): Promise<Structure[]> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}?count=1000`,
        this._getRequestOptions(token),
      );
      return (res.data?.Resources ?? []).map((g: any) => this._mapFromWSO2(g));
    } catch (err: any) {
      throw new InternalServerErrorException(
        'Error obteniendo estructuras de WSO2',
      );
    }
  }*/
  // structures_wso2.service.ts
  async findAll(token: string): Promise<Structure[]> {
    try {
      const res = await axios.get(
        this._baseUrl,
        this._getRequestOptions(token),
      );
      return (res.data?.Resources ?? []).map((g) => this._mapFromWSO2(g));
    } catch (err: any) {
      this.logger.error(
        'Error crudo de WSO2 al traer grupos',
        err.response?.data || err.message,
      );
      throw new InternalServerErrorException(
        'Error obteniendo estructuras de WSO2',
      );
    }
  }
  async findByIds(ids: string[], token: string) {
    const allStructures = await this.findAll(token);
    return allStructures.filter((s) => ids.includes(s.id));
  }
  // Buscar estructura por ID
  async findOne(
    id: string,
    token: string,
  ): Promise<Structure | Partial<Structure>> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}/${id}`,
        this._getRequestOptions(token),
      );
      return this._mapFromWSO2(res.data);
    } catch (err: any) {
      if (err.response?.status === 404)
        throw new NotFoundException(`Structure ${id} not found`);
      throw new InternalServerErrorException(
        'Error buscando estructura en WSO2',
      );
    }
  }

  // Buscar por nombre
  async findOneByName(
    name: string,
    token: string,
  ): Promise<Structure | Partial<Structure>> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}?filter=displayName eq "${name}"`,
        this._getRequestOptions(token),
      );
      const found = res.data?.Resources?.[0];
      if (!found) throw new NotFoundException(`Structure ${name} not found`);
      return this._mapFromWSO2(found);
    } catch (err: any) {
      throw new InternalServerErrorException(
        'Error buscando estructura por nombre en WSO2',
      );
    }
  }

  // Actualizar
  async update(
    id: string,
    dto: UpdateStructureDto,
    token: string,
  ): Promise<Structure | Partial<Structure>> {
    try {
      const displayName = StructureNameHelper.buildPath(
        dto.parentName ? [dto.parentName, dto.name] : [dto.name],
      );

      // Validar unicidad excluyendo la propia estructura que se está actualizando
      const allStructures = await this.findAll(token);
      const existingNames = allStructures
        .filter((s) => s.id !== id)
        .map((s) => s.name);
      StructureNameHelper.ensureUnique(displayName, existingNames);
      const payload = { displayName };
      const res: AxiosResponse<any> = await axios.put(
        `${this._baseUrl}/${id}`,
        payload,
        this._getRequestOptions(token),
      );
      return this._mapFromWSO2(res.data);
    } catch (err: any) {
      if (err.response?.status === 404)
        throw new NotFoundException(`Structure ${id} not found`);
      throw new InternalServerErrorException(
        'Error actualizando estructura en WSO2',
      );
    }
  }

  // Eliminar
  async remove(id: string, token: string): Promise<void> {
    try {
      await axios.delete(
        `${this._baseUrl}/${id}`,
        this._getRequestOptions(token),
      );
    } catch (err: any) {
      if (err.response?.status === 404)
        throw new NotFoundException(`Structure ${id} not found`);
      throw new InternalServerErrorException(
        'Error eliminando estructura en WSO2',
      );
    }
  }

  // Mapper de SCIM2 → Entidad de dominio
  private _mapFromWSO2(data: any): Structure | Partial<Structure> {
    const parts = data.displayName.split('/');
    const name = parts[parts.length - 1];
    const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : null;

    return {
      id: data.id,
      name,
      displayName: data.displayName,
      users: [],
    };
  }
}
