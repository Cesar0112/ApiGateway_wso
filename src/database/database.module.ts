import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { Structure } from '../structures/entities/structure.entity';
import { User } from '../users/entities/user.entity';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule, // para que otros módulos puedan usar getRepository
    };
  }
}
