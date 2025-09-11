// failed-only-throttle.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthWSO2Service } from './services/auth_wso2.service';
import { Request } from 'express';

@Injectable()
export class LoginThrottleGuard implements CanActivate {
  protected readonly skipSuccessfulRequests = true;
  constructor(private readonly authService: AuthWSO2Service) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const username: string = req.body?.user as string;
    const ip: string = req.ip as string;

    if (!username) return true; // dejamos pasar si no hay username

    if (await this.authService.isBlocked(username, ip)) {
      throw new HttpException(
        'Demasiados intentos de autenticación. Intenta más tarde o restablece tus credenciales.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
