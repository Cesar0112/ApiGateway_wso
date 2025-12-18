import { Injectable, Logger } from "@nestjs/common";
import { Permission } from "../../../entities/permission.entity";
import { HttpService } from "@nestjs/axios";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "../../../config/config.service";
import { firstValueFrom } from "rxjs";
import { CasdoorBaseService } from "../../../common/casdoorbase.service";
import { ICasdoorBaseInterfaceService } from "../../../common/casdoorbase.interface.service";
import { PermissionCasdoorMapper } from "./permission.mapper";
import { IPermissionCasdoor } from "./permission.casdoor.interface";
import { CreatePermissionDto } from "../../dto/create-permission.dto";
@Injectable()
export class PermissionCasdoorService implements ICasdoorBaseInterfaceService {
    private readonly logger = new Logger(PermissionCasdoorService.name);
    private readonly baseUrl: string;
    casdoorBaseObject: CasdoorBaseService;
    constructor(protected readonly configService: ConfigService, private readonly httpService: HttpService, @InjectRepository(Permission) private readonly permissionRepository: Repository<Permission>) {
        this.casdoorBaseObject = new CasdoorBaseService(this.configService);
    }

    /**
     * @param id owner/name
     * @param token 
     */
    async getPermissionsByRoleId(id: string, token: string): Promise<Permission[]> {
        try {
            let data: Permission[] = [];
            const url = this.casdoorBaseObject.buildApiUrl('get-permissions-by-role');
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    params: { id },
                    headers: this.casdoorBaseObject.getAuthHeaders(token),
                }),
            );
            if (!response.data.data) return [];
            data = response.data.data.map((p: IPermissionCasdoor) => PermissionCasdoorMapper.toPermissionEntity(p));
            return data;
        } catch (error) {
            this.casdoorBaseObject.handleError(error, 'Get permissions by role id');
            return [];
        }
    }


    async findAll(token: string): Promise<Permission[]> {
        try {
            let data: Permission[] = [];
            const url = this.casdoorBaseObject.buildApiUrl('get-permissions');
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    headers: this.casdoorBaseObject.getAuthHeaders(token),
                }),
            );
            if (!response.data.data) return [];
            data = response.data.data.map((p: IPermissionCasdoor) => PermissionCasdoorMapper.toPermissionEntity(p));
            return data;
        } catch (error) {
            this.casdoorBaseObject.handleError(error, 'Get all permissions');
            return [];
        }
    }

    async findOne(id: string, token: string): Promise<Permission | null> {
        try {
            if (!id.startsWith(this.configService.getConfig().CASDOOR.ORG_NAME + "/")) {
                id = `${this.configService.getConfig().CASDOOR.ORG_NAME}/${id}`;
            }
            const url = this.casdoorBaseObject.buildApiUrl('get-permission');
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    params: { id },
                    headers: this.casdoorBaseObject.getAuthHeaders(token),
                }),
            );
            if (!response.data.data) return null;
            return PermissionCasdoorMapper.toPermissionEntity(response.data.data);
        } catch (error) {
            this.casdoorBaseObject.handleError(error, 'Get permission by id');
            return null;
        }
    }

    async create(data: CreatePermissionDto, token: string): Promise<Permission> {
        try {
            if (await this.findOneByName(data.value, token)) {
                throw new Error(`Permission with name ${data.value} already exists`);
            }
            const url = this.casdoorBaseObject.buildApiUrl('add-permission');
            const body: Omit<IPermissionCasdoor, 'id'> = {
                name: data.value,
                owner: this.configService.getConfig().CASDOOR.ORG_NAME,
                displayName: data.displayName,
                description: '',
                users: [`${this.configService.getConfig().CASDOOR.ORG_NAME}/administrador_winteli`],//FIXME agregar el que pertenece el permiso por parámetros actualizando por el servicio controller de usuarios no por aquí
                isEnabled: true,
                actions: ["Read", "Write", "Admin"],
                adapter: "",
                approveTime: this.getCurrentIsoWithOffset(),
                approver: "",
                createdTime: this.getCurrentIsoWithOffset(),
                domains: [],
                effect: "Allow",
                groups: [],
                model: "model_ifyc4e",
                resourceType: "Application",
                resources: ["app-built-in"],
                roles: ["organization_winteli/administrador"],
                state: "Approved",
                submitter: "admin"
            }
            const response = await firstValueFrom(
                this.httpService.post(url, body, {
                    headers: this.casdoorBaseObject.getAuthHeaders(token),
                }),
            );

            return PermissionCasdoorMapper.toPermissionEntity(response.data.data);
        } catch (error) {
            this.casdoorBaseObject.handleError(error, `Create permission ${data.value}` + (error.msg || ''));
            throw error;
        }
    }

    async update(id: string, data: Partial<IPermissionCasdoor>, token: string): Promise<Permission> {
        try {
            if (!id.startsWith(this.configService.getConfig().CASDOOR.ORG_NAME + "/")) {
                id = `${this.configService.getConfig().CASDOOR.ORG_NAME}/${id}`;
            }
            if (await this.findOne(id, token)) {
                throw new Error(`Permission with id ${id} does not exist`);
            }
            const url = this.casdoorBaseObject.buildApiUrl('update-permission');
            const response = await firstValueFrom(
                this.httpService.post(url, data, {
                    params: { id },
                    headers: this.casdoorBaseObject.getAuthHeaders(token),
                }),
            );
            if (response.data.status !== 'ok') {
                throw new Error(response.data.msg || `Failed to update permission with ${id}`);
            }
            return PermissionCasdoorMapper.toPermissionEntity(response.data.data);
        } catch (error) {
            this.casdoorBaseObject.handleError(error, 'Update permission');
            throw error;
        }
    }
    async delete(id: string, token: string): Promise<void> {
        try {
            if (!id.startsWith(this.configService.getConfig().CASDOOR.ORG_NAME + "/")) {
                id = `${this.configService.getConfig().CASDOOR.ORG_NAME}/${id}`;
            }
            const url = this.casdoorBaseObject.buildApiUrl('delete-permission');
            const response = await firstValueFrom(
                this.httpService.post(url, { name: id.split('/')[1], owner: id.split('/')[0] }, {
                    headers: this.casdoorBaseObject.getAuthHeaders(token),
                }),
            );
            if (response.data.status !== 'ok') {
                throw new Error(response.data.msg || `Failed to delete permission with ${id}`);
            }
        } catch (error) {
            this.casdoorBaseObject.handleError(error, 'Delete permission');
            throw error;
        }
    }
    async findOneByName(name: string, token: string): Promise<Permission | null> {
        try {
            return await this.findOne(name, token);
        } catch (error) {
            this.casdoorBaseObject.handleError(error, 'Get permission by name');
            return null;
        }
    }
    getCurrentIsoWithOffset(): string {
        const now = new Date();
        const offset = -now.getTimezoneOffset(); // minutos de diferencia con UTC
        const sign = offset >= 0 ? '+' : '-';
        const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
        const minutes = String(Math.abs(offset) % 60).padStart(2, '0');

        return now.toISOString().slice(0, 19) + sign + hours + ':' + minutes;
    };
}