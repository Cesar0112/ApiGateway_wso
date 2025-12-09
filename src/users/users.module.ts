import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersWSO2Service } from './providers/wso2/users_wso2.service';
import { AuthenticateModule } from '../auth/auth.module';
import { ConfigModule } from '../config/config.module';
import { RolesModule } from '../roles/roles.module';
import { EncryptionsModule } from '../encryptions/encryptions.module';
import { StructuresModule } from '../structures/structures.module';
import { UsersCasdoorService } from './providers/casdoor/users_casdoor.service';
import { USERS_PROVIDER_TOKEN } from './interfaces/users.interface.service';
import { UsersServiceProviders } from './providers/user.service.provider';
import { SessionModule } from '../session/session.module';
@Module({
  imports: [
    ConfigModule,
    forwardRef(() => AuthenticateModule),
    forwardRef(() => RolesModule),
    EncryptionsModule,
    forwardRef(() => StructuresModule),
    SessionModule
  ],
  controllers: [UsersController],
  providers: [UsersServiceProviders, UsersCasdoorService, UsersWSO2Service],
  exports: [UsersCasdoorService, UsersWSO2Service, USERS_PROVIDER_TOKEN],
})
export class UsersModule { }
