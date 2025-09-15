import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { ConfigService } from '../config/config.service';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [SessionModule],
  controllers: [PermissionsController],
  providers: [ConfigService, PermissionsService],
})
export class PermissionsModule {}
