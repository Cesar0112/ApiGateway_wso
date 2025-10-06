import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../app/app.module';
import { io as ClientIO, Socket } from 'socket.io-client';

describe('ProxyGateway (e2e)', () => {
  let app: INestApplication;
  let clientSocket: Socket;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0); // Puerto aleatorio
    const address = app.getHttpServer().address();
    const url = `http://localhost:${address.port}`;

    // Conexión al gateway
    clientSocket = ClientIO(url, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
  });

  afterAll(async () => {
    clientSocket.close();
    await app.close();
  });

  it('debería conectar al gateway', (done) => {
    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });

  // Puedes agregar más tests para eventos específicos aquí
});
