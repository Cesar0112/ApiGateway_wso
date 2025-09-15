import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

import { ConfigService } from '../config/config.service';
import { SessionModule } from '../session/session.module';

@Module({
  controllers: [RolesController],
  imports: [SessionModule],
  providers: [RolesService, ConfigService],
})
export class RolesModule {}
