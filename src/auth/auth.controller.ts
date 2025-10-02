import {
  Controller,
  Post,
  Body,
  Req,
  UsePipes,
  Session,
  Get,
  UseInterceptors,
  HttpCode,
  BadRequestException,
  InternalServerErrorException,
  Res,
  Inject,
  UseGuards,
} from '@nestjs/common';

import { JoiValidationPipe } from 'src/pipes/password-grant/password-grant.pipe';
import { UserPasswordSchema } from 'src/pipes/validation-schemas/userpassword';
import { ApiTags, ApiBody, ApiResponse, ApiOkResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Session as ExpressSession, SessionData } from 'express-session';
import { EncryptionResponseInterceptor } from 'src/encryption-response/encryption-response.interceptor';
import * as session from 'express-session';
import { AUTH_SERVICE_TOKEN, IAuthenticationService } from './auth.interface';
import { LoginThrottleGuard } from './login-throttle.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthSuccessDto } from './services/dtos/auth-success.dto';

interface CustomSession extends ExpressSession {
  accessToken?: string;
  user?: any;
  permissions?: string[];
}

interface RequestWithSession extends Request {
  session: ExpressSession & Partial<SessionData>;
}

@UseInterceptors(EncryptionResponseInterceptor)
@Controller('authenticate')
export class AuthenticateController {
  constructor(
    @Inject(AUTH_SERVICE_TOKEN)
    private readonly authenticateService: IAuthenticationService,
  ) {}
  @ApiTags('Autenticación')
  @UsePipes(new JoiValidationPipe(UserPasswordSchema))
  @UseGuards(ThrottlerGuard)
  @ApiBody({ schema: { example: { user: 'usuario', password: 'contraseña' } } })
  @ApiOkResponse({ description: 'Authentication successful' })
  @Post()
  @HttpCode(200)

  //@Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } }) //Límite: 5 intentos por IP cada 15 minutos
  async login(
    @Session() session: Record<string, any>,
    @Body() body: { user: string; password: string },
    @Req() req: Request,
  ): Promise<AuthSuccessDto> {
    const { user, password } = body;
    const result = await this.authenticateService.login(user, password, req.ip);
    //    session.username = user;
    session.permissions = result?.user?.permissions;
    session.token = result?.token;

    return {
      success: true,
      message: 'Authentication successful',
      permissions: result?.user?.permissions,
    };
  }
  @ApiTags('Desautenticación')
  @ApiResponse({ status: 200, description: 'Logout exitoso' })
  @HttpCode(200)
  @Post('logout')
  async logout(
    @Req() req: RequestWithSession,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    if (!req.session) {
      throw new BadRequestException('No active session found');
    }
    try {
      await this.authenticateService.logout(req.sessionID);
    } catch (error) {
      throw new InternalServerErrorException('Logout Failed', error);
    }
    await new Promise<void>((resolve, reject) => {
      req.session.destroy?.((err) => {
        if (err)
          return reject(new InternalServerErrorException('Logout failed'));

        res.clearCookie('apigateway_sid');
        resolve();
      });
    });

    return {
      success: true,
      message: 'Logout successful',
    };
  }
  @Get('test')
  shortTtl(@Body('sessionId') sessionId: string) {
    //this.authenticateService.test_short(sessionId);
  }
  @Post('refresh')
  refresh(@Session() session: session.Session) {
    this.authenticateService.refresh(session.id);
  }
}
