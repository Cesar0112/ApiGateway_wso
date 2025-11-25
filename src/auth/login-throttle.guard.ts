// failed-only-throttle.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { AUTH_SERVICE_TOKEN, BaseAuthenticationService } from './auth.interface';

@Injectable()
export class LoginThrottleGuard implements CanActivate {
  protected readonly skipSuccessfulRequests = true;
  constructor(@Inject(AUTH_SERVICE_TOKEN) private readonly authService: BaseAuthenticationService) { }
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
