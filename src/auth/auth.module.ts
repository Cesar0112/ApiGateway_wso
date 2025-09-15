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
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Structure } from 'src/structures/entities/structure.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
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
      useFactory: (cfg: ConfigService): TypeOrmModuleOptions => {
        const config = cfg.getConfig();
        const configDB = cfg.getConfig().DATABASE;
        const ALLOWED = [
          'sqlite',
          'postgres',
          'mysql',
          'mariadb',
          'mssql',
          'oracle',
          'cockroachdb',
        ];
        //const type: DatabaseType = (configDB?.TYPE ?? 'sqlite') as DatabaseType;
        const TYPE =
          (configDB?.TYPE as 'sqlite' | 'postgres' | 'mysql') ?? 'sqlite';

        if (!ALLOWED.includes(TYPE)) {
          throw new Error(
            `Database type "${TYPE}" is not supported by TypeORM.`,
          );
        }
        //TODO Aquí comprobar que si la configuración que quiere el usuario es de sqlite esta sea válida antes de configurar
        // SQLite no necesita host/port/user/pass
        if (TYPE === 'sqlite') {
          return {
            type: TYPE,
            database: configDB?.DATABASE_NAME,
            entities: [User, Structure, Permission, Role],
            synchronize: config.NODE_ENV !== 'production',
            logging: 'all',
          } as TypeOrmModuleOptions;
        }

        // Postgres / MySQL
        /*return {
          type,
          host: configDB?.HOST,
          port: configDB?.PORT,
          username: configDB?.USERNAME,
          password: configDB?.PASSWORD,
          database: configDB?.DATABASE_NAME,
          entities: [User, Structure, Permission, Role],
          synchronize: config.NODE_ENV !== 'production',
          logging: 'all',
          ssl: type === 'postgres' ? { rejectUnauthorized: false } : undefined,
        } as TypeOrmModuleOptions;*/
        return {
          type: TYPE,
          database: configDB?.DATABASE_NAME,
          entities: [User, Structure, Permission, Role],
          synchronize: config.NODE_ENV !== 'production',
          logging: 'all',
        } as TypeOrmModuleOptions;
      },
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
