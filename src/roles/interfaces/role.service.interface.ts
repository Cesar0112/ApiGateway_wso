import { Observable } from 'rxjs';
import { Role } from '../entities/role.entity';
import { AxiosResponse } from 'axios';

export interface IRoleService {
    createRole(data: Partial<Role>, token: string): Observable<Role>;
    getRoles(token: string): Observable<AxiosResponse<Role[]>>;
    getRoleById(id: string, token: string): Observable<AxiosResponse<Role>>;
    updateRole(id: string, data: Partial<Role>, token: string): Observable<AxiosResponse<Role>>;
    deleteRole(id: string, token: string): Observable<AxiosResponse<void>>;
}
