// ...existing code...
import { Provider } from '@nestjs/common';
import { IRoleServiceProvider, ROLE_SERVICE_PROVIDER_TOKEN } from '../interfaces/role.service.interface';
import { RoleWSO2Service } from './wso2/role_wso2.service';
import { AUTH_TYPE_TOKEN } from '../../auth/auth.interface';
import { ModuleRef } from '@nestjs/core';
import { RoleCasdoorService } from './casdoor/role_casdoor.service';


export const RolesServiceProvider: Provider = {
    provide: ROLE_SERVICE_PROVIDER_TOKEN,
    useFactory: (authType: string, moduleRef: ModuleRef): IRoleServiceProvider => {
        switch (authType) {
            case 'casdoor':
                return moduleRef.get(RoleCasdoorService, { strict: false });
            case 'wso2':
            default:
                return moduleRef.get(RoleWSO2Service, { strict: false });
        }

    },
    inject: [AUTH_TYPE_TOKEN, ModuleRef],
};