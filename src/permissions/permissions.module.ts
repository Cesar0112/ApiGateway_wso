import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { SessionModule } from '../session/session.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../entities/permission.entity';
import { PermissionCasdoorService } from './providers/casdoor/permission.casdoor.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [SessionModule, TypeOrmModule.forFeature([Permission]), ConfigModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionCasdoorService],
  exports: [PermissionsService, PermissionCasdoorService],
})
export class PermissionsModule { }
