import { User } from "src/users/entities/user.entity";

export interface IWSO2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  id_token_expires_in?: number;
  session_state?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}
export interface ISessionTimers {
  warningTimer?: NodeJS.Timeout;
  logoutTimer?: NodeJS.Timeout;
}
export interface IDecodedToken {
  roles?: string[] | string;
  scope?: string[] | string;
  aud?: string | string[];
  azp?: string;
  groups?: string[];
}

export interface IAuthenticationService {
  login(user: string, password: string, ip?: string): Promise<{
    success: boolean;
    decodedToken: IDecodedToken;
    token: string;
    source: string;
    user: User;
    permissions: string[],
    message: string;
  }>;
  logout(sessionId: string): Promise<void>;
  refresh(sessionId: string): Promise<boolean>;
}
export const AUTH_SERVICE_TOKEN = Symbol('AUTH_SERVICE');
