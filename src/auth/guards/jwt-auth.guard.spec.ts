import {
  Controller,
  Get,
  INestApplication,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import request from 'supertest';
import type { App } from 'supertest/types';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { JwtStrategy } from '../strategies/jwt.strategy.js';
import { AuthenticatedUser } from '../types/jwt-payload.type.js';

const jwtSecret = 'test-secret-with-more-than-thirty-two-characters';

@Controller('protected')
class ProtectedTestController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request & { user: AuthenticatedUser }) {
    return req.user;
  }
}

describe('JwtAuthGuard', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: jwtSecret,
          signOptions: { algorithm: 'HS256', expiresIn: '15m' },
        }),
      ],
      controllers: [ProtectedTestController],
      providers: [
        JwtAuthGuard,
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => jwtSecret },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    jwtService = moduleRef.get(JwtService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a request without a token', async () => {
    await request(app.getHttpServer()).get('/protected').expect(401);
  });

  it('rejects an invalid or altered token', async () => {
    const validToken = await jwtService.signAsync({
      sub: 17,
      email: 'ana@example.com',
    });
    const alteredToken = `${validToken.slice(0, -1)}${validToken.endsWith('a') ? 'b' : 'a'}`;

    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${alteredToken}`)
      .expect(401);
  });

  it('rejects an expired token', async () => {
    const expiredToken = await jwtService.signAsync(
      { sub: 17, email: 'ana@example.com' },
      { expiresIn: -1 },
    );

    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('attaches only a safe identity for a valid token', async () => {
    const token = await jwtService.signAsync({
      sub: 17,
      email: 'ana@example.com',
      passwordHash: 'must-not-be-exposed',
    });

    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ id: 17, email: 'ana@example.com' });
  });
});
