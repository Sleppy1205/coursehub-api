import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CoursesController } from '../courses/courses.controller.js';
import { CoursesService } from '../courses/courses.service.js';
import { UpdateCourseUseCase } from '../courses/application/update-course.use-case.js';
import { setupOpenApi } from './openapi.config.js';

describe('OpenAPI setup', () => {
  let app: INestApplication;
  const coursesService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
  };

  afterEach(async () => {
    await app?.close();
    vi.clearAllMocks();
  });

  async function createApp(nodeEnv: string): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: CoursesService, useValue: coursesService },
        { provide: UpdateCourseUseCase, useValue: { execute: vi.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: vi.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: vi.fn(() => true) })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    setupOpenApi(app, nodeEnv);
    await app.init();
    return app;
  }

  it('serves course routes, documented parameters and JWT security in development', async () => {
    const courseCollection = {
      items: [
        {
          id: 12,
          title: 'NestJS Fundamentals',
          level: 'beginner',
          createdByUserId: 7,
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    coursesService.findAll.mockResolvedValue(courseCollection);
    await createApp('development');

    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const document = response.body;

    expect(document.paths['/courses'].get.responses).toHaveProperty('200');
    expect(document.paths['/courses'].get.responses).toHaveProperty('400');
    expect(document.paths['/courses'].get.responses).toHaveProperty('500');
    expect(document.paths['/courses'].post.responses).toHaveProperty('401');
    expect(document.paths['/courses'].post.responses).toHaveProperty('403');
    expect(document.paths['/courses'].post.requestBody.content).toHaveProperty(
      'application/json',
    );
    expect(document.paths['/courses'].get.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'page', in: 'query' }),
        expect.objectContaining({ name: 'limit', in: 'query' }),
        expect.objectContaining({ name: 'sortBy', in: 'query' }),
      ]),
    );
    expect(
      document.components.schemas.CreateCourseDto.properties.level.enum,
    ).toEqual(['beginner', 'intermediate', 'advanced']);
    expect(
      document.paths['/courses'].get.responses['200'].content[
        'application/json'
      ].schema,
    ).toMatchObject({
      $ref: '#/components/schemas/CourseCollectionResponseDto',
    });
    expect(document.paths['/courses'].post.security).toContainEqual({
      BearerAuth: [],
    });
    expect(document.components.securitySchemes.BearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });

    await request(app.getHttpServer())
      .get('/courses?page=1&limit=10')
      .expect(200)
      .expect(courseCollection);
  });

  it('does not expose documentation outside development', async () => {
    await createApp('production');

    await request(app.getHttpServer()).get('/docs-json').expect(404);
  });
});
