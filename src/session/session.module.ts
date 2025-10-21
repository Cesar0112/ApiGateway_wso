import { MiddlewareConsumer, Module } from '@nestjs/common';
import { SessionConfig } from './session.config';
import { SessionMiddleware } from './session.middleware';
import { ConfigModule } from '../config/config.module';
import { SessionService } from './session.service';
import { ConfigService } from '../config/config.service';
import { SessionGateway } from './session.gateway';
import { SessionTimerService } from './session-timer.service';
import { SessionController } from './session.controller';
import { EncryptionsService } from '../encryptions/encryptions.service';

@Module({
  imports: [ConfigModule],
  providers: [
    SessionConfig,
    SessionMiddleware,
    SessionService,
    ConfigService,
    SessionTimerService,
    SessionGateway,
    EncryptionsService
  ],
  exports: [SessionService, SessionTimerService],
  controllers: [SessionController],
})
export class SessionModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('*');
  }
}
