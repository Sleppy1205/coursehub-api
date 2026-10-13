import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Course } from './entities/course.entity.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { CoursesService } from './courses.service.js';

describe('CoursesService', () => {
  let service: CoursesService;
  const coursesRepository = {
    findAndCount: vi.fn(),
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
});
