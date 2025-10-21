import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as session from 'express-session';
//import { createClient } from 'redis';
import { SessionConfig } from './session.config';
import { SessionService } from './session.service';
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  private middleware: ReturnType<typeof session>;
  constructor(
    private readonly cfg: SessionConfig,
    private readonly sessionService: SessionService,
  ) {
    this.buildMiddleware();
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.middleware(req, res, next);
  }

  private buildMiddleware() {
    this.middleware = session({
      store: this.sessionService.getExpressSessionStore(),
      name: this.cfg.cookieName,
      secret: this.cfg.secret,
      resave: false,
      saveUninitialized: false,
      proxy: false as const,
      cookie: {
        httpOnly: true,
        secure: false,

        maxAge: this.cfg.ttlSeconds * 1000,
        sameSite: 'none',
      },
    });
  }
}
