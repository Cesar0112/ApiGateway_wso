import { Module } from '@nestjs/common';
import { StructuresService } from './services/structures.service';
import { StructuresController } from './structures.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Structure } from './entities/structure.entity';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '../config/config.service';
import { ConfigModule } from '../config/config.module';
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
  ],
  controllers: [StructuresController],
  providers: [StructuresService],
})
export class StructuresModule { }
