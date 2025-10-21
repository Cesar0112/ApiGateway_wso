import { Controller, Post, Session, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { Session as ExpressSession } from 'express-session';
import { SessionService } from './session.service';
import { EncryptionResponseInterceptor } from '../encryption-response/encryption-response.interceptor';

@Controller('session')
@UseInterceptors(EncryptionResponseInterceptor)
export class SessionController {
    constructor(
        private readonly sessionService: SessionService,
    ) { }
    @Post("validate")
    async validate(@Session() expressSession: ExpressSession) {
        let valid = false;
        const session = await this.sessionService.getSession(expressSession.id);
        if (session) {
            valid = true;
        }
        return { valid }
    }
}
