import { Test, TestingModule } from '@nestjs/testing';
import { StructuresController } from './structures.controller';
import { StructuresService } from './providers/structures.service_bulk';

describe('StructuresController', () => {
  let controller: StructuresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StructuresController],
      providers: [StructuresService],
    }).compile();

    controller = module.get<StructuresController>(StructuresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
