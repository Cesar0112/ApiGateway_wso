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
//import { AuthLocalService } from './services/auth_local.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersWSO2Service } from '../users/services/wso2/users_wso2.service';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { AuthCasdoorService } from './services/auth_casdoor.service';
import { authProvider } from './services/auth.service';

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
    authProvider
  ],
  exports: [AUTH_SERVICE_TOKEN],
  controllers: [AuthenticateController],
})
export class AuthenticateModule { }
