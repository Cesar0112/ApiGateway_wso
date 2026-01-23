import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app/app.module';

describe('Frontend-like Session Flow (e2e)', () => {
  let app: INestApplication;
  let sessionCookie: string;
  let sessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Vue2/Axios-like behavior with withCredentials', () => {
    it('should login and receive session cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/apigateway/authenticate')
        .send({
          user: 'testuser',
          password: 'testpassword',
        })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const sessionCookieHeader = cookies.find(
        (cookie) =>
          cookie.startsWith('sid=') || cookie.startsWith('apigateway_sid='),
      );

      expect(sessionCookieHeader).toBeDefined();
      sessionCookie = sessionCookieHeader;

      const match =
        sessionCookie.match(/sid=([^;]+)/) ||
        sessionCookie.match(/apigateway_sid=([^;]+)/);
      sessionId = match[1];

      console.log('[TEST] Login received sessionId:', sessionId);
    });

    it('should access protected endpoint with same session (simulating withCredentials: true)', async () => {
      expect(sessionCookie).toBeDefined();

      const response = await request(app.getHttpServer())
        .get('/apigateway/structures')
        .set('Cookie', sessionCookie)
        .expect(200);

      const cookies = response.headers['set-cookie'];

      if (cookies && cookies.length > 0) {
        const newSessionCookieHeader = cookies.find(
          (cookie) =>
            cookie.startsWith('sid=') || cookie.startsWith('apigateway_sid='),
        );

        if (newSessionCookieHeader) {
          const match =
            newSessionCookieHeader.match(/sid=([^;]+)/) ||
            newSessionCookieHeader.match(/apigateway_sid=([^;]+)/);
          const newSessionId = match ? match[1] : null;

          console.log('[TEST] Protected endpoint sessionId:', newSessionId);
          console.log('[TEST] Original sessionId:', sessionId);
          console.log('[TEST] Session IDs match:', newSessionId === sessionId);

          expect(newSessionId).toBe(sessionId);
        }
      }

      console.log('[TEST] Successfully accessed protected endpoint');
    });

    it('should fail without cookie (simulating withCredentials: false)', async () => {
      const response = await request(app.getHttpServer())
        .get('/apigateway/structures')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');

      console.log('[TEST] Correctly rejected request without cookie');
    });

    it('should maintain session across multiple API calls', async () => {
      expect(sessionCookie).toBeDefined();

      const endpoints = [
        '/apigateway/structures',
        '/apigateway/authenticate/test',
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .set('Cookie', sessionCookie);

        console.log(`[TEST] Endpoint ${endpoint} status:`, response.status);

        const cookies = response.headers['set-cookie'];

        if (cookies && cookies.length > 0) {
          const newSessionCookieHeader = cookies.find(
            (cookie) =>
              cookie.startsWith('sid=') || cookie.startsWith('apigateway_sid='),
          );

          if (newSessionCookieHeader) {
            const match =
              newSessionCookieHeader.match(/sid=([^;]+)/) ||
              newSessionCookieHeader.match(/apigateway_sid=([^;]+)/);
            const newSessionId = match ? match[1] : null;

            console.log(`[TEST] ${endpoint} sessionId:`, newSessionId);
            expect(newSessionId).toBe(sessionId);
          }
        }
      }
    });

    it('should test logout and invalidate session', async () => {
      expect(sessionCookie).toBeDefined();

      const logoutResponse = await request(app.getHttpServer())
        .post('/apigateway/authenticate/logout')
        .set('Cookie', sessionCookie)
        .expect(200);

      console.log('[TEST] Logout successful');

      const response = await request(app.getHttpServer())
        .get('/apigateway/structures')
        .set('Cookie', sessionCookie)
        .expect(401);

      console.log('[TEST] Correctly rejected request with invalidated session');
    });
  });

  describe('CORS behavior with credentials', () => {
    it('should accept requests with Origin header', async () => {
      const response = await request(app.getHttpServer())
        .post('/apigateway/authenticate')
        .set('Origin', 'http://localhost:8080')
        .send({
          user: 'testuser',
          password: 'testpassword',
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();

      console.log('[TEST] CORS with Origin header accepted');
    });

    it('should accept requests with localhost origin', async () => {
      const origins = [
        'http://localhost:8080',
        'http://localhost:3000',
        'http://127.0.0.1:8080',
      ];

      for (const origin of origins) {
        const response = await request(app.getHttpServer())
          .post('/apigateway/authenticate')
          .set('Origin', origin)
          .send({
            user: 'testuser',
            password: 'testpassword',
          });

        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(500);

        console.log(`[TEST] Origin ${origin} accepted`);
      }
    });
  });
});
