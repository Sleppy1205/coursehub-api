import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  COURSE_REPOSITORY,
  type CourseRepository,
} from './course-repository.port.js';
import { Course } from '../entities/course.entity.js';
import { UserRole } from '../../users/user-role.enum.js';

export type UpdateCourseActor = {
  id: number;
  role: UserRole;
};

export type UpdateCourseChanges = Partial<Pick<Course, 'title' | 'level'>>;

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courses: CourseRepository,
  ) {}

  async execute(
    id: number,
    changes: UpdateCourseChanges,
    actor: UpdateCourseActor,
  ): Promise<Course> {
    const course = await this.courses.findById(id);
    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }

    const isAdmin = actor.role === UserRole.ADMIN;
    const isOwner =
      actor.role === UserRole.TEACHER && course.createdByUserId === actor.id;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You cannot modify this course');
    }

    Object.assign(course, changes);
    return this.courses.save(course);
  }
}
