import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersWSO2Service } from './services/wso2/users_wso2.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Structure } from '../structures/entities/structure.entity';
import { Role } from '../roles/entities/role.entity';
import { AuthenticateModule } from '../auth/auth.module';
import { ConfigModule } from '../config/config.module';
import { RolesModule } from '../roles/roles.module';
import { EncryptionsModule } from '../encryptions/encryptions.module';
import { StructuresModule } from '../structures/structures.module';
import { UsersCasdoorService } from './services/casdoor/users_casdoor.service';
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Role, Structure]),
    forwardRef(() => AuthenticateModule),
    forwardRef(() => RolesModule),
    EncryptionsModule,
    forwardRef(() => StructuresModule),
  ],
  controllers: [UsersController],
  providers: [UsersCasdoorService, UsersWSO2Service],
  exports: [UsersCasdoorService, UsersWSO2Service],
})
export class UsersModule { }
