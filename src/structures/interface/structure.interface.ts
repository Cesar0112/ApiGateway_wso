import { Structure } from '../../entities/structure.entity';
import { CreateStructureDto } from '../dto/create-structure.dto';
import { UpdateStructureDto } from '../dto/update-structure.dto';
import { AxiosRequestConfig } from 'axios';
import { ConfigService } from '../../config/config.service';
import * as https from 'https';
import { IUsersProvider } from '../../users/interfaces/users.interface.service';
import { Logger } from '@nestjs/common';

/**
 * IStructureProvider — contrato concreto que deben implementar todos los proveedores de estructuras.
 * Sin genéricos: define exactamente qué debe soportar cada implementación (WSO2, Casdoor, Local).
 * 
 * Sigue el patrón pluggable del proyecto: cada proveedor implementa esta interfaz,
 * y StructuresService inyecta la implementación correcta según API_GATEWAY.AUTH_TYPE.
 */
export interface IStructureServiceProvider {
    // CRUD básico
    findAll(token: string): Promise<Structure[]>;
    findOne(id: string, token: string, include?: string): Promise<Structure>;
    findOneByName(name: string, token: string, include?: string): Promise<Structure>;
    findByIds(ids: string[], token: string): Promise<Structure[]>;
    create(dto: CreateStructureDto, token: string): Promise<Structure>;
    update(id: string, dto: UpdateStructureDto, token: string): Promise<Structure>;
    remove(id: string, token: string): Promise<void>;

    // Relaciones jerárquicas (específicas de estructuras)
    getStructuresFromUser(userId: string, token: string): Promise<Structure[]>;
    getParentStructure(displayName: string, token: string): Promise<Structure | null>;
    findChildren(id: string, token: string): Promise<Structure[]>;
    findChildrenByName(name: string, token: string): Promise<Structure[]>;
    getStructureIdByName(name: string, token: string): Promise<string>;

    // Gestión de usuarios en estructuras
    addUserToStructure(
        structureId: string,
        userId: string,
        username: string,
        token: string,
    ): Promise<void>;
    removeUserFromStructure(
        structureId: string,
        userId: string,
        token: string,
    ): Promise<void>;
    _getRequestOptions(token: string): AxiosRequestConfig;
}
export abstract class BaseStructureServiceProvider implements IStructureServiceProvider {
    protected readonly _logger: Logger;
    protected readonly _baseUrl: string;

    constructor(protected readonly configService: ConfigService, protected readonly usersService: IUsersProvider) {
    }
    abstract findAll(token: string): Promise<Structure[]>;
    abstract findOne(id: string, token: string, include?: string);
    abstract findOneByName(name: string, token: string, include?: string);
    abstract findByIds(ids: string[], token: string): Promise<Structure[]>;
    abstract create(dto: CreateStructureDto, token: string): Promise<Structure>;
    abstract update(id: string, dto: UpdateStructureDto, token: string): Promise<Structure>;
    abstract remove(id: string, token: string): Promise<void>;
    abstract getStructuresFromUser(userId: string, token: string): Promise<Structure[]>;
    abstract getParentStructure(displayName: string, token: string): Promise<Structure | null>;
    abstract findChildren(id: string, token: string): Promise<Structure[]>;
    abstract findChildrenByName(name: string, token: string): Promise<Structure[]>;
    abstract getStructureIdByName(name: string, token: string): Promise<string>;
    abstract addUserToStructure(structureId: string, userId: string, username: string, token: string): Promise<void>;
    abstract removeUserFromStructure(structureId: string, userId: string, token: string): Promise<void>;
    _getRequestOptions(token: string): AxiosRequestConfig {
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
}
export const STRUCTURE_SERVICE_PROVIDER = Symbol('STRUCTURE_SERVICE_PROVIDER');