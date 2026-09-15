import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Student } from './entities/student.entity.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { FilterStudentDto } from './dto/filter-student.dto.js';

@Injectable()
export class StudentsService {
  private students: Student[] = [];

  findAll(filters?: FilterStudentDto): Student[] {
    let result = this.students;

    if (filters) {
      if (filters.career) {
        result = result.filter((s) =>
          s.career.toLowerCase().includes(filters.career!.toLowerCase()),
        );
      }
      if (filters.semester) {
        result = result.filter((s) => s.semester === filters.semester);
      }
      if (filters.isActive !== undefined) {
        result = result.filter((s) => s.isActive === filters.isActive);
      }
    }

    return result;
  }

  findOne(id: string): Student {
    const student = this.students.find((s) => s.id === id);
    if (!student) {
      throw new NotFoundException(`El estudiante con ID "${id}" no existe`);
    }
    return student;
  }

  create(createStudentDto: CreateStudentDto): Student {
    const emailExists = this.students.some(
      (s) => s.email.toLowerCase() === createStudentDto.email.toLowerCase(),
    );

    if (emailExists) {
      throw new ConflictException(
        `El correo "${createStudentDto.email}" ya se encuentra registrado`,
      );
    }

    const newStudent: Student = {
      id: Date.now().toString(),
      ...createStudentDto,
      isActive: true,
    };

    this.students.push(newStudent);
    return newStudent;
  }

  update(id: string, updateStudentDto: UpdateStudentDto): Student {
    const student = this.findOne(id);

    if (
      updateStudentDto.email &&
      updateStudentDto.email.toLowerCase() !== student.email.toLowerCase()
    ) {
      const emailExists = this.students.some(
        (s) => s.email.toLowerCase() === updateStudentDto.email!.toLowerCase(),
      );
      if (emailExists) {
        throw new ConflictException(
          `El correo "${updateStudentDto.email}" ya pertenece a otro estudiante`,
        );
      }
    }

    Object.assign(student, updateStudentDto);
    return student;
  }

  remove(id: string): void {
    const student = this.findOne(id);

    if (!student.isActive) {
      throw new ConflictException(
        'No se puede eliminar un estudiante que se encuentre inactivo',
      );
    }

    this.students = this.students.filter((s) => s.id !== id);
  }

  toggleStatus(id: string): Student {
    const student = this.findOne(id);
    student.isActive = !student.isActive;
    return student;
  }
}