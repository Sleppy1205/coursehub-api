import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CoursesModule } from './courses/courses.module.js';
import { StudentsModule } from './students/students.module.js';
import { EnrollmentsModule } from './enrollments/enrollments.module.js';
import { Course } from './courses/entities/course.entity.js';
import { Student } from './students/entities/student.entity.js';
import { Enrollment } from './enrollments/entities/enrollment.entity.js';
import { validateEnvironment } from './config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: [Course, Student, Enrollment],
        synchronize: true,
      }),
    }),
    CoursesModule,
    StudentsModule,
    EnrollmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}