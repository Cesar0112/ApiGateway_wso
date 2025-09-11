// src/auth/auth.service.ts
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import * as qs from 'querystring';
import * as https from 'https';
import * as jwt from 'jwt-decode';
import { WSO2TokenResponse, DecodedToken } from '../auth.interface';
import { EncryptionsService } from '../../encryptions/encryptions.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { ConfigService } from '../../config/config.service';
import { SessionService } from '../../session/session.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuthWSO2Service } from './auth_wso2.service';
@Injectable()
export class AuthLocalService extends AuthWSO2Service {
  constructor(
    configService: ConfigService,
    encryptionsService: EncryptionsService,
    permissionsService: PermissionsService,
    sessionService: SessionService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
  ) {
    super(
      configService,
      encryptionsService,
      permissionsService,
      sessionService,
      cacheManager,
    );
  }

  async login(user: string, password: string) {
    return {
      success: true,
      decodedToken: '',
      token: '',
      source: 'wso2',
      user: {
        username: '',
        roles: '',
        permissions: '',
      },
      message: 'Autenticación exitosa',
    };
  }
  async logout(sessionId: string): Promise<void> {
    const revokeUrl =
      this.configService.getConfig().WSO2?.REVOKE_URL ||
      'https://localhost:9443/oauth2/revoke';
    try {
      const { token } = (await this.sessionService.getSession(sessionId)) ?? {};

      if (!token) {
        throw new InternalServerErrorException();
      }
      await axios.post(
        revokeUrl,
        qs.stringify({
          token,
          client_id: this.configService.get('WSO2')?.CLIENT_ID,
          client_secret: this.configService.get('WSO2')?.CLIENT_SECRET,
        }),
        {
          proxy: false, //TODO Cambiar por una lectura de las configuraciones
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          httpsAgent: new https.Agent({
            rejectUnauthorized:
              this.configService.getConfig().NODE_ENV === 'production',
          }),
          timeout: 5000, // Set a timeout of 5 seconds
        },
      );
      this.sessionService.deleteSession(sessionId);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
