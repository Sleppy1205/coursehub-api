import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { Student } from '../students/entities/student.entity.js';
import { Course } from '../courses/entities/course.entity.js';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  async create(dto: CreateEnrollmentDto): Promise<Enrollment> {
    const student = await this.studentsRepository.findOneBy({ id: dto.studentId });
    if (!student) {
      throw new NotFoundException(`Student ${dto.studentId} not found`);
    }
    if (!student.isActive) {
      throw new BadRequestException('Inactive students cannot enroll');
    }

    const course = await this.coursesRepository.findOneBy({ id: dto.courseId });
    if (!course) {
      throw new NotFoundException(`Course ${dto.courseId} not found`);
    }

    const duplicate = await this.enrollmentsRepository.findOne({
      where: {
        student: { id: student.id },
        course: { id: course.id },
      },
    });
    if (duplicate) {
      throw new ConflictException('Student is already enrolled in this course');
    }

    const enrollment = this.enrollmentsRepository.create({ student, course });
    try {
      return await this.enrollmentsRepository.save(enrollment);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        typeof error.driverError === 'object' &&
        error.driverError !== null &&
        'code' in error.driverError &&
        error.driverError.code === '23505'
      ) {
        throw new ConflictException('Student is already enrolled in this course');
      }
      throw error;
    }
  }

  async findAll(studentId?: number, courseId?: number): Promise<Enrollment[]> {
    return this.enrollmentsRepository.find({
      where: {
        ...(studentId !== undefined ? { student: { id: studentId } } : {}),
        ...(courseId !== undefined ? { course: { id: courseId } } : {}),
      },
      relations: { student: true, course: true },
      order: { id: 'ASC' },
    });
  }

  async findByStudent(studentId: number): Promise<Enrollment[]> {
    const student = await this.studentsRepository.findOneBy({ id: studentId });
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }
    return this.findAll(studentId);
  }

  async findByCourse(courseId: number): Promise<Enrollment[]> {
    const course = await this.coursesRepository.findOneBy({ id: courseId });
    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }
    return this.findAll(undefined, courseId);
  }

  async remove(id: number): Promise<Enrollment> {
    const enrollment = await this.enrollmentsRepository.findOneBy({ id });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${id} not found`);
    }
    await this.enrollmentsRepository.remove(enrollment);
    return enrollment;
  }
}