// ../auth/auth.service.ts
import {
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';

import {
    IAuthenticationService,
    IDecodedToken,
    LoginResponse,
} from '../auth.interface';
import * as https from 'https';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { SDK } from 'casdoor-nodejs-sdk';
import { ConfigService } from '../../config/config.service';
import { SessionService } from '../../session/session.service';
import { EncryptionsService } from 'src/encryptions/encryptions.service';
import { UsersCasdoorService } from 'src/users/services/casdoor/users_casdoor.service';
import { IUsersService, USERS_SERVICE_TOKEN } from 'src/users/services/users.interface.service';
@Injectable()
export class AuthCasdoorService implements IAuthenticationService {
    private readonly logger = new Logger(AuthCasdoorService.name);
    private sdk: SDK;
    constructor(
        protected readonly configService: ConfigService,
        protected readonly sessionService: SessionService,
        protected readonly encryptionsService: EncryptionsService,
        protected readonly usersService: UsersCasdoorService,
        //FIXME Cambiar por una carga dinamica de servicios en dependencia de la fuente de adquisicion de los datos configurada
        @Inject(CACHE_MANAGER) protected cacheManager: Cache,
    ) {
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
                user: await this.usersService.getUserById(decodedToken.id),
            };
            return loginResponse;
        } catch (err) {
            this.logger.warn(`Login fallido: ${username}`);
            throw new UnauthorizedException('Credenciales inválidas');
        }
    }
    async logout(sessionId: string): Promise<void> {

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
