import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

import { ConfigService } from '../config/config.service';
import { SessionModule } from '../session/session.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from 'src/permissions/entities/permission.entity';

@Module({
  imports: [SessionModule, TypeOrmModule.forFeature([Role, Permission])],
  controllers: [RolesController],
  providers: [RolesService, ConfigService],
})
export class RolesModule {}
