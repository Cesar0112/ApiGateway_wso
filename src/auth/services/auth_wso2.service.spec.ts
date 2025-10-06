import { Test, TestingModule } from '@nestjs/testing';

import { AuthWSO2Service } from './auth_wso2.service';
import { EncryptionsService } from '../../encryptions/encryptions.service';
import { ConfigService } from '../../config/config.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { SessionModule } from '../../session/session.module';
import { AuthenticateController } from '../auth.controller';

describe('AuthService', () => {
  let service: AuthWSO2Service;
  let encryptionService: EncryptionsService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SessionModule],
      providers: [
        ConfigService,
        AuthWSO2Service,
        EncryptionsService,
        PermissionsService,
      ],
      controllers: [AuthenticateController],
    }).compile();

    service = module.get<AuthWSO2Service>(AuthWSO2Service);
    encryptionService = module.get<EncryptionsService>(EncryptionsService);
  });

  it('Debe retornar el token', async () => {
    const rawPassword = 'W7$"M^@\'ACM}hC;';
    const encryptedPassword = encryptionService.encrypt(rawPassword); //
    console.log(encryptedPassword);
    expect(await service.login('superadmin', encryptedPassword)).toEqual(
      expect.objectContaining({
        success: true,
        token: expect.objectContaining({
          roles: 'superadmin',
        }),
        user: expect.objectContaining({
          username: 'superadmin',
          roles: 'superadmin',
        }),
        message: 'Autenticación exitosa',
      } as Partial<ReturnType<typeof service.login>>),
    );
  });
});
