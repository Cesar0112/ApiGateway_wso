// ...existing code...
import { Provider } from '@nestjs/common';

import {
    USERS_PROVIDER_TOKEN
} from '../interfaces/users.interface.service';
import { UsersWSO2Service } from './wso2/users_wso2.service';
import { UsersCasdoorService } from './casdoor/users_casdoor.service';
import { ConfigService } from '../../config/config.service';
import { ROLE_SERVICE_PROVIDER_TOKEN } from '../../roles/interfaces/role.service.interface';
import { EncryptionsService } from '../../encryptions/encryptions.service';
import { ModuleRef } from '@nestjs/core';
import { AUTH_TYPE_TOKEN } from '../../auth/auth.interface';

// Adapters (ajusta rutas/constructores según tu repo)


export const UsersServiceProviders: Provider = {
    provide: USERS_PROVIDER_TOKEN,
    useFactory: async (authType: string, moduleRef: ModuleRef) => {
        switch (authType) {
            case 'wso2':
                return await moduleRef.create(UsersWSO2Service);
            case 'casdoor':
                return await moduleRef.create(UsersCasdoorService);
            default:
                return await moduleRef.create(UsersWSO2Service);
        }
    },
    inject: [AUTH_TYPE_TOKEN, ModuleRef],
};
