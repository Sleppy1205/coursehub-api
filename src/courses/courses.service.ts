import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { Course } from './entities/course.entity.js';
import { UserRole } from '../users/user-role.enum.js';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  async findAll(query: CoursesQueryDto) {
    const { level, page, limit, sortBy, order } = query;
    const [items, total] = await this.coursesRepository.findAndCount({
      where: level ? { level } : {},
      order: sortBy === 'id' ? { id: order } : { [sortBy]: order, id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Course> {
    const course = await this.coursesRepository.findOneBy({ id });
    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }
    return course;
  }

  create(dto: CreateCourseDto, actor: AuthenticatedUser) {
    const course = this.coursesRepository.create({
      ...dto,
      createdByUserId: actor.id,
    });
    return this.coursesRepository.save(course);
  }

  async remove(id: number, actor: AuthenticatedUser) {
    const course = await this.findOne(id);
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete courses');
    }
    try {
      await this.coursesRepository.remove(course);
    } catch (error) {
      if (this.isEnrollmentConstraintViolation(error)) {
        throw new ConflictException(
          'Cannot delete a course that has enrollments',
        );
      }
      throw error;
    }
    return course;
  }

  private isEnrollmentConstraintViolation(error: unknown): boolean {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('driverError' in error)
    ) {
      return false;
    }

    const { driverError } = error;
    return (
      typeof driverError === 'object' &&
      driverError !== null &&
      'code' in driverError &&
      (driverError.code === '23001' || driverError.code === '23503')
    );
  }

}