import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticateModule } from '../auth/auth.module';
import { EncryptionsModule } from '../encryptions/encryptions.module';
import { RolesModule } from '../roles/roles.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { ProxyModule } from '../proxy/proxy.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';
import { StructuresModule } from '../structures/structures.module';
import { ConfigService } from '../config/config.service';
import { ConfigController } from '../config/config.controller';
import { ConfigModule } from '../config/config.module';
import { CacheModule } from '@nestjs/cache-manager';
import { SessionService } from '../session/session.service';
import { EntitiesModule } from '../entities/entities.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Structure } from '../entities/structure.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { CommonModule } from '../common/common.module';

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
    CommonModule,
    ConfigModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'dev.sqlite',
      entities: [User, Structure, Role, Permission],
      synchronize: true,
      logging: false,
    }),
    EntitiesModule,
    SessionModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [SessionModule],
      useFactory: (ss: SessionService) => {
        return {
          stores: [ss.getStore()],
        };
      },
      inject: [SessionService],
    }),

    AuthenticateModule,
    EncryptionsModule,
    RolesModule,
    PermissionsModule,
    ProxyModule,
    UsersModule,
    StructuresModule,

  ],
  controllers: [AppController, ConfigController],
  providers: [AppService, ConfigService],//FIXME Ver si ConfigService sobra aquí
})
export class AppModule { }
