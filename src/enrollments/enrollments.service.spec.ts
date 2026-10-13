import { BadRequestException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Course } from '../courses/entities/course.entity.js';
import { Student } from '../students/entities/student.entity.js';
import { Enrollment } from './entities/enrollment.entity.js';
import { EnrollmentsService } from './enrollments.service.js';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  const enrollmentsRepository = {
    create: vi.fn(),
    createQueryBuilder: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    remove: vi.fn(),
    save: vi.fn(),
  };
  const studentsRepository = {
    findOneBy: vi.fn(),
  };
  const coursesRepository = {
    findOneBy: vi.fn(),
  };
  const queryBuilder = {
    andWhere: vi.fn(),
    getManyAndCount: vi.fn(),
    leftJoinAndSelect: vi.fn(),
    orderBy: vi.fn(),
    skip: vi.fn(),
    take: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    queryBuilder.andWhere.mockReturnThis();
    queryBuilder.leftJoinAndSelect.mockReturnThis();
    queryBuilder.orderBy.mockReturnThis();
    queryBuilder.skip.mockReturnThis();
    queryBuilder.take.mockReturnThis();
    enrollmentsRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: getRepositoryToken(Enrollment), useValue: enrollmentsRepository },
        { provide: getRepositoryToken(Student), useValue: studentsRepository },
        { provide: getRepositoryToken(Course), useValue: coursesRepository },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  it('creates an enrollment after validating the student and course', async () => {
    const student = { id: 1, isActive: true };
    const course = { id: 2 };
    const enrollment = { student, course };
    studentsRepository.findOneBy.mockResolvedValue(student);
    coursesRepository.findOneBy.mockResolvedValue(course);
    enrollmentsRepository.findOne.mockResolvedValue(null);
    enrollmentsRepository.create.mockReturnValue(enrollment);
    enrollmentsRepository.save.mockResolvedValue(enrollment);

    await expect(service.create({ studentId: 1, courseId: 2 })).resolves.toBe(enrollment);
    expect(enrollmentsRepository.create).toHaveBeenCalledWith({ student, course });
    expect(enrollmentsRepository.save).toHaveBeenCalledWith(enrollment);
  });

  it('rejects inactive students before looking up the course', async () => {
    studentsRepository.findOneBy.mockResolvedValue({ id: 1, isActive: false });

    await expect(service.create({ studentId: 1, courseId: 2 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(coursesRepository.findOneBy).not.toHaveBeenCalled();
    expect(enrollmentsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects an existing student-course pair', async () => {
    studentsRepository.findOneBy.mockResolvedValue({ id: 1, isActive: true });
    coursesRepository.findOneBy.mockResolvedValue({ id: 2 });
    enrollmentsRepository.findOne.mockResolvedValue({ id: 3 });

    await expect(service.create({ studentId: 1, courseId: 2 })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(enrollmentsRepository.save).not.toHaveBeenCalled();
  });

  it('combines filters with parameterized search and returns related paginated results', async () => {
    const items = [{ id: 5, student: { id: 1 }, course: { id: 2 } }];
    queryBuilder.getManyAndCount.mockResolvedValue([items, 12]);

    await expect(
      service.findAll({
        search: " ' OR 1=1 -- ",
        studentId: 1,
        courseId: 2,
        activeOnly: 'true',
        page: 2,
        limit: 5,
      }),
    ).resolves.toEqual({
      items,
      meta: { total: 12, page: 2, limit: 5 },
    });

    expect(enrollmentsRepository.createQueryBuilder).toHaveBeenCalledWith('enrollment');
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenNthCalledWith(
      1,
      'enrollment.student',
      'student',
    );
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenNthCalledWith(
      2,
      'enrollment.course',
      'course',
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      1,
      '(student.name ILIKE :search OR course.title ILIKE :search)',
      { search: "%' OR 1=1 --%" },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(2, 'student.id = :studentId', {
      studentId: 1,
    });
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(3, 'course.id = :courseId', {
      courseId: 2,
    });
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      4,
      'student.isActive = :active',
      { active: true },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('enrollment.id', 'ASC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
  });

  it('returns an empty page without applying omitted filters', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await expect(service.findAll({ page: 1, limit: 10 })).resolves.toEqual({
      items: [],
      meta: { total: 0, page: 1, limit: 10 },
    });
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
  });
});
