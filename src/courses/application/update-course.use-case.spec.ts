import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../../users/user-role.enum.js';
import { Course } from '../entities/course.entity.js';
import { CourseRepository } from './course-repository.port.js';
import { UpdateCourseUseCase } from './update-course.use-case.js';

describe('UpdateCourseUseCase', () => {
  const createCourse = (): Course => ({
    id: 4,
    title: 'Existing course',
    level: 'beginner',
    createdByUserId: 8,
    enrollments: [],
  });
  const repository: CourseRepository = {
    findById: vi.fn(),
    save: vi.fn(),
  };
  const useCase = new UpdateCourseUseCase(repository);
  const changes = { title: 'Updated course' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lets the owning teacher update their course', async () => {
    const course = createCourse();
    vi.mocked(repository.findById).mockResolvedValue(course);
    vi.mocked(repository.save).mockImplementation(async (value) => value);

    await expect(
      useCase.execute(4, changes, {
        id: 8,
        role: UserRole.TEACHER,
      }),
    ).resolves.toMatchObject({ title: 'Updated course' });
    expect(repository.save).toHaveBeenCalledWith(course);
  });

  it('forbids a teacher from updating another teacher’s course', async () => {
    vi.mocked(repository.findById).mockResolvedValue(createCourse());

    await expect(
      useCase.execute(4, changes, {
        id: 9,
        role: UserRole.TEACHER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('allows an administrator to update a course they do not own', async () => {
    vi.mocked(repository.findById).mockResolvedValue(createCourse());
    vi.mocked(repository.save).mockImplementation(async (value) => value);

    await expect(
      useCase.execute(4, changes, {
        id: 1,
        role: UserRole.ADMIN,
      }),
    ).resolves.toMatchObject({ title: 'Updated course' });
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it('returns not found without saving when the course does not exist', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute(404, changes, {
        id: 8,
        role: UserRole.TEACHER,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
