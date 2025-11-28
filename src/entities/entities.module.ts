import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Structure } from './structure.entity';
import { Role } from './role.entity';
import { Permission } from './permission.entity';
@Global()
@Module({
    imports: [TypeOrmModule.forFeature([User, Structure, Role, Permission])],
    exports: [TypeOrmModule],
})
export class EntitiesModule { }
