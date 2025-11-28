// src/auth/auth.provider.ts
import { Provider } from '@nestjs/common';
import { AUTH_SERVICE_TOKEN, AUTH_TYPE_TOKEN } from '../auth.interface';
import { AuthWSO2Service } from './wso2/auth_wso2.service';
import { AuthCasdoorService } from './casdoor/auth_casdoor.service';
import { ModuleRef } from '@nestjs/core';

export const AuthServiceProvider: Provider =
{
    provide: AUTH_SERVICE_TOKEN,
    useFactory: (
        type: string,
        moduleRef: ModuleRef,
    ) => {
        switch (type) {
            case 'casdoor':
                return moduleRef.get(AuthCasdoorService, { strict: false });
            case 'wso2':
            default:
                return moduleRef.get(AuthWSO2Service, { strict: false });
        }
    },
    inject: [AUTH_TYPE_TOKEN, ModuleRef],
};