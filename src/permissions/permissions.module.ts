import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { ConfigService } from '../config/config.service';
import { SessionModule } from '../session/session.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';

@Module({
  imports: [SessionModule, TypeOrmModule.forFeature([Permission])],
  controllers: [PermissionsController],
  providers: [ConfigService, PermissionsService],
})
export class PermissionsModule {}
