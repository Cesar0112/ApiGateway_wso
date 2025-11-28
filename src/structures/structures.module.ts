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
@Module({
  imports: [
    ConfigModule,
    SessionModule,
    forwardRef(() => UsersModule),
    forwardRef(() => AuthenticateModule)
  ],
  controllers: [StructuresController],
  providers: [StructuresServiceProvider, StructuresCasdoorService, StructuresWSO2Service],
  exports: [StructuresCasdoorService, StructuresWSO2Service, STRUCTURE_SERVICE_PROVIDER],
})
export class StructuresModule { }
