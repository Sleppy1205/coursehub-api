import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../users/user-role.enum.js';
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
        role: UserRole.TEACHER,
      }),
    ).toEqual({
      id: 17,
      email: 'ana@example.com',
      role: UserRole.TEACHER,
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
        role: UserRole.STUDENT,
      }),
    ).toThrow(UnauthorizedException);
  });

  it('rejects unknown roles in a signed token', () => {
    const configService = {
      getOrThrow: vi.fn().mockReturnValue('a-test-secret-long-enough-for-jwt'),
    };
    const strategy = new JwtStrategy(configService as unknown as ConfigService);

    expect(() =>
      strategy.validate({
        sub: 17,
        email: 'ana@example.com',
        role: 'owner' as UserRole,
      }),
    ).toThrow(UnauthorizedException);
  });
});
