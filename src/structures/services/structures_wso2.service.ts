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
import { ConfigService } from '../../config/config.service';
import * as https from 'https';
import { StructureNameHelper } from '../structure.helper';
import { SessionService } from 'src/session/session.service';
import { StructureMapper } from '../structure.mapper';

//FIXME Arreglar que no se mapee directamente desde aquí sino desde el controller
@Injectable()
export class StructuresWSO2Service {

  private readonly _baseUrl: string;
  private readonly _logger = new Logger(StructuresWSO2Service.name);
  constructor(protected readonly configService: ConfigService, private readonly sessionService: SessionService) {
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
  async getUserStructures(userId: string, token: string): Promise<Structure[]> {
    const url = `${this.configService.getConfig().WSO2.HOST}:${this.configService.getConfig().WSO2.PORT
      }/scim2/Users/${userId}?attributes=groups`;

    try {
      const res = await axios.get(url, this._getRequestOptions(token));
      const groups = res.data?.groups ?? [];

      return groups.map(
        (g: any) =>
          ({
            id: g.value,
            name: g.display,
            displayName: g.display,
          }) as Structure,
      );
    } catch (err: any) {
      this._logger.error(
        'Error obteniendo grupos de usuario',
        err.response?.data || err.message,
      );
      throw new InternalServerErrorException(
        'Error obteniendo estructuras del usuario en WSO2',
      );
    }
  }

  // Crear estructura (grupo en SCIM2)
  async create(dto: CreateStructureDto, token: string): Promise<Structure> {
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
      return StructureMapper.mapFromWSO2(res.data);
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        'Error creando estructura en WSO2',
      );
    }
  }
  //FIXME Arreglar para que devuelva el padre dentro del mapFromWSO@
  async findAll(token: string): Promise<Structure[]> {
    try {
      const res = await axios.get(
        this._baseUrl,
        this._getRequestOptions(token),
      );
      return (res.data?.Resources ?? []).map((g) => StructureMapper.mapFromWSO2(g));
    } catch (err: any) {
      this._logger.error(
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

  async findOne(id: string, token: string): Promise<Structure> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}/${id}`,
        this._getRequestOptions(token),
      );
      return StructureMapper.mapFromWSO2(res.data);
    } catch (err: any) {
      if (err.response?.status === 404)
        throw new NotFoundException(`Structure ${id} not found`);
      throw new InternalServerErrorException(
        'Error buscando estructura en WSO2',
      );
    }
  }

  async findOneByName(name: string, token: string): Promise<Structure> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}?filter=displayName ew "${name}"`,
        this._getRequestOptions(token),
      );
      const found = res.data?.Resources?.[0];
      if (!found) throw new NotFoundException(`Structure ${name} not found`);
      return StructureMapper.mapFromWSO2(found);
    } catch (err: any) {
      throw new InternalServerErrorException(
        'Error buscando estructura por nombre en WSO2',
      );
    }
  }

  async update(
    id: string,
    dto: UpdateStructureDto,
    token: string,
  ): Promise<Structure> {
    try {
      const dtoAny = dto as any;
      const operations: any[] = [];
      const delimiter = StructureNameHelper.GROUP_DELIMITER;
      const current = await this.findOne(id, token);

      if (!current) {
        throw new NotFoundException(`Structure ${id} not found`);
      }

      const oldDisplayName = current.displayName;
      let newDisplayName = oldDisplayName;
      let nameChanged = false;
      let parentChanged = false;

      if ('name' in dtoAny && dtoAny.name && dtoAny.name !== current.name) {
        nameChanged = true;
        newDisplayName = StructureNameHelper.buildPath(
          dtoAny.parentName
            ? [dtoAny.parentName, dtoAny.name]
            : [dtoAny.name],
        );
      } else if ('parentName' in dtoAny && dtoAny.parentName !== current.displayName.split(StructureNameHelper.GROUP_DELIMITER)[0]) {
        parentChanged = true;
        newDisplayName = StructureNameHelper.buildPath(
          dtoAny.parentName
            ? [dtoAny.parentName, current.name]
            : [current.name],
        );
      }

      // Validar unicidad si cambia nombre o padre
      if (nameChanged || parentChanged) {
        const allStructures = await this.findAll(token);
        const existingNames = allStructures
          .filter((s) => s.id !== id)
          .map((s) => s.displayName);
        StructureNameHelper.ensureUnique(newDisplayName, existingNames);

        operations.push({
          op: 'replace',
          path: 'displayName',
          value: newDisplayName,
        });
      }

      // 3) Si vienen children en dto -> sincronizar asignaciones (IDs o names según tu DTO)
      //    Asumo dto.children es array de { id?, name? } o ids; adapta según tu DTO.
      let childrenToAssign: string[] = [];
      if (Array.isArray(dtoAny.childrenIds)) {
        // Normalizar a ids si vienen objetos
        childrenToAssign = dtoAny.childrenIds.map((c: any) => (typeof c === 'string' ? c : c.id)).filter(Boolean);
      }


      // 4) Aplicar PATCH al padre (si hay ops)
      if (operations.length) {
        await axios.patch(
          `${this._baseUrl}/${id}`,
          {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
            Operations: operations,
          },
          this._getRequestOptions(token),
        );
      }

      // 5) Actualizar descendientes si el displayName cambió
      if (nameChanged || parentChanged) {
        // obtenemos todos y filtramos por prefix
        const allStructures = await this.findAll(token);
        const prefix = oldDisplayName + delimiter;
        const descendants = allStructures.filter((s) => s.displayName.startsWith(prefix));

        // actualizar cada descendiente: sustituir el prefijo
        // Importante: hacemos las peticiones secuencialmente para evitar conflictos de nombres
        for (const desc of descendants) {
          const suffix = desc.displayName.substring(prefix.length); // lo que viene después del padre-
          const descNewDisplayName = `${newDisplayName}${delimiter}${suffix}`;

          // validar unicidad posible para cada nuevo displayName (opcional, ya validamos a nivel general pero revisa)
          // puedes verificar colisiones aquí si quieres.

          await axios.patch(
            `${this._baseUrl}/${desc.id}`,
            {
              schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
              Operations: [
                {
                  op: 'replace',
                  path: 'displayName',
                  value: descNewDisplayName,
                },
              ],
            },
            this._getRequestOptions(token),
          );
        }
      }
      // obtener hijos actuales
      const directChildren = await this.findChildren(id, token);
      const directChildIds = directChildren.map(c => c.id);
      // 6) Si dto.children fue pasado, sincronizar hijos explícitos:
      if (childrenToAssign.length) {
        // quitar los que no estén en childrenToAssign
        const toRemove = directChildIds.filter(cid => !childrenToAssign.includes(cid));
        for (const cid of toRemove) {
          // desvincular: set parentName=null => recae al root
          await axios.patch(
            `${this._baseUrl}/${cid}`,
            {
              schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
              Operations: [
                {
                  op: 'replace',
                  path: 'displayName',
                  value: (await this.findOne(cid, token)).name, // si al desvincular queda solo su name; adapta según tu formato
                },
              ],
            },
            this._getRequestOptions(token),
          );
        }

        // asignar nuevos hijos: establecer parentName -> actualizamos displayName de esos hijos
        for (const cid of childrenToAssign) {
          const child = await this.findOne(cid, token);
          if (!child) continue;

          const childName = child.name;
          const childNewDisplayName = `${newDisplayName}${delimiter}${childName}`;

          await axios.patch(
            `${this._baseUrl}/${cid}`,
            {
              schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
              Operations: [
                {
                  op: 'replace',
                  path: 'displayName',
                  value: childNewDisplayName,
                },
              ],
            },
            this._getRequestOptions(token),
          );
        }
      } else {

        // caso nuevo: dto.children viene vacío → quitar todos los hijos
        for (const cid of directChildIds) {
          const child = await this.findOne(cid, token);
          const childName = child.name;
          await axios.patch(
            `${this._baseUrl}/${cid}`,
            {
              schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
              Operations: [
                {
                  op: 'replace',
                  path: 'displayName',
                  value: childName, // se queda en raíz
                },
              ],
            },
            this._getRequestOptions(token),
          );
        }
      }

      // 7) Finalmente devolver la entidad actualizada (padre)
      return await this.findOne(id, token);

    } catch (err: any) {
      this._logger.error(
        `Error actualizando estructura ${id}`,
        err.response?.data ?? err.message,
      );

      if (err.response?.status === 404)
        throw new NotFoundException(`Structure ${id} not found`);

      throw new InternalServerErrorException(
        `No se pudo actualizar estructura: ${err.message ?? err.response?.data?.detail}`,
      );
    }
  }
  async findChildren(id: string, token: string) {
    return (await this.findAll(token)).filter(s => s.name.split(StructureNameHelper.GROUP_DELIMITER).length > 1).filter(s => s.parent?.id == id);
  }
  async findChildrenByName(name: string, token: string) {
    return (await this.findAll(token)).filter(s => s.name.split(StructureNameHelper.GROUP_DELIMITER).length > 1).filter(s => s.displayName.split(StructureNameHelper.GROUP_DELIMITER)[0] == name);
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
  async addUserToStructure(
    structureId: string,
    userId: string,
    username: string,
    token: string,
  ): Promise<void> {
    const URL: string = `${this._baseUrl}/${structureId}`;
    await axios.patch(
      URL,
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: [
          {
            op: 'add',
            path: 'members',
            value: [
              {
                display: username,
                value: userId,
              },
            ],
          },
        ],
      },
      this._getRequestOptions(token),
    );
  }
  async getStructureIdByName(name: string, token: string): Promise<string> {
    const structure: Structure = (await this.findOneByName(
      name,
      token,
    )) as Structure;
    return structure.id;
  }

  async removeUserFromStructure(
    structureId: string,
    userId: string,
    token: string,
  ) {
    await axios.patch(
      `${this._baseUrl}/${structureId}`,
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: [
          {
            op: 'remove',
            path: `members[value eq "${userId}"]`,
          },
        ],
      },
      this._getRequestOptions(token),
    );
  }
}
