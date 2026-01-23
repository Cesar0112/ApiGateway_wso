import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app/app.module';

describe('Session Persistence (e2e)', () => {
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

  describe('Login and Session Persistence', () => {
    it('should create a session on successful login and return sessionId cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/apigateway/authenticate')
        .send({
          user: 'testuser',
          password: 'testpassword',
        })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);

      const sessionCookieHeader = cookies.find(
        (cookie) =>
          cookie.startsWith('sid=') || cookie.startsWith('apigateway_sid='),
      );

      expect(sessionCookieHeader).toBeDefined();

      sessionCookie = sessionCookieHeader;

      const match =
        sessionCookie.match(/sid=([^;]+)/) ||
        sessionCookie.match(/apigateway_sid=([^;]+)/);
      expect(match).toBeDefined();
      sessionId = match[1];

      console.log('Session ID from login:', sessionId);
    });

    it('should maintain the same sessionId on subsequent requests with cookie', async () => {
      expect(sessionCookie).toBeDefined();
      expect(sessionId).toBeDefined();

      const response = await request(app.getHttpServer())
        .get('/apigateway/authenticate/test')
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

          console.log('Session ID from request:', newSessionId);
          console.log('Original Session ID:', sessionId);

          expect(newSessionId).toBe(sessionId);
        }
      }
    });

    it('should work with authenticated endpoint using same session', async () => {
      expect(sessionCookie).toBeDefined();

      const response = await request(app.getHttpServer())
        .get('/apigateway/structures')
        .set('Cookie', sessionCookie)
        .expect(200);

      console.log('Structures response status:', response.status);
    });

    it('should fail without session cookie', async () => {
      const response = await request(app.getHttpServer())
        .get('/apigateway/structures')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should fail with invalid session cookie', async () => {
      const invalidCookie = 'sid=invalid_session_id_12345';

      const response = await request(app.getHttpServer())
        .get('/apigateway/structures')
        .set('Cookie', invalidCookie)
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should maintain session across multiple requests', async () => {
      expect(sessionCookie).toBeDefined();

      const requestCount = 3;
      for (let i = 0; i < requestCount; i++) {
        const response = await request(app.getHttpServer())
          .get('/apigateway/authenticate/test')
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

            console.log(`Request ${i + 1} Session ID:`, newSessionId);
            expect(newSessionId).toBe(sessionId);
          }
        }
      }
    });
  });

  describe('Session Cookie Configuration', () => {
    it('should return cookie with correct attributes', async () => {
      const response = await request(app.getHttpServer())
        .post('/apigateway/authenticate')
        .send({
          user: 'testuser',
          password: 'testpassword',
        })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      const sessionCookie = cookies.find(
        (cookie) =>
          cookie.startsWith('sid=') || cookie.startsWith('apigateway_sid='),
      );

      expect(sessionCookie).toBeDefined();

      expect(sessionCookie).toContain('HttpOnly');
      expect(sessionCookie).toContain('Path=/');
    });
  });
});
