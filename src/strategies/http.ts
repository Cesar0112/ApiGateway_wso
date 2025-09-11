import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as https from 'https';
import { ClientStrategy } from './client-strategy';
import { ConfigService } from '../config/config.service';

interface RequestOptions {
  path: string;
  method: string;
  body?: any;
  withToken?: boolean;
}

export class HttpClientStrategy implements ClientStrategy {
  private http: AxiosInstance;
  constructor(private readonly cfg: ConfigService) {
    this.cfg = cfg;
    this.http = axios.create({
      proxy: false,
      httpsAgent: new https.Agent({
        rejectUnauthorized: this.cfg.getConfig().NODE_ENV === 'production',
      }),
    });
  }
  async sendRequest(
    path: string,
    method: string,
    body?: Record<string, any>,
    withToken: boolean = true,
  ): Promise<AxiosResponse> {
    // 1. Normalizar entrada
    const safePath = String(path ?? '').trim();
    const safeBody = body ?? {};

    // 3. Ensamblar URL
    const apiUrl = this.cfg.getConfig().API_GATEWAY?.API_URL;
    const url = `${apiUrl}${safePath}`.trim();
    // 4. Validar URL
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }

    // 5. Limpiar body de caracteres de control
    const sanitizedBody = JSON.stringify(safeBody).replace(
      /[\x00-\x1F\x7F]/g,
      '',
    );

    // 6. Headers dinámicos
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // TODO: añadir token cuando `withToken` sea true
    // if (withToken) headers['Authorization'] = `Bearer ${token}`;

    // 7. Petición
    const response: AxiosResponse = await this.http({
      url,
      method: method.toLowerCase(),
      headers,
      data: sanitizedBody,
    });

    return response;
  }
}
