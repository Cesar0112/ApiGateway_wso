import { forwardRef, Module } from '@nestjs/common';
import { AuthenticateController } from './auth.controller';
import { EncryptionsService } from '../encryptions/encryptions.service';
import { PermissionsService } from '../permissions/permissions.service';
import { SessionModule } from '../session/session.module';
import { ConfigService } from '../config/config.service';
import { AUTH_SERVICE_TOKEN, AUTH_TYPE_TOKEN } from './auth.interface';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '../config/config.module';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { Permission } from '../permissions/entities/permission.entity';
import { FactoryAuthProvider } from './providers/auth.service';
import { authTypeValueProvider } from './providers/auth.type.provider';

@Module({
  imports: [
    SessionModule,
    forwardRef(() => UsersModule),
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
    authTypeValueProvider,
    FactoryAuthProvider
  ],
  exports: [AUTH_SERVICE_TOKEN, AUTH_TYPE_TOKEN],
  controllers: [AuthenticateController],
})
export class AuthenticateModule { }
