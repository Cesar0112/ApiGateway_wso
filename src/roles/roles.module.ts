import { forwardRef, Module } from '@nestjs/common';
import { RoleWSO2Service } from './services/role_wso2.service';
import { RolesController } from './roles.controller';

import { ConfigService } from '../config/config.service';
import { SessionModule } from '../session/session.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { AuthenticateModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthenticateModule),
    SessionModule,
    TypeOrmModule.forFeature([Role, Permission]),
  ],
  controllers: [RolesController],
  providers: [RoleWSO2Service, ConfigService],
  exports: [RoleWSO2Service],
})
export class RolesModule {}
