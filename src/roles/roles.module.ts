import { Module } from '@nestjs/common';
import { RoleWSO2Service } from './providers/wso2/role_wso2.service';
import { RolesController } from './roles.controller';

import { ConfigService } from '../config/config.service';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    SessionModule,
  ],
  controllers: [RolesController],
  providers: [RoleWSO2Service, ConfigService],
  exports: [RoleWSO2Service],
})
export class RolesModule { }
