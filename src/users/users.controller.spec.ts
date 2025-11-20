import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users/users.controller';
import { UsersWSO2Service } from './providers/wso2/users_wso2.service';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersWSO2Service],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
