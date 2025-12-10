import { forwardRef, Module } from '@nestjs/common';
import { RoleWSO2Service } from './providers/wso2/role_wso2.service';
import { RolesController } from './roles.controller';

import { ConfigService } from '../config/config.service';
import { SessionModule } from '../session/session.module';
import { EntitiesModule } from '../entities/entities.module';
import { RoleCasdoorService } from './providers/casdoor/role_casdoor.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { ROLE_SERVICE_PROVIDER_TOKEN } from './interfaces/role.service.interface';
import { RolesServiceProvider } from './providers/roles.service';
import { AuthenticateModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        proxy: false as const, //TODO Arreglar para entornos que viaje la petición a traves del proxy
        headers: { 'Content-Type': 'application/json' },
        httpsAgent: new (require('node:https').Agent)({
          rejectUnauthorized: configService.getConfig().NODE_ENV === 'production',
        }),
        global: true,
      }),
      inject: [ConfigService],
    }),
    SessionModule,
    EntitiesModule,
    PermissionsModule,
    forwardRef(() => AuthenticateModule)
  ],
  controllers: [RolesController],
  providers: [RoleWSO2Service, RoleCasdoorService, ConfigService, RolesServiceProvider],
  exports: [RoleWSO2Service, RoleCasdoorService, ROLE_SERVICE_PROVIDER_TOKEN],
})
export class RolesModule { }
