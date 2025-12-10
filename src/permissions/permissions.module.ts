import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { SessionModule } from '../session/session.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../entities/permission.entity';
import { PermissionCasdoorService } from './providers/casdoor/permission.casdoor.service';
import { ConfigModule } from '../config/config.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    SessionModule,
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
    }), TypeOrmModule.forFeature([Permission]), ConfigModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionCasdoorService],
  exports: [PermissionsService, PermissionCasdoorService],
})
export class PermissionsModule { }
