import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule } from 'src/config/config.module';
import { ConfigService } from 'src/config/config.service';
import { Permission } from 'src/permissions/entities/permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Structure } from 'src/structures/entities/structure.entity';
import { User } from 'src/users/user.entity';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (cfg: ConfigService): TypeOrmModuleOptions => {
            const configDB = cfg.getConfig().DATABASE;
            const NODE_ENV = cfg.getConfig().NODE_ENV;
            const ENTITIES = [User, Structure, Role, Permission];
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
            const base: TypeOrmModuleOptions = {
              type: TYPE,
              entities: ENTITIES,
              synchronize: NODE_ENV !== 'production',
              logging: configDB?.LOGGING ?? NODE_ENV !== 'production',
            };

            if (TYPE === 'sqlite') {
              return {
                ...base,
                database: configDB?.DATABASE_NAME ?? './dev.sqlite',
              } as TypeOrmModuleOptions;
            }

            return {
              ...base,
              host: configDB?.HOST,
              port: configDB?.PORT,
              username: configDB?.USERNAME,
              password: configDB?.PASSWORD,
              database: configDB?.DATABASE_NAME,
              ssl:
                TYPE === 'postgres' ? { rejectUnauthorized: false } : undefined,
            } as TypeOrmModuleOptions;
          },
        }),
      ],
      exports: [TypeOrmModule], // para que otros módulos puedan usar getRepository
    };
  }
}
