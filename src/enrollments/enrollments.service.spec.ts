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

  beforeEach(async () => {
    vi.clearAllMocks();
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

  it('loads both related resources when listing enrollments', async () => {
    enrollmentsRepository.find.mockResolvedValue([]);

    await service.findAll(1, 2);

    expect(enrollmentsRepository.find).toHaveBeenCalledWith({
      where: { student: { id: 1 }, course: { id: 2 } },
      relations: { student: true, course: true },
      order: { id: 'ASC' },
    });
  });
});
