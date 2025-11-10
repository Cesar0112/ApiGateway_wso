// src/auth/auth.provider.ts
import { Provider } from '@nestjs/common';
import { AUTH_SERVICE_TOKEN } from '../auth.interface';
import { ConfigService } from '../../config/config.service';
import { AuthWSO2Service } from '../services/auth_wso2.service';
import { AuthCasdoorService } from '../services/auth_casdoor.service';
import { UsersWSO2Service } from '../../users/services/wso2/users_wso2.service';
import { UsersCasdoorService } from '../../users/services/casdoor/users_casdoor.service';
import { EncryptionsService } from '../../encryptions/encryptions.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { SessionService } from '../../session/session.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt';

export const authProvider: Provider = {
    provide: AUTH_SERVICE_TOKEN,
    useFactory: (
        config: ConfigService,
        enc: EncryptionsService,
        perm: PermissionsService,
        sess: SessionService,
        cache: any,
        jwt: JwtService,
        usersWso2: UsersWSO2Service,
        usersCasdoor: UsersCasdoorService,
    ) => {
        const type = config.getConfig().API_GATEWAY?.AUTH_TYPE ?? 'wso2';

        switch (type) {
            case 'wso2':
                return new AuthWSO2Service(config, enc, perm, sess, usersWso2, cache);
            case 'casdoor':
                return new AuthCasdoorService(config, sess, enc, usersCasdoor, cache);
            default:
                return new AuthWSO2Service(config, enc, perm, sess, usersWso2, cache);
        }
    },
    inject: [
        ConfigService,
        EncryptionsService,
        PermissionsService,
        SessionService,
        CACHE_MANAGER,
        JwtService,
        UsersWSO2Service,
        UsersCasdoorService,
    ],
};