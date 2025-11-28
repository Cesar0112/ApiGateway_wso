import { User } from "src/entities/user.entity";
import { ConfigService } from "../config/config.service";
import { Inject } from "@nestjs/common";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
export interface IWSO2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  id_token_expires_in?: number;
  session_state?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}
export interface ISessionTimers {
  warningTimer?: NodeJS.Timeout;
  logoutTimer?: NodeJS.Timeout;
}
export interface IDecodedToken {
  roles?: string[] | string;
  scope?: string[] | string;
  aud?: string | string[];
  azp?: string;
  groups?: string[];
  urls?: string[];
  id: string;
}

export type LoginResponse = {
  success: boolean;
  decodedToken: IDecodedToken;
  token: string;
  source: string;
  user: User;
  permissions: string[];
  message: string;
};

interface IAuthenticationService {
  login(username: string, password: string, ip?: string): Promise<LoginResponse>;
  logout(sessionId: string): Promise<void>;
  refresh(sessionId: string): Promise<boolean>;
  isBlocked(username: string, ip: string): Promise<boolean>;
  record?(username: string, ip: string): Promise<number>;
}

export abstract class BaseAuthenticationService implements IAuthenticationService {
  constructor(protected readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) protected cacheManager: Cache,) { }
  abstract login(
    username: string,
    password: string,
    ip?: string,
  ): Promise<LoginResponse>;
  abstract logout(sessionId: string): Promise<void>;
  abstract refresh(sessionId: string): Promise<boolean>;

  async isBlocked(username: string, ip: string): Promise<boolean> {
    const KEY = `login:${username}:${this._normalizeIp(ip)}`;
    const raw = await this.cacheManager.get(KEY);
    const COUNT = typeof raw === 'number' && raw >= 0 ? raw : 0;
    return (
      COUNT >= (this.configService.getConfig().API_GATEWAY?.THROTTLE_LIMIT ?? 5)
    );
  }
  protected _normalizeIp(ip: string): string {
    return ip.replace(/^::ffff:/, '').replace(/:/g, '-');
  }
}

export const AUTH_SERVICE_TOKEN = Symbol('AUTH_SERVICE');
export const AUTH_TYPE_TOKEN = Symbol('AUTH_TYPE');