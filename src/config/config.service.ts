// config.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Config, RoutesConfig } from './config';

@Injectable()
export class ConfigService {
  private _config: Config;
  private _routes: RoutesConfig;
  constructor() {
    this.loadConfig();
    this.loadRoutes();
    fs.watchFile(path.resolve('config.json'), () => {
      this.loadConfig();
      console.log('⚙️ Configuración recargada');
    });
    fs.watchFile(path.resolve('routes.json'), () => {
      this.loadRoutes();
      console.log('⚙️ Configuración de rutas recargada');
    });
  }
  public getConfig(): Config {
    return this._config;
  }
  public loadConfig() {
    const RAW = fs.readFileSync('config.json', 'utf8');
    this._config = JSON.parse(RAW) as Config;
  }
  public loadRoutes() {
    const RAW = fs.readFileSync('routes.json', 'utf8');
    this._routes = JSON.parse(RAW) as RoutesConfig;
  }
  get<K extends keyof Config>(key: K): Config[K] {
    return this._config[key];
  }
  getRoutes(): RoutesConfig {
    return this._routes || {};
  }
  getRoute(
    method: 'PUT' | 'POST' | 'PATCH' | 'GET' | 'DELETE',
    endpoint: string,
  ): string[] {
    return this._routes[method + endpoint] as string[];
  }
}
