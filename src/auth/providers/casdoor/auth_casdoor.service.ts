// ../auth/auth.service.ts
import {
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';

import {
    BaseAuthenticationService,
    IDecodedToken,
    LoginResponse,
} from '../../auth.interface';
import * as https from 'node:https';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '../../../config/config.service';
import { SessionService } from '../../../session/session.service';
import { EncryptionsService } from 'src/encryptions/encryptions.service';
import { UsersCasdoorService } from 'src/users/providers/casdoor/users_casdoor.service';


@Injectable()
export class AuthCasdoorService extends BaseAuthenticationService {
    toString(): string {
        return 'casdoor';
    }
    private readonly logger = new Logger(AuthCasdoorService.name);
    constructor(
        protected readonly configService: ConfigService,
        protected readonly sessionService: SessionService,
        readonly encryptionsService: EncryptionsService,
        readonly usersService: UsersCasdoorService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
    ) {
        super();
    }
    async refresh(sessionId: string): Promise<boolean> {
        const session = await this.sessionService.getSession(sessionId);
        if (!session) {
            throw new UnauthorizedException();
        }
        return await this.sessionService.refresh(sessionId, session);
    }

    async login(username: string, password: string, ip?: string): Promise<LoginResponse> {
        try {
            let loginResponse: any;
            const cfg = this.configService.getConfig().CASDOOR;
            let data = JSON.stringify({
                "grant_type": "password",
                "client_id": cfg.CLIENT_ID,
                "client_secret": cfg.CLIENT_SECRET,
                "username": username,
                "password": this.encryptionsService.decrypt(password)
            });
            let config = {
                method: 'post',
                proxy: false as const, //TODO Arreglar para entornos que viaje la petición a traves del proxy
                maxBodyLength: Infinity,
                url: `${cfg.ENDPOINT}/api/login/oauth/access_token`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized:
                        this.configService.getConfig().NODE_ENV === 'production',
                }), //TODO remove this in production
                data: data
            };
            const response = await axios.request(config);

            const { access_token/*, refresh_token, scope, token_type, expires_in,
                id_token*/ } = response.data;
            const decodedToken: IDecodedToken = this.decodeJwt(access_token) as IDecodedToken;
            loginResponse = {
                token: access_token,
                decodedToken,
                success: true,
                source: 'casdoor',
                message: 'Autenticación exitosa',
                user: await this.usersService.getUserById(decodedToken.id, access_token),
            };
            return loginResponse;
        } catch (err) {
            this.logger.warn(`Login fallido: ${username}, Error: ${err.response?.data || err.message}`);
            throw new UnauthorizedException('Credenciales inválidas');
        }
    }
    async logout(sessionId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    private decodeJwt(token: string): any {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error('JWT inválido');
            const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
            return JSON.parse(payload);
        } catch (error) {
            this.logger.error(`Error decodificando JWT: ${error.message}`);
            throw new UnauthorizedException('Token inválido');
        }
    }
}
