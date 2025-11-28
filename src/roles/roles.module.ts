import { Module } from '@nestjs/common';
import { RoleWSO2Service } from './providers/wso2/role_wso2.service';
import { RolesController } from './roles.controller';

import { ConfigService } from '../config/config.service';
import { SessionModule } from '../session/session.module';
import { EntitiesModule } from '../entities/entities.module';
import { RoleCasdoorService } from './providers/casdoor/role_casdoor.service';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    SessionModule,
    EntitiesModule,
    PermissionsModule
  ],
  controllers: [RolesController],
  providers: [RoleWSO2Service, RoleCasdoorService, ConfigService],
  exports: [RoleWSO2Service, RoleCasdoorService],
})
export class RolesModule { }
