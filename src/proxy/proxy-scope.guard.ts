// ../proxy/proxy-scope.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { ProxyConfigService } from './proxy-config.service';
import { Request } from 'express';
import { Cache } from 'cache-manager';
import { SessionService } from '../session/session.service';

@Injectable()
export class ProxyScopeGuard implements CanActivate {
  constructor(
    private readonly _proxyConfigService: ProxyConfigService,
    private readonly _sessionService: SessionService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req: Request = ctx.switchToHttp().getRequest();
    const map: any = await this._proxyConfigService.getMap();
    const KEY: string = req.method.toUpperCase() + req.path;

    const required = map[KEY] ?? [];

    if (!required.length) return true; // Público
    const sessionData = await this._sessionService.getSession(req.sessionID);

    return required.every((r) => sessionData?.permissions.includes(r));
  }
}
