import { Test, TestingModule } from '@nestjs/testing';

import { AuthWSO2Service } from './auth_wso2.service';
import { EncryptionsService } from '../../encryptions/encryptions.service';
import { ConfigService } from '../../config/config.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { SessionModule } from '../../session/session.module';
import { AuthenticateController } from '../auth.controller';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { SessionService } from '../../session/session.service';
import { ThrottlerModule } from '@nestjs/throttler';
describe('AuthService', () => {
  let service: AuthWSO2Service;
  let encryptionService: EncryptionsService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SessionModule,
        CacheModule.register(),
        ThrottlerModule.forRoot(),
      ],
      providers: [
        ConfigService,
        AuthWSO2Service,
        EncryptionsService,
        {
          provide: PermissionsService,
          useValue: {
            getPermissionsFromRoles: jest.fn().mockResolvedValue([
              {
                permissions: [
                  { value: 'read:users' },
                  { value: 'write:users' },
                ],
              },
            ]),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            reset: jest.fn(),
          },
        },
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
