import { Store } from 'express-session';
import * as session from 'express-session';
export interface ISessionData {
  cookie: session.Cookie;
  permissions: string[];
  token: string;
}

export interface ISessionStore {
  get(sid: string): Promise<string>;
  set(sid: string, data: string, ttlSeconds: number): Promise<void>;
  destroy(sid: string): Promise<void>;
  exist(sid: string): Promise<boolean>;
}

export class ExpressStoreAdapter extends Store {
  constructor(private readonly _store: ISessionStore) {
    super();
  }

  get = (sid: string, callback: (err?: any, session?: any) => void) => {
    this._store
      .get(sid)
      .then((data) => callback(null, data ? JSON.parse(data) : null))
      .catch(callback);
  };

  set = (sid: string, session: any, callback?: (err?: any) => void) => {
    this._store
      .set(sid, JSON.stringify(session), 60 * 60) // TTL lo gestionará tu store
      .then(() => callback?.())
      .catch(callback);
  };

  destroy = (sid: string, callback?: (err?: any) => void) => {
    this._store
      .destroy(sid)
      .then(() => callback?.())
      .catch(callback);
  };
}
