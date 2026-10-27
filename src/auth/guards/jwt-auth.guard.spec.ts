import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  const jwtService = {
    verifyAsync: vi.fn(),
  };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new JwtAuthGuard(jwtService as JwtService);
  });

  function createContext(authorization?: string) {
    const request: {
      headers: { authorization: string | undefined };
      user?: { sub: number; email: string };
    } = {
      headers: { authorization },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    return { context, request };
  }

  it('rejects requests without a bearer token', async () => {
    const { context } = createContext();

    await expect(
      guard.canActivate(context as ExecutionContext),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('verifies a bearer token and attaches the payload to the request', async () => {
    const payload = { sub: 17, email: 'ana@example.com' };
    const { context, request } = createContext('Bearer valid-token');
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(
      guard.canActivate(context as ExecutionContext),
    ).resolves.toBe(true);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
      algorithms: ['HS256'],
    });
    expect(request).toHaveProperty('user', payload);
  });

  it('rejects invalid or expired tokens with a generic unauthorized response', async () => {
    const { context } = createContext('Bearer invalid-token');
    jwtService.verifyAsync.mockRejectedValue(new Error('signature invalid'));

    await expect(
      guard.canActivate(context as ExecutionContext),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Invalid or expired token',
    });
  });
});
