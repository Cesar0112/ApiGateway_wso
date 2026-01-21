// ../config/config.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import * as fs from 'node:fs';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
  constructor(private readonly _configService: ConfigService) { }
  //FIXME arreglar este servicio 
  @Get()
  getConfig() {
    return this._configService.getConfig();
  }

  @Post()
  updateConfig(@Body() config: any) {

    fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
    this._configService.loadConfig();
    return { message: 'Configuración actualizada' };
  }
  @Get('routes')
  getRoutes() {
    return this._configService.getRoutes();
  }

  @Post('routes')
  updateRoutes(@Body() routes: any) {
    fs.writeFileSync('routes.json', JSON.stringify(routes, null, 2));
    this._configService.loadRoutes();
    return { message: 'Rutas actualizadas' };
  }
}
