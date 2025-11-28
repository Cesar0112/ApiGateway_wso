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
            //TODO Llamar a la API de Casdoor para obtener los permisos asociados al rol
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
}