import { Module } from '@nestjs/common';
import { AuthWSO2Service } from './services/auth_wso2.service';
import { AuthenticateController } from './auth.controller';
import { EncryptionsService } from '../encryptions/encryptions.service';
import { PermissionsService } from '../permissions/permissions.service';
import { SessionModule } from '../session/session.module';
import { ConfigService } from '../config/config.service';
import { AUTH_SERVICE_TOKEN } from './auth.interface';
import { SessionService } from 'src/session/session.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from 'src/config/config.module';
import { AuthLocalService } from './services/auth_local.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Structure } from 'src/structures/entities/structure.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import { Role } from 'src/roles/entities/role.entity';
@Module({
  imports: [
    SessionModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => [
        {
          ttl: cfg.getConfig().API_GATEWAY?.THROTTLE_TTL_MS ?? 900000,
          limit: cfg.getConfig().API_GATEWAY?.THROTTLE_LIMIT ?? 5,
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const configDB = cfg.getConfig().DATABASE;
        const type = configDB?.TYPE ?? 'sqlite';
        //TODO Aquí comprobar que si la configuración que quiere el usuario es de sqlite esta sea válida antes de configurar
        // SQLite no necesita host/port/user/pass
        if (type === 'sqlite') {
          return {
            type: 'sqlite',
            database: configDB?.DATABASE_NAME,
            entities: [User, Structure, Permission, Role],
            synchronize: cfg.getConfig().NODE_ENV !== 'production',
            logging: 'all',
          };
        }

        // Postgres / MySQL
        return {
          type: type.type,
          host: type.host,
          port: type.port,
          username: type.username,
          password: type.password,
          database: type.database,
          entities: type.entities,
          synchronize: type.synchronize,
          logging: type.logging,
          ssl:
            type.type === 'postgres'
              ? { rejectUnauthorized: false }
              : undefined,
        };
      },
    }),
  ],
  providers: [
    ConfigService,
    EncryptionsService,
    PermissionsService,
    AuthWSO2Service,
    {
      provide: AUTH_SERVICE_TOKEN,
      useFactory(cfg: ConfigService, cache: Cache) {
        const authType = cfg.getConfig().API_GATEWAY?.AUTH_TYPE;
        const encServ = new EncryptionsService(cfg);
        const perServ = new PermissionsService(cfg);
        const sessServ = new SessionService(cfg);
        switch (authType) {
          case 'wso2':
            return new AuthWSO2Service(cfg, encServ, perServ, sessServ, cache);
          case 'local':
            return new AuthLocalService(cfg, encServ, perServ, sessServ, cache);
          default:
            return new AuthWSO2Service(cfg, encServ, perServ, sessServ, cache);
        }
      },
      inject: [ConfigService, CACHE_MANAGER],
    },
  ],
  controllers: [AuthenticateController],
})
export class AuthenticateModule {}
