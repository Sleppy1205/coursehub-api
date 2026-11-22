import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../../users/user-role.enum.js';
import { Course } from '../entities/course.entity.js';
import {
  COURSE_REPOSITORY,
  CourseRepository,
} from './course-repository.port.js';
import { UpdateCourseUseCase } from './update-course.use-case.js';

describe('UpdateCourseUseCase', () => {
  let useCase: UpdateCourseUseCase;
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
  const changes = { title: 'Updated course' };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCourseUseCase,
        { provide: COURSE_REPOSITORY, useValue: repository },
      ],
    }).compile();
    useCase = module.get(UpdateCourseUseCase);
  });

  it('lets the owning teacher update their course', async () => {
    // Arrange
    const course = createCourse();
    const actor = { id: 8, role: UserRole.TEACHER };
    vi.mocked(repository.findById).mockResolvedValue(course);
    vi.mocked(repository.save).mockImplementation(async (value) => value);

    // Act
    const result = await useCase.execute(4, changes, actor);

    // Assert
    expect(result.title).toBe('Updated course');
    expect(repository.save).toHaveBeenCalledWith(course);
  });

  it('forbids a teacher from updating another teacher’s course', async () => {
    // Arrange
    const course = createCourse();
    const actor = { id: 9, role: UserRole.TEACHER };
    vi.mocked(repository.findById).mockResolvedValue(course);

    // Act
    const result = useCase.execute(4, changes, actor);

    // Assert
    await expect(result).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('allows an administrator to update a course they do not own', async () => {
    // Arrange
    const course = createCourse();
    const actor = { id: 1, role: UserRole.ADMIN };
    vi.mocked(repository.findById).mockResolvedValue(course);
    vi.mocked(repository.save).mockImplementation(async (value) => value);

    // Act
    const result = await useCase.execute(4, changes, actor);

    // Assert
    expect(result.title).toBe('Updated course');
    expect(result.createdByUserId).toBe(8);
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it('returns not found without saving when the course does not exist', async () => {
    // Arrange
    const actor = { id: 8, role: UserRole.TEACHER };
    vi.mocked(repository.findById).mockResolvedValue(null);

    // Act
    const result = useCase.execute(404, changes, actor);

    // Assert
    await expect(result).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
