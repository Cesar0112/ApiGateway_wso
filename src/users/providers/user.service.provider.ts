// ...existing code...
import { Provider } from '@nestjs/common';

import {
    IUsersProvider,
    USERS_PROVIDER_TOKEN
} from '../interfaces/users.interface.service';
import { UsersWSO2Service } from './wso2/users_wso2.service';
import { UsersCasdoorService } from './casdoor/users_casdoor.service';
import { ModuleRef } from '@nestjs/core';
import { AUTH_TYPE_TOKEN } from '../../auth/auth.interface';

// Adapters (ajusta rutas/constructores según tu repo)


export const UsersServiceProviders: Provider = {
    provide: USERS_PROVIDER_TOKEN,
    useFactory: (authType: string, moduleRef: ModuleRef): IUsersProvider => {
        switch (authType) {
            case 'casdoor':
                return moduleRef.get(UsersCasdoorService, { strict: false });
            case 'wso2':
            default:
                return moduleRef.get(UsersWSO2Service, { strict: false });
        }
    },
    inject: [AUTH_TYPE_TOKEN, ModuleRef],
};
