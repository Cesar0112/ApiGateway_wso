// ...existing code...
import { Provider } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import { IRoleServiceProvider, ROLE_SERVICE_PROVIDER_TOKEN } from '../interfaces/role.service.interface';
import { RoleWSO2Service } from './wso2/role_wso2.service';


export const RolesServiceProvider: Provider = {
    provide: ROLE_SERVICE_PROVIDER_TOKEN,
    useFactory: (config: ConfigService): IRoleServiceProvider => {
        const authType = config.getConfig().API_GATEWAY.AUTH_TYPE.toString().toLowerCase();
        switch (authType) {
            case 'wso2':
                return new RoleWSO2Service(config);
            default:
                return new RoleWSO2Service(config);
        }
    },
    inject: [ConfigService],
};