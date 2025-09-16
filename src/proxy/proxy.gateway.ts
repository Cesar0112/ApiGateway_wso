import { Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { io as ClientIO } from 'socket.io-client';
import { ConfigService } from '../config/config.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:8080', // Cambia por tu frontend
    credentials: true,
  },
  allowEIO3: true,
  namespace: /^\/\w+$/, // Gateway general
})
export class ProxyGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly _configService: ConfigService) {}

  handleConnection(socket: Socket) {
    const NAMESPACE = socket.nsp.name;
    // Para el namespace raíz
    console.log('Nueva conexión socket:', socket.id, 'namespace:', NAMESPACE);
    const URL = this._configService.getConfig().API_GATEWAY?.API_URL;

    const backendSocket = ClientIO(URL, {
      transports: ['polling', 'websocket', 'webtransport'],
      secure: false,
      rejectUnauthorized: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    // Redirige todos los eventos del cliente al backend
    socket.onAny((event, ...args) => {
      try {
        console.log('apigateway→backend:', event, args);
        backendSocket.emit(event, ...args);
      } catch (err) {
        console.error('Error al emitir a backend:', err);
      }
    });

    // Redirige todos los eventos del backend al cliente
    backendSocket.onAny((event, ...args) => {
      try {
        console.log('backend→apigateway:', event, args);
        socket.emit(event, ...args);
      } catch (err) {
        console.error('Error al emitir a apigateway:', err);
      }
    });
    const cleanup = () => {
      backendSocket.disconnect();
      socket.disconnect(true);
    };
    // Maneja desconexión
    socket.on('disconnect', cleanup);

    backendSocket.on('disconnect', cleanup);

    backendSocket.on('connect_error', (err) => {
      console.error('Error backend:', err);
      cleanup();
    });
  }
}
