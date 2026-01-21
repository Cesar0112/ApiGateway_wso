// src/auth/auth.provider.ts
import { Provider } from '@nestjs/common';
import { AUTH_SERVICE_TOKEN, AUTH_TYPE_TOKEN } from '../auth.interface';
import { AuthWSO2Service } from './wso2/auth_wso2.service';
import { AuthCasdoorService } from './casdoor/auth_casdoor.service';
export const AuthServiceProvider: Provider =
{

    provide: AUTH_SERVICE_TOKEN,
    useFactory: (
        type: string,
        casdoor: AuthCasdoorService,
        wso2: AuthWSO2Service,
    ) => {
        switch (type) {
            case 'casdoor': {
                return casdoor;
            }
            case 'wso2':
            default:
                return wso2;
        }
    },

    inject: [AUTH_TYPE_TOKEN, AuthCasdoorService, AuthWSO2Service],

};