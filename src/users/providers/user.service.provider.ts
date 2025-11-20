// ...existing code...
import { Provider } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

import {
    IUsersServiceProvider,
    USERS_SERVICE_PROVIDER_TOKEN,
} from './users.interface.service';
import { UsersWSO2Service } from './wso2/users_wso2.service';
import { UsersCasdoorService } from './casdoor/users_casdoor.service';
import { UsersLocalService } from './local/users_local.service';
import { ConfigService } from '../../config/config.service';
import { IRoleService, ROLE_SERVICE_PROVIDER_TOKEN } from '../../roles/interfaces/role.service.interface';
import { EncryptionsService } from '../../encryptions/encryptions.service';

// Adapters (ajusta rutas/constructores según tu repo)


export const UsersServiceProviders: Provider = {
    provide: USERS_SERVICE_PROVIDER_TOKEN,
    useFactory: (config: ConfigService, roleService: IRoleService, encryptionService: EncryptionsService): IUsersServiceProvider => {
        const authType = config.getConfig().API_GATEWAY.AUTH_TYPE.toString().toLowerCase();
        switch (authType) {
            case 'wso2':
                return new UsersWSO2Service(config, roleService, encryptionService,);
            case 'casdoor':
                return new UsersCasdoorService(config);
            case 'local':
            default:
                return new UsersLocalService(config);
        }
    },
    inject: [ConfigService, ROLE_SERVICE_PROVIDER_TOKEN, EncryptionsService],
};
