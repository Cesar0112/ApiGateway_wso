// src/proxy/proxy-config.service.ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { RoutesConfig } from '../config/config';
import { ConfigService } from '../config/config.service';

@Injectable()
export class ProxyConfigService implements OnModuleInit {
  private readonly _key = 'proxy:routes';
  private readonly _filePath = 'routes.json';

  constructor(
    private readonly _cfg: ConfigService,
    @Inject(CACHE_MANAGER) private _cacheManager: Cache,
  ) {}

  async onModuleInit() {
    const EXISTS = (await this._cacheManager.get(this._key)) !== undefined;
    if (EXISTS) return; // Ya está en el SessionStore

    const map: RoutesConfig = this._cfg.getRoutes();

    await this._cacheManager.set(this._key, JSON.stringify(map));
  }

  async getMap(): Promise<{ [key: string]: string[] }> {
    const RAW = await this._cacheManager.get<string>(this._key);
    return RAW ? (JSON.parse(RAW) as { [key: string]: string[] }) : {};
  }

  async setMap(map: Record<string, string[]>) {
    await this._cacheManager.set(this._key, JSON.stringify(map), 0);
  }
}
