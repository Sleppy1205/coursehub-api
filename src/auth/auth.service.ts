import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtPayload } from './types/jwt-payload.type.js';

function isPostgresUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('driverError' in error)) {
    return false;
  }

  const { driverError } = error;
  return (
    typeof driverError === 'object' &&
    driverError !== null &&
    'code' in driverError &&
    driverError.code === '23505'
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const normalizedEmail = registerDto.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);
    let user: User;
    try {
      user = await this.usersService.create({
        email: normalizedEmail,
        passwordHash,
      });
    } catch (error) {
      if (isPostgresUniqueViolation(error)) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      throw error;
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email.trim().toLowerCase(),
    );
    const passwordMatches = user
      ? await bcrypt.compare(loginDto.password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }
}
