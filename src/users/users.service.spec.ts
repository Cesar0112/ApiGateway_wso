import { Test, TestingModule } from '@nestjs/testing';
import { UsersWSO2Service } from './services/wso2/users_wso2.service';

describe('UsersService', () => {
  let service: UsersWSO2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersWSO2Service],
    }).compile();

    service = module.get<UsersWSO2Service>(UsersWSO2Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
