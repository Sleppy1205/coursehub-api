import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique } from 'typeorm';
import { Student } from '../../students/entities/student.entity.js';
import { Course } from '../../courses/entities/course.entity.js';

@Entity('enrollments')
@Unique(['student', 'course']) // Restricción única para la pareja estudiante-curso
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, { onDelete: 'CASCADE', nullable: false })
  student: Student;

  @ManyToOne(() => Course, { onDelete: 'CASCADE', nullable: false })
  course: Course;
}