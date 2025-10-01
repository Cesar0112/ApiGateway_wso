import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersWSO2Service } from './services/users_wso2.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Structure } from '../structures/entities/structure.entity';
import { Role } from '../roles/entities/role.entity';
import { AuthenticateModule } from '../auth/auth.module';
import { ConfigModule } from '../config/config.module';
import { UsersLocalService } from './services/users_local.service';
import { RolesModule } from 'src/roles/roles.module';
import { EncryptionsModule } from 'src/encryptions/encryptions.module';


@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User, Role, Structure]), forwardRef(() => AuthenticateModule), forwardRef(() => RolesModule), EncryptionsModule],
  controllers: [UsersController],
  providers: [UsersWSO2Service, UsersLocalService],
  exports: [UsersWSO2Service],
})
export class UsersModule { }
