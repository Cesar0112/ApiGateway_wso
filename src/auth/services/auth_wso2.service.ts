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
import {
  IWSO2TokenResponse,
  IDecodedToken,
  IAuthenticationService,
} from '../auth.interface';
import { EncryptionsService } from '../../encryptions/encryptions.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { ConfigService } from '../../config/config.service';
import { SessionService } from '../../session/session.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
@Injectable()
export class AuthWSO2Service implements IAuthenticationService {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly encryptionsService: EncryptionsService,
    protected readonly permissionsService: PermissionsService,
    protected readonly sessionService: SessionService,
    @Inject(CACHE_MANAGER) protected cacheManager: Cache,
  ) {}
  test_short(sessionId: string) {
    const store = this.sessionService.getExpressSessionStore();
    store.get(sessionId, (err, sess) => {
      if (!sess) return;
      sess.cookie.expires = new Date(Date.now() + 30_000);
      store.set(sessionId, sess);
    });
  }
  async refresh(sessionId: string): Promise<boolean> {
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException();
    }
    return await this.sessionService.refresh(sessionId, session);
  }

  async login(user: string, password: string, ip: string) {
    try {
      const URL: string =
        this.configService.get('WSO2')?.URL_TOKEN ??
        'https://localhost:9443/oauth2/token';
      const DATA = qs.stringify({
        grant_type: 'password',
        client_id: this.configService.get('WSO2')?.CLIENT_ID,
        client_secret: this.configService.get('WSO2')?.CLIENT_SECRET,
        username: user,
        password: this.encryptionsService.decrypt(password),
        scope:
          'openid groups id_structure profile roles internal_role_mgt_view',
      });
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      /*const proxyEnv =
        this.configService.get('HTTPS_PROXY') ||
        this.configService.get('https_proxy') ||
        this.configService.get('HTTP_PROXY') ||
        this.configService.get('http_proxy');

      const httpsAgent = proxyEnv
        ? new HttpsProxyAgent(proxyEnv)
        : new HttpsAgent({ rejectUnauthorized: false }); // o true en producción
*/
      const response = await axios.post<IWSO2TokenResponse>(URL, DATA, {
        proxy: false, //TODO Arreglar para entornos que viaje la petición a traves del proxy
        headers,
        httpsAgent: new https.Agent({
          rejectUnauthorized:
            this.configService.getConfig().NODE_ENV === 'production',
        }), //TODO remove this in production
      });
      const TOKEN = response.data.access_token;
      const decodedToken: IDecodedToken = jwt.jwtDecode(TOKEN);

      if (!decodedToken.roles?.length) {
        throw new UnauthorizedException('El usuario no tiene roles asignados');
      }
      if (!decodedToken.scope?.length) {
        throw new UnauthorizedException(
          'El usuario no tiene permisos asignados',
        );
      }

      if (decodedToken.roles) {
        //decodedToken.roles
        const SCOPES = await this.permissionsService.getPermissionsForRoles(
          decodedToken.roles,
          response.data.access_token,
        );

        if (!SCOPES.length) {
          throw new UnauthorizedException(
            'El usuario no tiene permisos asignados',
          );
        }

        const PERMISSIONS: string[] = [];

        for (const scope of SCOPES) {
          for (const permission of scope.permissions) {
            if (!PERMISSIONS.includes(permission.value)) {
              PERMISSIONS.push(permission.value);
            }
          }
        }

        return {
          success: true,
          decodedToken,
          token: TOKEN,
          source: 'wso2',
          user: {
            username: user,
            roles: decodedToken.roles,
            permissions: PERMISSIONS,
          },
          message: 'Autenticación exitosa',
        };
      }
    } catch {
      throw new UnauthorizedException('Credenciales inválidas');
    }
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
          TOKEN,
          client_id: this.configService.get('WSO2')?.CLIENT_ID,
          client_secret: this.configService.get('WSO2')?.CLIENT_SECRET,
        }),
        {
          proxy: false,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          httpsAgent: new https.Agent({
            rejectUnauthorized:
              this.configService.getConfig().NODE_ENV === 'production',
          }), //TODO remove this in production
          timeout: 5000, // Set a timeout of 5 seconds
        },
      );
      this.sessionService.deleteSession(sessionId);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
  /**
   * This method regist in cache how many times the "username:ip" pair
   * @param username
   * @param ip
   * @returns past value + 1
   */

  async record(username: string, ip: string): Promise<number> {
    const KEY = `login:${username}:${this._normalizeIp(ip)}`;
    const raw = await this.cacheManager.get(KEY);

    // Aseguramos que sea un número >= 0
    const PREV = typeof raw === 'number' && raw >= 0 ? raw : 0;
    const NEXT = PREV + 1;

    await this.cacheManager.set(
      KEY,
      NEXT,
      this.configService.getConfig().API_GATEWAY?.THROTTLE_TTL_MS,
    );
    return NEXT;
  }
  async isBlocked(username: string, ip: string): Promise<boolean> {
    const KEY = `login:${username}:${this._normalizeIp(ip)}`;
    const raw = await this.cacheManager.get(KEY);
    const COUNT = typeof raw === 'number' && raw >= 0 ? raw : 0;
    return (
      COUNT >= (this.configService.getConfig().API_GATEWAY?.THROTTLE_LIMIT ?? 5)
    );
  }
  private _normalizeIp(ip: string): string {
    return ip.replace(/^::ffff:/, '').replace(/:/g, '-');
  }
}
