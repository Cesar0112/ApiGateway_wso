import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionService } from '../session/session.service';

/**
 * WARNING para acceder a los datos de session que almacena express-session no usar CACHE_MANAGER
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) { }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const sessionID = req.sessionID;
    if (!sessionID) {
      throw new UnauthorizedException('No session token found');
    }

    // Leemos la sesión desde el mismo store que usa express-session
    const session = await this.sessionService.getSession(sessionID);
    //TODO Agregar función que verifique el session_id
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Validación opcional: ¿la cookie ya expiró?
    if (this.sessionService.isExpired(session)) {
      throw new UnauthorizedException('Session has expired');
    }

    return true;
  }
}
