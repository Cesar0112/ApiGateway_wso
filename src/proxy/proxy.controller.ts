import {
  Controller,
  All,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { ProxyService } from './proxy.service';
import { Channel } from './proxy.interface';
import { SessionGuard } from '../guards/session.guard';
import { ProxyGateway } from './proxy.gateway';
import { AxiosResponse } from 'axios';
import { ProxyScopeGuard } from './proxy-scope.guard';
import { EncryptionResponseInterceptor } from '../encryption-response/encryption-response.interceptor';

@Controller('*path')
@UseGuards(SessionGuard)
@UseGuards(ProxyScopeGuard)
export class ProxyController {
  constructor(
    private readonly _proxyService: ProxyService,
    private readonly _gatewayService: ProxyGateway,
  ) { }

  @UseInterceptors(EncryptionResponseInterceptor)
  @All()
  @HttpCode(200)
  async handleAllHTTPRequests(@Req() req: Request): Promise<unknown> {
    //Determinar el canal dinámicamente
    const channel: Channel =
      (req.headers['x-channel'] as Channel) || Channel.HTTP;

    const response: AxiosResponse = await this._proxyService.sendRequest(
      req.path,
      req.method,
      req.body,
      channel,
    );

    return response.data;
  }
}
