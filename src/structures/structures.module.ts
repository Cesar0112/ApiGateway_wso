import { Module } from '@nestjs/common';
import { StructuresService } from './services/structures.service';
import { StructuresController } from './structures.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Structure } from './entities/structure.entity';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '../config/config.service';
import { ConfigModule } from '../config/config.module';
import { StructuresWSO2Service } from './services/structures_wso2.service';
import { SessionModule } from 'src/session/session.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Structure]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory(cfg: ConfigService) {
        return {
          redis: {
            host: cfg.getConfig().REDIS.HOST ?? '127.0.0.1',
            port: cfg.getConfig().REDIS.PORT ?? 6379,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: 'structure-bulk' }),
    ConfigModule,
    SessionModule
  ],
  controllers: [StructuresController],
  providers: [StructuresService, StructuresWSO2Service],
  exports: [StructuresService, StructuresWSO2Service],
})
export class StructuresModule { }
