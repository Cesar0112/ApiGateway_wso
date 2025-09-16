import { Injectable } from '@nestjs/common';
import * as strategies from '../strategies';
import { Channel } from './proxy.interface';
import { AxiosResponse } from 'axios';
import { ConfigService } from '../config/config.service';

@Injectable()
export class ProxyService {
  constructor(private readonly _cfg: ConfigService) {}
  async sendRequest(
    path: string,
    method: string,
    body: any,
    channel: Channel,
  ): Promise<AxiosResponse> {
    let strategy: strategies.ClientStrategy;

    switch (channel) {
      case Channel.HTTP:
        strategy = new strategies.HttpClientStrategy(this._cfg);
        break;
      case Channel.NATS:
        strategy = new strategies.NatsClientStrategy();
        break;
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }

    return await strategy.sendRequest(path, method, body);
  }
}
