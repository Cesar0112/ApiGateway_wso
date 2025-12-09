// src/auth/auth.provider.ts
import { Inject, Provider } from '@nestjs/common';
import { AUTH_SERVICE_TOKEN, AUTH_TYPE_TOKEN } from '../auth.interface';
import { AuthWSO2Service } from './wso2/auth_wso2.service';
import { AuthCasdoorService } from './casdoor/auth_casdoor.service';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '../../config/config.service';
import { ConfigModule } from '../../config/config.module';
import { SessionService } from '../../session/session.service';
import { SessionModule } from '../../session/session.module';
import { EncryptionsService } from '../../encryptions/encryptions.service';
import { UsersCasdoorService } from '../../users/providers/casdoor/users_casdoor.service';
import {
    Cache
} from "cache-manager"
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PermissionsService } from '../../permissions/permissions.service';
import { UsersWSO2Service } from '../../users/providers/wso2/users_wso2.service';
export const AuthServiceProvider: Provider =
{
    provide: AUTH_SERVICE_TOKEN,
    useFactory: (
        type: string,
        moduleRef: ModuleRef,
        configService: ConfigService,
        sessionService: SessionService,
        encryptionsService: EncryptionsService,
        usersService: UsersCasdoorService,
        cacheManager: Cache,
        permissionsService: PermissionsService,
        usersWSO2Service: UsersWSO2Service
    ) => {
        switch (type) {
            case 'casdoor': {
                return new AuthCasdoorService(configService, sessionService, encryptionsService, usersService, cacheManager);
            }
            case 'wso2':
            default:
                return new AuthWSO2Service(configService, encryptionsService, permissionsService, sessionService, usersWSO2Service, cacheManager);
        }
    },
    inject: [AUTH_TYPE_TOKEN, ModuleRef, ConfigService, SessionService, EncryptionsService, UsersCasdoorService, CACHE_MANAGER, PermissionsService, UsersWSO2Service],

};