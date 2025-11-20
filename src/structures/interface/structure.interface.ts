/**
 * Contratos que deben implementar todos los servicios de "estructura".
 * Archivo: src/structures/interface/structure.interface.ts
 */

export type SortDirection = 'asc' | 'desc';

export interface QueryParams {
    limit?: number;
    offset?: number;
    filter?: Record<string, any>;
    sort?: Record<string, SortDirection>;
    includeRelations?: string[];
}

/** Resultado paginado genérico */
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
}

/** Resultado de una importación masiva */
export interface ImportResult {
    imported: number;
    failed: number;
    errors?: Array<{ index: number; reason: string; item?: any }>;
}

/**
 * Interfaz base para servicios de estructuras.
 * T: entidad (modelo) que gestiona el servicio.
 * CreateDto / UpdateDto: DTOs para creación/actualización.
 */
export interface IStructureService<
    T = unknown,
    CreateDto = T,
    UpdateDto = Partial<T>
> {
    /** Crea una nueva entidad */
    create(dto: CreateDto, token: string): Promise<T>;

    /** Lista todas las entidades que cumplen los parámetros */
    findAll(token: string): Promise<T[]>;

    /** Listado paginado (opcional) */
    findPaginated?(params?: QueryParams): Promise<PaginatedResult<T>>;

    /** Obtiene una entidad por id, devuelve null si no existe */
    findOne(id: string, token: string, include?: string): Promise<T | null>;

    /** Actualiza una entidad existente */
    update(id: string, dto: UpdateDto, token: string): Promise<T>;


    remove(id: string, token: string): Promise<void>;

    validate?(payload: Partial<T>, token: string): Promise<boolean>;

    findOneByName(name: string, token: string, include?: string): Promise<T | null>;
    /** Importación masiva de elementos */
    import?(items: CreateDto[]): Promise<ImportResult>;

    /** Exporta datos en el formato indicado (opcional) */
    export?(format?: 'json' | 'csv'): Promise<string | Buffer>;

    /** Comprueba permisos sobre un recurso para un usuario (opcional) */
    hasPermission?(userId: string, action: string, resourceId?: string): Promise<boolean>;
}
export const STRUCTURE_SERVICE = Symbol('STRUCTURE_SERVICE_TOKEN');