import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { StudentsService } from '../students/students.service.js';
import { CoursesService } from '../courses/courses.service.js';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
    private readonly studentsService: StudentsService,
    private readonly coursesService: CoursesService,
  ) {}

  async create(dto: CreateEnrollmentDto) {
    const studentId = Number((dto as any).studentId || (dto as any).student);
    const courseId = Number((dto as any).courseId || (dto as any).course);

    const student = await this.studentsService.findOne(studentId);
    
    if (!student.isActive) {
      throw new BadRequestException('El estudiante se encuentra inactivo');
    }

    const course = await this.coursesService.findOne(courseId);

    try {
      const enrollment = this.enrollmentsRepository.create({ student, course });
      return await this.enrollmentsRepository.save(enrollment);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('El estudiante ya se encuentra matriculado en este curso');
      }
      throw error;
    }
  }

  async findAll(filters?: any) {
    const studentId = typeof filters === 'number' ? filters : Number(filters?.studentId);
    const courseId = Number(filters?.courseId);

    const where: any = {};
    if (studentId) where.student = { id: studentId };
    if (courseId) where.course = { id: courseId };

    return this.enrollmentsRepository.find({
      where,
      relations: { student: true, course: true },
    });
  }

  async findByStudent(studentId: number) {
    await this.studentsService.findOne(studentId);
    return this.findAll({ studentId });
  }

  async findByCourse(courseId: number) {
    await this.coursesService.findOne(courseId);
    return this.findAll({ courseId });
  }

  async remove(id: number) {
    const enrollment = await this.enrollmentsRepository.findOneBy({ id });
    if (!enrollment) {
      throw new NotFoundException(`Matrícula con ID ${id} no encontrada`);
    }
    await this.enrollmentsRepository.remove(enrollment);
    return enrollment;
  }
}