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
import { ConfigModule } from '../config/config.module';
import { AuthLocalService } from './services/auth_local.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';

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
        UsersService,
        JwtService,
      ],
      useFactory(
        cfg: ConfigService,
        enc: EncryptionsService,
        per: PermissionsService,
        sess: SessionService,
        cache: Cache,
        users: UsersService,
        jwt: JwtService,
      ) {
        const AUTH_TYPE = cfg.getConfig().API_GATEWAY?.AUTH_TYPE;
        const BASE_CONFIG = [cfg, enc, per, sess, cache] as const;
        switch (AUTH_TYPE) {
          case 'wso2':
            return new AuthWSO2Service(...BASE_CONFIG);
          case 'local':
            return new AuthLocalService(...BASE_CONFIG, users, jwt);
          default:
            return new AuthWSO2Service(...BASE_CONFIG);
        }
      },
    },
  ],
  controllers: [AuthenticateController],
})
export class AuthenticateModule {}
