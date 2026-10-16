import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Student } from './entities/student.entity.js';
import { StudentsService } from './students.service.js';

describe('StudentsService', () => {
  let service: StudentsService;
  const studentRepository = {
    find: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: getRepositoryToken(Student), useValue: studentRepository },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  it('combines career, semester, and active-status filters', async () => {
    const filters = {
      career: 'Engineering',
      semester: 4,
      isActive: false,
    };
    studentRepository.find.mockResolvedValue([]);

    await expect(service.findAll(filters)).resolves.toEqual([]);
    expect(studentRepository.find).toHaveBeenCalledWith({ where: filters });
  });

  it('lists all students when no filters are set', async () => {
    studentRepository.find.mockResolvedValue([]);

    await expect(service.findAll({})).resolves.toEqual([]);
    expect(studentRepository.find).toHaveBeenCalledWith({ where: {} });
  });
});
