import { Observable } from 'rxjs';
import { Role } from '../entities/role.entity';
import { AxiosResponse } from 'axios';

export interface IRoleService {
    createRole(data: Partial<Role>, token: string): Promise<Role>;
    getRoles(token: string): Promise<Role[]>;
    getRoleById(id: string, token: string): Promise<Role>;
    updateRole(id: string, data: Partial<Role>, token: string): Promise<Role>;
    deleteRole(id: string, token: string): Promise<void>;
}

export const ROLE_SERVICE_PROVIDER_TOKEN = Symbol('ROLE_SERVICE_PROVIDER');