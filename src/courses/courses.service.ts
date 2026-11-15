import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
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

  async update(
    id: number,
    dto: UpdateCourseDto,
    actor: AuthenticatedUser,
  ) {
    const course = await this.findOne(id);
    this.assertCanManage(course, actor);
    Object.assign(course, dto);
    return this.coursesRepository.save(course);
  }

  async remove(id: number, actor: AuthenticatedUser) {
    const course = await this.findOne(id);
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete courses');
    }
    await this.coursesRepository.remove(course);
    return course;
  }

  private assertCanManage(course: Course, actor: AuthenticatedUser): void {
    if (
      actor.role !== UserRole.ADMIN &&
      !(actor.role === UserRole.TEACHER &&
        course.createdByUserId === actor.id)
    ) {
      throw new ForbiddenException('You cannot modify this course');
    }
  }
}