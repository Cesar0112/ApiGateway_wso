import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    BadRequestException,
    Logger,
    Inject,
    forwardRef,
} from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CreateStructureDto } from '../../dto/create-structure.dto';
import { UpdateStructureDto } from '../../dto/update-structure.dto';
import { Structure } from '../../entities/structure.entity';
import { ConfigService } from '../../../config/config.service';
import * as https from 'https';
import { StructureNameHelper } from '../../structure.helper';
import { StructureMapper } from '../../structure.mapper';
import { UsersWSO2Service } from 'src/users/providers/wso2/users_wso2.service';

//FIXME Arreglar que no se mapee directamente desde aquí sino desde el controller
@Injectable()
export class StructuresCasdoorService {

    private readonly _baseUrl: string;
    private readonly _logger = new Logger(StructuresCasdoorService.name);
    constructor(protected readonly configService: ConfigService, @Inject(forwardRef(() => UsersWSO2Service)) private readonly usersService: UsersWSO2Service) {
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
    async getStructuresFromUser(userId: string, token: string): Promise<Structure[]> {
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
            if (StructureNameHelper.isExisting(dto.name, existingNames)) {
                throw new BadRequestException(`No se puede crear la estructura ${dto.name} ya que existe una con ese nombre`);
            }

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
    async getParentStructure(displayName: string, token: string): Promise<Structure | null> {
        const parts = displayName.split(StructureNameHelper.GROUP_DELIMITER);
        if (parts.length <= 1) return null;
        const parentName = parts[0];
        return this.findOneByName(parentName, token);
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

    async findOne(id: string, token: string, include?: string): Promise<Structure> {
        try {
            const res: AxiosResponse<any> = await axios.get(
                `${this._baseUrl}/${id}`,
                this._getRequestOptions(token),
            );
            const baseStructure = StructureMapper.mapFromWSO2(res.data);
            if (!include?.length) return baseStructure;
            // Fetch adicional: users
            if (include.includes('users')) {
                baseStructure.users = await Promise.all(res.data.members.map((u: { display: string }) => this.usersService.getUserByUsername(u.display, token)));
            }

            // Fetch adicional: parent
            if (include.includes('parent')) {
                baseStructure.parent = await this.getParentStructure(baseStructure.displayName, token);
            }

            // Fetch adicional: children
            if (include.includes('children')) {
                baseStructure.children = await this.findChildrenByName(baseStructure.name, token);
            }

            return baseStructure;
        } catch (err: any) {
            if (err.response?.status === 404)
                throw new NotFoundException(`Structure ${id} not found`);
            throw new InternalServerErrorException(
                'Error buscando estructura en WSO2',
            );
        }
    }

    async findOneByName(name: string, token: string, include?: string): Promise<Structure> {
        try {
            const res: AxiosResponse<any> = await axios.get(
                `${this._baseUrl}?filter=displayName ew "${name}"`,
                this._getRequestOptions(token),
            );
            const found = res.data?.Resources?.[0];
            if (!found) throw new NotFoundException(`Structure ${name} not found`);

            const baseStructure = StructureMapper.mapFromWSO2(found);
            if (!include?.length) return baseStructure;
            // Fetch adicional: users
            if (include.includes('users')) {
                baseStructure.users = await Promise.all(res.data.members.map((u: { display: string }) => this.usersService.getUserByUsername(u.display, token)));
            }

            // Fetch adicional: parent
            if (include.includes('parent')) {
                baseStructure.parent = await this.getParentStructure(baseStructure.name, token);
            }

            // Fetch adicional: children
            if (include.includes('children')) {
                baseStructure.children = await this.findChildrenByName(baseStructure.name, token);
            }
            return baseStructure;

        } catch (err: any) {
            throw new InternalServerErrorException(
                'Error buscando estructura por nombre en WSO2',
            );
        }
    }

    /*async update(
      id: string,
      dto: UpdateStructureDto,
      token: string,
    ): Promise<Structure> {
      try {
        const dtoAny = dto as any;
        const delimiter = StructureNameHelper.GROUP_DELIMITER;
        const current = await this.validateStructureExists(id, token);
        const {
          operations,
          newDisplayName,
          nameChanged,
          parentChanged,
          oldDisplayName,
        } = await this.computeDisplayNameChanges(id, current, dtoAny, token);
        // 4) Aplicar PATCH al padre (si hay ops)
        if (operations.length) {
          await this.applyPatch(id, operations, token);
        }
  
        // 5) Actualizar descendientes si el displayName cambió
        if (nameChanged || parentChanged) {
  
          await this.updateDescendants(
            oldDisplayName,
            newDisplayName,
            delimiter,
            token,
          );
  
        }
        // obtener hijos actuales
        const directChildren = await this.findChildren(id, token);
        const directChildIds = directChildren.map(c => c.id);
        const childrenToAssign = Array.isArray(dtoAny.childrenIds)
          ? dtoAny.childrenIds.map((c: any) =>
            typeof c === 'string' ? c : c.id,
          )
          : [];
        // 6) Si dto.children fue pasado, sincronizar hijos explícitos:
        if (childrenToAssign.length) {
          await this.syncChildrenAssignments(
            newDisplayName,
            directChildIds,
            childrenToAssign,
            delimiter,
            token,
          );
        } else {
          await this.removeAllChildren(directChildIds, token);
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
    }*/

    async update(
        id: string,
        dto: UpdateStructureDto,
        token: string,
    ): Promise<Structure> {
        try {
            const [current, allStructures] = await Promise.all([
                this.findOne(id, token),
                this.findAll(token)
            ]);
            if (!current) {
                throw new NotFoundException(`Estructura ${id} no encontrada`);
            }
            if (dto.name && dto.parentName && (dto.name === dto.parentName)) {
                throw new BadRequestException(`El padre no puede ser su propio hijo`);
            }
            const dtoAny = dto as any;
            // Verificar cambios de parent
            if (dtoAny.parentName || dtoAny.name) {
                if (dtoAny.parentName && dtoAny.parentName !== current.displayName.split(StructureNameHelper.GROUP_DELIMITER)?.[0]) {
                    // Validar que el nuevo padre exista
                    const newParent = allStructures.find((s) => s.name === dtoAny.parentName);
                    if (!newParent) {
                        throw new NotFoundException(`El nuevo padre '${dtoAny.parentName}' no existe`);
                    }

                    // 🔄 DETECCIÓN MEJORADA DE CICLOS
                    await StructureNameHelper.checkForCycles(current, dtoAny.parentName, allStructures, token);
                }
                /*if (dtoAny.childrenIds) {
                  await StructureNameHelper.validateChildrenAssignment(current.displayName.split(StructureNameHelper.GROUP_DELIMITER)?.[0], dtoAny.childrenIds, allStructures, token);
                }*/
                // 1️⃣ Verificar si hay cambios de nombre o padre
                const { newDisplayName, nameChanged, parentChanged, operations } =
                    await this.computeDisplayNameChanges(id, current, dtoAny, token);
                if (parentChanged) {
                    const allStructures = await this.findAll(token);

                    // Validar que el nuevo padre exista
                    const newParent = allStructures.find((s) => s.name === dtoAny.parentName);
                    if (!newParent && dtoAny.parentName) {
                        throw new NotFoundException(`El nuevo padre '${dtoAny.parentName}' no existe`);
                    }
                }

                // 2️⃣ Aplicar PATCH principal
                if (operations.length) {
                    await this.applyPatch(id, operations, token);
                }
                if (nameChanged || parentChanged) {
                    await this.updateDescendants(id, current.displayName, newDisplayName, token);
                }
            }
            // 3️⃣ Si el nombre o el padre cambió, actualizar descendientes


            // 4️⃣ Sincronizar hijos explícitos si fueron pasados
            //await this.syncChildrenAssignments(id, dtoAny.childrenIds, newDisplayName, token);
            if (dtoAny.childrenIds) {
                await Promise.all(dtoAny.childrenIds.map((c: string) => {
                    this.update(c, {
                        "parentName": current.name
                    },
                        token)
                }))
            }
            // 5️⃣ Devolver la entidad actualizada
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

    private async computeDisplayNameChanges(
        id: string,
        current: Structure,
        dtoAny: any,
        token: string,
    ): Promise<{
        newDisplayName: string;
        nameChanged: boolean;
        parentChanged: boolean;
        operations: any[];
    }> {
        const operations: any[] = [];
        const delimiter = StructureNameHelper.GROUP_DELIMITER;
        let newDisplayName = current.displayName;
        let nameChanged = false;
        let parentChanged = false;

        const allStructures = await this.findAll(token);

        if ('name' in dtoAny && dtoAny.name && dtoAny.name !== current.name) {
            nameChanged = true;
        }

        if ('parentName' in dtoAny && dtoAny.parentName !== current.displayName.split(delimiter)[0]) {
            parentChanged = true;
        }

        if (nameChanged || parentChanged) {
            let parentSegment: string | null = null;

            if (dtoAny.parentName) {
                // 🔍 Validar existencia del nuevo padre
                const parent = allStructures.find(
                    (s) => s.name === dtoAny.parentName || s.displayName === dtoAny.parentName,
                );
                if (!parent) {
                    throw new BadRequestException(`El padre '${dtoAny.parentName}' no existe`);
                }
                parentSegment = parent.name;
            }
            if (dtoAny.name) {
                // 🔍 Validar que no exista el nuevo nombre
                if (StructureNameHelper.isExisting(dtoAny.name, allStructures.map((s) => s.name))) {
                    throw new BadRequestException(`El nombre '${dtoAny.name}' ya existe`);
                }

            }
            // 🧱 Construir nuevo displayName
            newDisplayName = StructureNameHelper.buildPath(
                parentSegment ? [parentSegment, dtoAny.name ?? current.name] : [dtoAny.name ?? current.name],
            );

            // 🧩 Validar unicidad
            const existingNames = allStructures
                .filter((s) => s.id !== id)
                .map((s) => s.displayName);
            if (StructureNameHelper.isExisting(newDisplayName, existingNames)) {
                throw new BadRequestException(`Error ya existe esta estructura`)
            }

            // Agregar operación PATCH
            operations.push({
                op: 'replace',
                path: 'displayName',
                value: newDisplayName,
            });
        }

        return { newDisplayName, nameChanged, parentChanged, operations };
    }

    private async applyPatch(id: string, operations: any[], token: string): Promise<void> {
        await axios.patch(
            `${this._baseUrl}/${id}`,
            {
                schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
                Operations: operations,
            },
            this._getRequestOptions(token),
        );
    }
    private async updateDescendants(
        id: string,
        oldDisplayName: string,
        newDisplayName: string,
        token: string,
    ): Promise<void> {
        const delimiter = StructureNameHelper.GROUP_DELIMITER;
        const allStructures = await this.findAll(token);
        const prefix = oldDisplayName + delimiter;

        const descendants = allStructures.filter((s) => s.displayName.startsWith(prefix));

        for (const desc of descendants) {
            const suffix = desc.displayName.substring(prefix.length);
            const descNewDisplayName = `${newDisplayName}${delimiter}${suffix}`;

            await this.applyPatch(desc.id, [
                {
                    op: 'replace',
                    path: 'displayName',
                    value: descNewDisplayName,
                },
            ], token);
        }
    }

    private async syncChildrenAssignments(
        parentId: string,
        childrenIds: string[] | undefined,
        parentDisplayName: string,
        token: string,
    ): Promise<void> {
        const delimiter = StructureNameHelper.GROUP_DELIMITER;
        const [directChildren, allStructures, parent] = await Promise.all([
            this.findChildren(parentId, token),
            this.findAll(token),
            this.findOne(parentId, token)
        ]);


        if (!parent) {
            throw new NotFoundException(`Parent structure ${parentId} not found`);
        }
        if (!(allStructures.length > 0)) {
            this._logger.error("No se encuentran las estructuras en wso2 verifica si existen o verifica las configuraciones de conexión");
            throw new BadRequestException("Error contacte al administrador");
        }

        const directChildIds = directChildren.map(c => c.id);
        const childrenToAssign = Array.isArray(childrenIds)
            ? childrenIds.map((c: any) => (typeof c === 'string' ? c : c.id)).filter(Boolean)
            : [];
        if (childrenToAssign.length > 0) {
            await StructureNameHelper.validateChildrenAssignment(parent.name, childrenToAssign, allStructures, token);
        }
        const results = {
            success: [] as string[],
            errors: [] as string[]
        };
        if (childrenToAssign.length > 0) {
            // 🔹 Quitar hijos que ya no pertenecen
            const toRemove = directChildIds.filter(cid => !childrenToAssign.includes(cid));
            for (const cid of toRemove) {
                const child = allStructures.find(s => s.id === cid);
                await this.applyPatch(cid, [
                    {
                        op: 'replace',
                        path: 'displayName',
                        value: child?.name,
                    },
                ], token);
            }

            // 🔹 Asignar nuevos hijos
            for (const cid of childrenToAssign) {
                const child = allStructures.find(s => s.id === cid);
                if (!child) {
                    continue;
                }

                const childNewDisplayName = `${parentDisplayName}${delimiter}${child.name}`;
                await this.applyPatch(cid, [
                    {
                        op: 'replace',
                        path: 'displayName',
                        value: childNewDisplayName,
                    },
                ], token);
            }
        } else {
            // 🔹 dto.children vacío → quitar todos los hijos
            for (const cid of directChildIds) {
                const child = await this.findOne(cid, token);
                await this.applyPatch(cid, [
                    {
                        op: 'replace',
                        path: 'displayName',
                        value: child.name,
                    },
                ], token);
            }
        }
    }

    async findChildren(id: string, token: string) {
        return (await this.findAll(token)).filter(s => s.displayName.split(StructureNameHelper.GROUP_DELIMITER).length > 1).filter(s => s.parent?.id == id);
    }
    async findChildrenByName(name: string, token: string) {
        const allStructures = await this.findAll(token);
        const delimiter = StructureNameHelper.GROUP_DELIMITER;
        const prefix = name + delimiter;
        return allStructures.filter((s) =>
            (s.displayName.startsWith(prefix)) &&
            s.displayName !== name
        )
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
