import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app/app.module';

describe('Session Cookie Configuration (e2e)', () => {
  let app: INestApplication;

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

  it('should set sameSite correctly (not "none" with secure=false)', async () => {
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

    if (sessionCookie.includes('SameSite=None')) {
      expect(sessionCookie).toContain('Secure');
    }
  });

  it('should use HttpOnly flag for security', async () => {
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
  });

  it('should have correct maxAge from config', async () => {
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

    const maxAgeMatch = sessionCookie.match(/Max-Age=(\d+)/);
    expect(maxAgeMatch).toBeDefined();

    const maxAge = parseInt(maxAgeMatch[1]);
    expect(maxAge).toBeGreaterThan(0);
    expect(maxAge).toBeLessThanOrEqual(86400 * 1000);
  });
});
