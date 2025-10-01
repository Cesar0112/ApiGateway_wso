import { Module } from '@nestjs/common';
import { EncryptionsService } from './encryptions.service';
import { EncryptionsController } from './encryptions.controller';
import { ConfigService } from '../config/config.service';
import { SessionService } from '../session/session.service';
import { SessionModule } from '../session/session.module';

@Module({
  providers: [EncryptionsService, ConfigService, SessionService],
  imports: [SessionModule],
  controllers: [EncryptionsController],
  exports: [EncryptionsService]
})
export class EncryptionsModule { }
