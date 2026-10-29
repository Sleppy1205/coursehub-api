import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  it('maps the signed payload to a safe authenticated identity', () => {
    const configService = {
      getOrThrow: vi.fn().mockReturnValue('a-test-secret-long-enough-for-jwt'),
    };
    const strategy = new JwtStrategy(configService as unknown as ConfigService);

    expect(
      strategy.validate({
        sub: 17,
        email: 'ana@example.com',
      }),
    ).toEqual({
      id: 17,
      email: 'ana@example.com',
    });
  });

  it('rejects malformed identity claims', () => {
    const configService = {
      getOrThrow: vi.fn().mockReturnValue('a-test-secret-long-enough-for-jwt'),
    };
    const strategy = new JwtStrategy(configService as unknown as ConfigService);

    expect(() =>
      strategy.validate({
        sub: 0,
        email: 'ana@example.com',
      }),
    ).toThrow(UnauthorizedException);
  });
});
