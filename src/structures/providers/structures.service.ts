import { Provider } from "@nestjs/common";
import { ConfigService } from "../../config/config.service";
import { IStructureService, STRUCTURE_SERVICE } from "../interface/structure.interface";
import { StructuresCasdoorService } from "./casdoor/structures_casdoor.service";
import { StructuresWSO2Service } from "./wso2/structures_wso2.service";
import { IUsersService, USERS_SERVICE_PROVIDER_TOKEN } from "../../users/interfaces/users.interface.service";

export const StructuresServiceProvider: Provider = {
    provide: STRUCTURE_SERVICE,
    useFactory: (config: ConfigService, usersService: IUsersService): IStructureService => {
        const authType = config.getConfig().API_GATEWAY.AUTH_TYPE.toString().toLowerCase();

        switch (authType) {
            case 'wso2':
                return new StructuresWSO2Service(config, usersService);
            case 'casdoor':
                return new StructuresCasdoorService(config);
            case 'local':
            default:
                return new StructuresWSO2Service(config);

        }
    },
    inject: [ConfigService, USERS_SERVICE_PROVIDER_TOKEN],
};