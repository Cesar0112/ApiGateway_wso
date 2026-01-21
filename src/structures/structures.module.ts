import { forwardRef, Module } from '@nestjs/common';
import { StructuresController } from './structures.controller';

import { ConfigModule } from '../config/config.module';
import { StructuresWSO2Service } from "./providers/wso2/structures_wso2.service";
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';
import { StructuresCasdoorService } from './providers/casdoor/structures_casdoor.service';
import { StructuresServiceProvider } from './providers/structures.service';
import { STRUCTURE_SERVICE_PROVIDER } from './interface/structure.interface';
import { AuthenticateModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '../config/config.service';
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
    forwardRef(() => AuthenticateModule)
  ],
  controllers: [StructuresController],
  providers: [StructuresServiceProvider, StructuresCasdoorService, StructuresWSO2Service],
  exports: [STRUCTURE_SERVICE_PROVIDER, StructuresCasdoorService, StructuresWSO2Service,],
})
export class StructuresModule { }
