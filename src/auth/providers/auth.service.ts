// src/auth/auth.provider.ts
import { Provider } from '@nestjs/common';
import { AUTH_SERVICE_TOKEN, AUTH_TYPE_TOKEN } from '../auth.interface';
import { AuthWSO2Service } from './wso2/auth_wso2.service';
import { AuthCasdoorService } from './casdoor/auth_casdoor.service';
import { ModuleRef } from '@nestjs/core';

export const FactoryAuthProvider: Provider =
{
    provide: AUTH_SERVICE_TOKEN,
    useFactory: async (
        type: string,
        moduleRef: ModuleRef,
    ) => {

        switch (type) {
            case 'wso2':
                return await moduleRef.create(AuthWSO2Service);
            case 'casdoor':
                return await moduleRef.create(AuthCasdoorService);
            default:
                return await moduleRef.create(AuthWSO2Service);
        }
    },
    inject: [AUTH_TYPE_TOKEN, ModuleRef],
};