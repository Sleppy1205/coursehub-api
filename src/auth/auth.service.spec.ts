import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmail: vi.fn(),
    create: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('hashes the password and stores a normalized email', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      id: 1,
      email: 'ana@example.com',
      createdAt: new Date('2026-10-19T12:00:00.000Z'),
    });

    const result = await service.register({
      email: ' Ana@Example.com ',
      password: 'superSecret123',
    });

    expect(usersService.findByEmail).toHaveBeenCalledWith('ana@example.com');
    expect(usersService.create).toHaveBeenCalledWith({
      email: 'ana@example.com',
      passwordHash: expect.any(String),
    });
    const createdPayload = usersService.create.mock.calls[0][0];
    expect(await bcrypt.compare('superSecret123', createdPayload.passwordHash)).toBe(true);
    expect(result).toEqual({
      id: 1,
      email: 'ana@example.com',
      createdAt: new Date('2026-10-19T12:00:00.000Z'),
    });
  });

  it('rejects a duplicate email', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 2, email: 'ana@example.com' });

    await expect(
      service.register({ email: 'ana@example.com', password: 'superSecret123' }),
    ).rejects.toThrow(ConflictException);
    await expect(
      service.register({ email: 'ana@example.com', password: 'superSecret123' }),
    ).rejects.toThrow('El correo electrónico ya está registrado');
  });
});
