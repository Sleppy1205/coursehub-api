import { ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../users/user-role.enum.js';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type.js';
import { Course } from './entities/course.entity.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { CoursesService } from './courses.service.js';

describe('CoursesService', () => {
  let service: CoursesService;
  const coursesRepository = {
    findAndCount: vi.fn(),
    findOneBy: vi.fn(),
    create: vi.fn((value) => value),
    save: vi.fn((value) => Promise.resolve(value)),
    remove: vi.fn((value) => Promise.resolve(value)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: coursesRepository },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('returns a page with total metadata and applies the level filter', async () => {
    const items = [{ id: 1, title: 'NestJS Basics', level: 'beginner' }];
    coursesRepository.findAndCount.mockResolvedValue([items, 8]);
    const query = Object.assign(new CoursesQueryDto(), {
      level: 'beginner',
      page: 2,
      limit: 5,
      sortBy: 'title' as const,
      order: 'ASC' as const,
    });

    await expect(service.findAll(query)).resolves.toEqual({
      items,
      meta: { total: 8, page: 2, limit: 5, totalPages: 2 },
    });
    expect(coursesRepository.findAndCount).toHaveBeenCalledWith({
      where: { level: 'beginner' },
      order: { title: 'ASC', id: 'ASC' },
      skip: 5,
      take: 5,
    });
  });

  it('uses a deterministic default order and supports an unfiltered list', async () => {
    coursesRepository.findAndCount.mockResolvedValue([[], 0]);
    const query = new CoursesQueryDto();

    await expect(service.findAll(query)).resolves.toEqual({
      items: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
    expect(coursesRepository.findAndCount).toHaveBeenCalledWith({
      where: {},
      order: { id: 'ASC' },
      skip: 0,
      take: 10,
    });
  });

  it('records the authenticated teacher as course owner on creation', async () => {
    const actor: AuthenticatedUser = {
      id: 8,
      email: 'teacher@example.test',
      role: UserRole.TEACHER,
    };
    const dto = { title: 'Owned course', level: 'beginner' };

    await service.create(dto, actor);

    expect(coursesRepository.create).toHaveBeenCalledWith({
      ...dto,
      createdByUserId: actor.id,
    });
  });

  it('allows a teacher to update their own course', async () => {
    const course = {
      id: 4,
      title: 'Owned course',
      level: 'beginner',
      createdByUserId: 8,
    };
    coursesRepository.findOneBy.mockResolvedValue(course);

    await expect(
      service.update(
        4,
        { title: 'Updated course' },
        { id: 8, email: 'teacher@example.test', role: UserRole.TEACHER },
      ),
    ).resolves.toMatchObject({ title: 'Updated course' });
    expect(coursesRepository.save).toHaveBeenCalledWith(course);
  });

  it('forbids a teacher from updating another teacher’s course', async () => {
    coursesRepository.findOneBy.mockResolvedValue({
      id: 4,
      createdByUserId: 9,
    });

    await expect(
      service.update(
        4,
        { title: 'Unauthorized update' },
        { id: 8, email: 'teacher@example.test', role: UserRole.TEACHER },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(coursesRepository.save).not.toHaveBeenCalled();
  });

  it('allows an admin to update another user’s course', async () => {
    const course = { id: 4, title: 'Teacher course', createdByUserId: 9 };
    coursesRepository.findOneBy.mockResolvedValue(course);

    await expect(
      service.update(
        4,
        { title: 'Admin update' },
        { id: 1, email: 'admin@example.test', role: UserRole.ADMIN },
      ),
    ).resolves.toMatchObject({ title: 'Admin update' });
  });

  it('allows only an admin to delete a course', async () => {
    const course = { id: 4, createdByUserId: 8 };
    coursesRepository.findOneBy.mockResolvedValue(course);

    await expect(
      service.remove(
        4,
        { id: 8, email: 'teacher@example.test', role: UserRole.TEACHER },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(coursesRepository.remove).not.toHaveBeenCalled();

    await expect(
      service.remove(
        4,
        { id: 1, email: 'admin@example.test', role: UserRole.ADMIN },
      ),
    ).resolves.toBe(course);
    expect(coursesRepository.remove).toHaveBeenCalledWith(course);
  });
});
