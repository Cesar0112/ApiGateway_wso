import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { match } from 'path-to-regexp';

type PermissionsMap = Record<string, string[]>;

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly _permissionsMap: PermissionsMap;

  constructor() {
    const FILE_PATH = path.resolve(
      __dirname,
      '../permissions/permissions.json',
    );
    this._permissionsMap = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
  }

  canActivate(context: ExecutionContext): boolean {
    const REQ = context.switchToHttp().getRequest();
    const method = REQ.method.toUpperCase();
    const url = REQ.route.path;
    const user = REQ.user;
    const MATCHED_KEY = Object.keys(this._permissionsMap).find((key) => {
      const [M, P] = key.split(' ');
      if (M !== method) return false;
      return match(P, { decode: decodeURIComponent })(url) !== false;
    });

    if (!MATCHED_KEY) return true;

    const REQUIRED_PERMS = this._permissionsMap[MATCHED_KEY];
    const USER_PERMS: string[] = user?.permissions || [];

    const OK = REQUIRED_PERMS.some((p) => USER_PERMS.includes(p));
    if (!OK) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
