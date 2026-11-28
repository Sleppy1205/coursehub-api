import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { createCorsOptions } from '../src/config/cors.config.js';
import { setupOpenApi } from '../src/config/openapi.config.js';
import { User } from '../src/users/entities/user.entity.js';
import { UserRole } from '../src/users/user-role.enum.js';

describe('Course HTTP flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let usersRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    const configService = app.get(ConfigService);
    app.enableCors(
      createCorsOptions(configService.getOrThrow<string[]>('CORS_ORIGINS')),
    );
    setupOpenApi(app, 'development');
    await app.init();

    dataSource = app.get(DataSource);
    usersRepository = dataSource.getRepository(User);
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE "enrollments", "courses", "students", "users" RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.query(
        'TRUNCATE TABLE "enrollments", "courses", "students", "users" RESTART IDENTITY CASCADE',
      );
    }
    await app?.close();
  });

  it('returns an empty paginated course collection over HTTP', async () => {
    await request(app.getHttpServer())
      .get('/courses')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          items: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        });
      });
  });

  it('documents the real course contract and Bearer authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const document = response.body;

    expect(document.info).toMatchObject({
      title: 'CourseHub API',
      version: '1.0.0',
    });
    expect(document.paths['/courses'].get.responses).toHaveProperty('200');
    expect(document.paths['/courses'].get.responses).toHaveProperty('400');
    expect(document.paths['/courses'].post.responses).toHaveProperty('401');
    expect(document.paths['/courses'].post.responses).toHaveProperty('403');
    expect(document.paths['/courses'].post.responses).toHaveProperty('500');
    expect(document.paths['/courses/:id'].get.responses).toHaveProperty('404');
    expect(document.paths['/courses'].post.security).toContainEqual({
      BearerAuth: [],
    });
    expect(document.components.securitySchemes.BearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
    expect(document.paths['/courses'].get.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'page', in: 'query' }),
        expect.objectContaining({ name: 'limit', in: 'query' }),
        expect.objectContaining({ name: 'sortBy', in: 'query' }),
      ]),
    );
  });

  it('rejects a protected course write without a JWT', async () => {
    await request(app.getHttpServer())
      .post('/courses')
      .send({ title: 'E2E course', level: 'beginner' })
      .expect(401);
  });

  it('forbids an authenticated student from creating a course', async () => {
    const token = await createAccessToken('e2e-student@example.test');

    await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Student course', level: 'beginner' })
      .expect(403);
  });

  it('allows an authenticated teacher to create a course and read it back', async () => {
    const token = await createAccessToken(
      'e2e-teacher@example.test',
      UserRole.TEACHER,
    );

    const created = await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'E2E NestJS course', level: 'beginner' })
      .expect(201);

    expect(created.body).toMatchObject({
      id: expect.any(Number),
      title: 'E2E NestJS course',
      level: 'beginner',
    });

    await request(app.getHttpServer())
      .get('/courses')
      .expect(200)
      .expect(({ body }) => {
        expect(body.items).toHaveLength(1);
        expect(body.items[0]).toMatchObject({
          id: created.body.id,
          title: 'E2E NestJS course',
        });
        expect(body.meta.total).toBe(1);
      });
  });

  async function createAccessToken(
    email: string,
    role = UserRole.STUDENT,
  ): Promise<string> {
    const password = 'e2e-only-password';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    if (role !== UserRole.STUDENT) {
      await usersRepository.update({ email }, { role });
    }

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(login.body.accessToken).toEqual(expect.any(String));
    return login.body.accessToken as string;
  }
});
