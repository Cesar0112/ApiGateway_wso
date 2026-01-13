import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SessionConfig {
  readonly secret: string;
  readonly ttlSeconds: number; //Está en segundos
  readonly cookieName: string;
  readonly secure: boolean;
  readonly session: {
    host: string;
    port: number;
    password?: string;
    tls: boolean;
  };
  constructor(private readonly cfg: ConfigService) {
    this.secret =
      this.cfg.get('SESSION')?.SECRET ?? 'T9PjTVNCvvONGAof4RecIkIopwlWorpqUj';
    this.ttlSeconds = this.cfg.get('SESSION')?.TTL_SECONDS ?? 86400; //Está en segundos
    this.cookieName = this.cfg.get('SESSION')?.COOKIE_NAME ?? 'sid';
    this.secure = this.cfg.get('SESSION')?.SECURE ?? false;
    this.session = {
      host: this.cfg.get('SESSION')?.HOST ?? 'localhost',
      port: this.cfg.get('SESSION')?.PORT ?? 7000,
      tls: this.cfg.get('SESSION')?.TLS ?? false,
    };
  }
  getRedisConfig() {
    return this.session;
  }
}
