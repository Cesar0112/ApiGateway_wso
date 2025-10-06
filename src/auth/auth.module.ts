import { Module } from '@nestjs/common';
import { AuthWSO2Service } from './services/auth_wso2.service';
import { AuthenticateController } from './auth.controller';
import { EncryptionsService } from '../encryptions/encryptions.service';
import { PermissionsService } from '../permissions/permissions.service';
import { SessionModule } from '../session/session.module';
import { ConfigService } from '../config/config.service';
import { AUTH_SERVICE_TOKEN } from './auth.interface';
import { SessionService } from '../session/session.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '../config/config.module';
import { AuthLocalService } from './services/auth_local.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersWSO2Service } from '../users/services/users_wso2.service';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../permissions/entities/permission.entity';

@Module({
  imports: [
    SessionModule,
    UsersModule,
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getConfig().API_GATEWAY?.SESSION_SECRET,
        signOptions: { expiresIn: cfg.getConfig().SESSION?.TTL_SECONDS },
      }),
    }),
    TypeOrmModule.forFeature([Permission]),
  ],
  providers: [
    ConfigService,
    EncryptionsService,
    PermissionsService,
    AuthWSO2Service,
    {
      provide: AUTH_SERVICE_TOKEN,
      inject: [
        ConfigService,
        EncryptionsService,
        PermissionsService,
        SessionService,
        CACHE_MANAGER,
        UsersWSO2Service,
        JwtService,
      ],
      useFactory(
        cfg: ConfigService,
        enc: EncryptionsService,
        per: PermissionsService,
        sess: SessionService,
        cache: Cache,
        users: UsersWSO2Service,
        jwt: JwtService,
      ) {
        const AUTH_TYPE = cfg.getConfig().API_GATEWAY?.AUTH_TYPE;
        const BASE_CONFIG = [cfg, enc, per, sess, cache] as const;
        switch (AUTH_TYPE) {
          case 'wso2':
            return new AuthWSO2Service(...BASE_CONFIG);
          /*case 'local':
            return new AuthLocalService(...BASE_CONFIG, users, jwt);*/
          default:
            return new AuthWSO2Service(...BASE_CONFIG);
        }
      },
    },
  ],
  exports: [AUTH_SERVICE_TOKEN],
  controllers: [AuthenticateController],
})
export class AuthenticateModule {}
