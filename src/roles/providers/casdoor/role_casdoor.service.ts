
import { InjectRepository } from "@nestjs/typeorm";
import { IRoleServiceProvider } from "../../interfaces/role.service.interface";
import { Role } from "../../../entities/role.entity";
import { Repository } from "typeorm";
import { BadRequestException, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "../../../config/config.service";
import { firstValueFrom } from "rxjs";
import { RoleCasdoorMapper } from "./role.casdoor.mapper";
import { IRoleCasdoor } from "./role.casdoor.interface";
import { PermissionCasdoorService } from "../../../permissions/providers/casdoor/permission.casdoor.service";
import { ICasdoorBaseInterfaceService } from "../../../common/casdoorbase.interface.service";
import { CasdoorBaseService } from "../../../common/casdoorbase.service";

export class RoleCasdoorService implements IRoleServiceProvider, ICasdoorBaseInterfaceService {

    readonly _logger = new Logger(RoleCasdoorService.name);
    readonly baseUrl: string;
    readonly owner: string;
    casdoorBaseObject: CasdoorBaseService;


    constructor(readonly configService: ConfigService, readonly httpService: HttpService,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        private readonly permissionService: PermissionCasdoorService
    ) {
        const cfg = this.configService.getConfig().CASDOOR;
        this.baseUrl = cfg.ENDPOINT;
        this.owner = cfg.ORG_NAME || 'built-in';
        this.casdoorBaseObject = new CasdoorBaseService(this.configService);

    }

    createRole(data: Partial<Role>, token: string): Promise<Role> {
        throw new Error("Method not implemented.");
    }
    async getRoles(token: string): Promise<Role[]> {
        try {
            const url = this.buildApiUrl('get-roles');
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    params: { owner: this.owner },
                    headers: this.getAuthHeaders(token),
                }),
            );
            if (response.data.status !== 'ok') {
                throw new BadRequestException(response.data.msg);
            }
            return Promise.all(
                response.data.data.map(
                    async (role: IRoleCasdoor) => RoleCasdoorMapper.fromCasdoorToRole(role, await this.permissionService.getPermissionsByRoleId(`${role.owner}/${role.name}`, token))));
        } catch (error) {
            this.handleError(error, `Get all roles failed ${error.msg}`);
            return [];
        }
    }
    async getRolesFromUser(username, token: string): Promise<Role[]> {
        try {
            const url = this.buildApiUrl('get-roles');
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    params: { owner: this.owner },
                    headers: this.getAuthHeaders(token),
                }),
            );
            if (response.data.status !== 'ok') {
                throw new BadRequestException(response.data.msg);
            }
            response.data.data = response.data.data.filter((role: IRoleCasdoor) => role.users?.includes(username));
            return Promise.all(
                response.data.data.map(
                    async (role: IRoleCasdoor) => RoleCasdoorMapper.fromCasdoorToRole(role, await this.permissionService.getPermissionsByRoleId(`${role.owner}/${role.name}`, token))));
        } catch (error) {
            this.handleError(error, `Get all roles failed ${error.msg}`);
            return [];
        }
    }
    getRoleById(id: string, token: string): Promise<Role> {
        throw new Error("Method not implemented.");
    }
    updateRole(id: string, data: Partial<Role>, token: string): Promise<Role> {
        throw new Error("Method not implemented.");
    }
    deleteRole(id: string, token: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public get headers() {
        return this.casdoorBaseObject.headers;
    }

    public getAuthHeaders(token: string) {
        return this.casdoorBaseObject.getAuthHeaders(token);
    }
    // === HELPERS ===
    public buildApiUrl(path: string): string {
        return this.casdoorBaseObject.buildApiUrl(path);
    }

    public handleError(error: any, context: string) {
        this.casdoorBaseObject.handleError(error, context);
    }
}