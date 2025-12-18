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
import { AuthServiceProvider } from './providers/auth.service';
import { authTypeValueProvider } from './providers/auth.type.provider';
import { AuthCasdoorService } from './providers/casdoor/auth_casdoor.service';
import { AuthWSO2Service } from './providers/wso2/auth_wso2.service';
import { EntitiesModule } from '../entities/entities.module';
import { HttpModule } from '@nestjs/axios';
import { PermissionsModule } from '../permissions/permissions.module';


@Module({
  imports: [
    ConfigModule,
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
    SessionModule,
    forwardRef(() => UsersModule),
    EntitiesModule,
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
    PermissionsModule
  ],
  providers: [
    EncryptionsService,
    PermissionsService,
    authTypeValueProvider,
    AuthServiceProvider,
    AuthCasdoorService,
    AuthWSO2Service,
  ],
  exports: [AUTH_TYPE_TOKEN, AUTH_SERVICE_TOKEN],
  controllers: [AuthenticateController],
})
export class AuthenticateModule { }
