import { Module } from '@nestjs/common';
import { StructuresService } from './structures.service';
import { StructuresController } from './structures.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Structure } from './entities/structure.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Structure])],
  controllers: [StructuresController],
  providers: [StructuresService],
})
export class StructuresModule {}
