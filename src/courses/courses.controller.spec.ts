import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { UserRole } from '../users/user-role.enum.js';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { UpdateCourseUseCase } from './application/update-course.use-case.js';

describe('CoursesController', () => {
  let controller: CoursesController;
  const coursesService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
  };
  const updateCourseUseCase = {
    execute: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: CoursesService, useValue: coursesService },
        { provide: UpdateCourseUseCase, useValue: updateCourseUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: vi.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: vi.fn(() => true) })
      .compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates an update with its ID, unchanged DTO and authenticated user', async () => {
    const actor: AuthenticatedUser = {
      id: 4,
      email: 'teacher@example.test',
      role: UserRole.TEACHER,
    };
    const dto = { title: 'NestJS avanzado' };
    const expected = { id: 7, ...dto };
    const request = { user: actor } as Request & {
      user: AuthenticatedUser;
    };
    updateCourseUseCase.execute.mockResolvedValue(expected);

    await expect(controller.update(7, dto, request)).resolves.toEqual(expected);
    expect(updateCourseUseCase.execute).toHaveBeenCalledWith(7, dto, actor);
  });

  it('propagates an update use-case error without returning a success value', async () => {
    const actor: AuthenticatedUser = {
      id: 4,
      email: 'teacher@example.test',
      role: UserRole.TEACHER,
    };
    const dto = { title: 'NestJS avanzado' };
    const request = { user: actor } as Request & {
      user: AuthenticatedUser;
    };
    const error = new Error('Course update failed');
    updateCourseUseCase.execute.mockRejectedValue(error);

    await expect(controller.update(7, dto, request)).rejects.toBe(error);
    expect(updateCourseUseCase.execute).toHaveBeenCalledWith(7, dto, actor);
  });
});
