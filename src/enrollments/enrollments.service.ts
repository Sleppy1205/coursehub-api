import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CoursesService } from '../courses/courses.service.js';
import { StudentsService } from '../students/students.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { FilterEnrollmentDto } from './dto/filter-enrollment.dto.js';

type Enrollment = {
  id: number;
  studentId: string;
  courseId: number;
};

@Injectable()
export class EnrollmentsService {
  private readonly enrollments: Enrollment[] = [];
  private nextId = 1;

  constructor(
    private readonly studentsService: StudentsService,
    private readonly coursesService: CoursesService,
  ) {}

  create(dto: CreateEnrollmentDto): Enrollment {
    const student = this.studentsService.findOne(dto.studentId);

    const course = this.coursesService.findOne(dto.courseId);
    if (!course) {
      throw new NotFoundException(`El curso con ID "${dto.courseId}" no existe`);
    }

    if (!student.isActive) {
      throw new ConflictException(
        `El estudiante con ID "${dto.studentId}" se encuentra inactivo`,
      );
    }

    const alreadyEnrolled = this.enrollments.some(
      (e) => e.studentId === dto.studentId && e.courseId === dto.courseId,
    );
    if (alreadyEnrolled) {
      throw new ConflictException(
        `El estudiante "${dto.studentId}" ya está matriculado en el curso "${dto.courseId}"`,
      );
    }

    const enrollment: Enrollment = {
      id: this.nextId++,
      studentId: dto.studentId,
      courseId: dto.courseId,
    };
    this.enrollments.push(enrollment);
    return enrollment;
  }

  findAll(filters?: FilterEnrollmentDto): Enrollment[] {
    let result = this.enrollments;

    if (filters?.studentId) {
      result = result.filter((e) => e.studentId === filters.studentId);
    }
    if (filters?.courseId !== undefined) {
      result = result.filter((e) => e.courseId === filters.courseId);
    }

    return result;
  }

  findByStudent(studentId: string): Enrollment[] {
    this.studentsService.findOne(studentId);
    return this.enrollments.filter((e) => e.studentId === studentId);
  }

  findByCourse(courseId: number): Enrollment[] {
    const course = this.coursesService.findOne(courseId);
    if (!course) {
      throw new NotFoundException(`El curso con ID "${courseId}" no existe`);
    }
    return this.enrollments.filter((e) => e.courseId === courseId);
  }

  remove(id: number): void {
    const index = this.enrollments.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new NotFoundException(`La matrícula con ID "${id}" no existe`);
    }
    this.enrollments.splice(index, 1);
  }
}