import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ISessionTimers } from '../auth/auth.interface';
import { SessionService } from '../session/session.service';
import { Socket } from 'socket.io';
//import { SessionData } from '../session/interfaces/session.interface';

import { ISessionData } from '../session/interfaces/session.interface';
@Injectable()
export class SessionTimerService implements OnModuleDestroy {
  private timers = new Map<string, ISessionTimers>();
  private sockets = new Map<string, Socket>();

  constructor(private readonly sessionService: SessionService) {}

  /* al conectar */
  registerSocket(sessionId: string, socket: Socket) {
    this.sockets.set(sessionId, socket);
  }
  /* al desconectar */
  unregisterSocket(sessionId: string) {
    this.sockets.delete(sessionId);
  }
  async start(sessionId: string) {
    this.stop(sessionId); // por si ya existía
    const socket = this.sockets.get(sessionId);
    if (!socket) return; // no conectado → no hacemos nada
    const session: ISessionData = (await this.sessionService.getSession(
      sessionId,
    )) as ISessionData;
    if (!session) return;

    const expiresVal = session.cookie?.expires;
    if (expiresVal == null) return; // sin información de expiración
    const expires = new Date(expiresVal).getTime();
    const now = Date.now();
    const ttl = expires - now;

    if (ttl <= 0) return; // ya expiró

    const timers: ISessionTimers = {};

    // 1) Advertencia a 1 min antes
    const warningMs = Math.max(ttl - 60_000, 0);
    timers.warningTimer = setTimeout(() => {
      socket.emit('session:warning', { remainingMs: 60_000 });
    }, warningMs);

    // 2) Logout automático al expirar
    timers.logoutTimer = setTimeout(() => {
      // delete session and then emit logout; ignore returned promise so the callback returns void
      this.sessionService
        .deleteSession(sessionId)
        .catch(() => {
          // ignore delete errors
        })
        .finally(() => {
          socket.emit('session:logout'); // o socket.disconnect()
          socket.disconnect();
        });
    }, ttl);

    this.timers.set(sessionId, timers);
  }
  /** Cancela ambos timers al desloguear / desconectar */
  stop(sessionId: string) {
    const t = this.timers.get(sessionId);
    if (t) {
      clearTimeout(t.warningTimer);
      clearTimeout(t.logoutTimer);
      this.timers.delete(sessionId);
    }
  }
  /** Limpieza al cerrar el servicio */
  onModuleDestroy() {
    this.timers.forEach((_, sid) => this.stop(sid));
  }
}
