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
import { IWSO2TokenResponse, IDecodedToken } from '../auth.interface';
import { EncryptionsService } from '../../encryptions/encryptions.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { ConfigService } from '../../config/config.service';
import { SessionService } from '../../session/session.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuthWSO2Service } from './auth_wso2.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/user.entity';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthLocalService extends AuthWSO2Service {
  constructor(
    configService: ConfigService,
    encryptionsService: EncryptionsService,
    permissionsService: PermissionsService,
    sessionService: SessionService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    private readonly _usersService: UsersService,
    private readonly _jwtService: JwtService,
  ) {
    super(
      configService,
      encryptionsService,
      permissionsService,
      sessionService,
      cacheManager,
    );
  }

  /**
   *
   * @param username
   * @param password Contraseña cifrada
   * @returns
   */
  override async login(username: string, password: string) {
    // 1. Buscar usuario (con roles y estructuras si quieres)
    const user = await this._usersService.findByUsername(username, {
      relations: ['roles', 'structures'],
    });
    // 2. Verificar existencia y contraseña
    if (!user || password == user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // 3. Opcional: usuario inactivo
    if (!user.isActive) {
      throw new UnauthorizedException('User is disabled');
    }
    // 4. Generar JWT (access + refresh si lo deseas)
    const tokens = await this.generateTokens(user);

    return {
      success: true,
      decodedToken: '',
      token: '',
      source: this.configService.getConfig().DATABASE?.TYPE,
      user: {
        username: user.username,
        roles: user.roles,
        permissions: user.roles.map((role) => role.permissions),
      },
      message: 'Autenticación exitosa',
    };
  }
  protected generateTokens(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles.map((r) => r.name),
    };

    return {
      accessToken: this._jwtService.sign(payload),
      refreshToken: this._jwtService.sign(payload),
    };
  }
  async logout(sessionId: string): Promise<void> {
    const REVOKE_URL =
      this.configService.getConfig().WSO2?.REVOKE_URL ||
      'https://localhost:9443/oauth2/revoke';
    try {
      const { token: TOKEN } =
        (await this.sessionService.getSession(sessionId)) ?? {};

      if (!TOKEN) {
        throw new InternalServerErrorException();
      }
      await axios.post(
        REVOKE_URL,
        qs.stringify({
          token: TOKEN,
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
