import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

describe('POST /auth/login throttle', () => {
  let app: INestApplication<App>;
  let server: App;

  async function createApplication(): Promise<INestApplication<App>> {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { login: vi.fn().mockResolvedValue({ accessToken: 'test' }) },
        },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: vi.fn(() => true) },
        },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    const application = moduleRef.createNestApplication<App>();
    await application.init();
    return application;
  }

  beforeAll(async () => {
    app = await createApplication();
    server = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows five attempts per minute and returns a generic 429 on the sixth', async () => {
    const credentials = {
      email: 'practice@example.test',
      password: 'practice-password',
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(server).post('/auth/login').send(credentials).expect(200);
    }

    const response = await request(server)
      .post('/auth/login')
      .send(credentials)
      .expect(429);

    expect(response.body).not.toHaveProperty('email');
    expect(response.body).not.toHaveProperty('password');
    expect(response.body.message).toMatch(/too many requests/i);
  });
});
