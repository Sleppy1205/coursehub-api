import {
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/user-role.enum.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: vi.fn(),
  };
  let guard: RolesGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  function createContext(role?: UserRole) {
    const request = role ? { user: { id: 7, email: 'user@example.test', role } } : {};
    const handler = vi.fn();
    const controller = vi.fn();
    const context = {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    return { context: context as unknown as ExecutionContext, handler, controller };
  }

  it('allows routes without role metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const { context, handler, controller } = createContext();

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      handler,
      controller,
    ]);
  });

  it('allows a user whose role is listed by the route', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.ADMIN,
      UserRole.TEACHER,
    ]);
    const { context } = createContext(UserRole.TEACHER);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects users whose role is not allowed', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const { context } = createContext(UserRole.STUDENT);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects missing identity when a role is required', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const { context } = createContext();

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
