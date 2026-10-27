import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { JwtPayload } from '../types/jwt-payload.type.js';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token, extra] = authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token || extra) {
      throw new UnauthorizedException('Bearer token required');
    }

    try {
      request.user = await this.jwtService.verifyAsync<JwtPayload>(token, {
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }
}
