import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async findAll(filters?: any) {
    const career = typeof filters === 'string' ? filters : filters?.career;
    return this.studentRepository.find({
      where: career ? { career } : {},
    });
  }

  async findOne(id: number): Promise<Student> {
    const student = await this.studentRepository.findOneBy({ id });
    if (!student) {
      throw new NotFoundException(`Estudiante con ID ${id} no encontrado`);
    }
    return student;
  }

  async create(createStudentDto: CreateStudentDto) {
    try {
      const student = this.studentRepository.create(createStudentDto);
      return await this.studentRepository.save(student);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      throw error;
    }
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    const student = await this.findOne(id);
    Object.assign(student, updateStudentDto);
    try {
      return await this.studentRepository.save(student);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('El correo electrónico ya está registrado por otro estudiante');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const student = await this.findOne(id);
    await this.studentRepository.remove(student);
    return student;
  }

  async toggleStatus(id: number) {
    const student = await this.findOne(id);
    student.isActive = !student.isActive;
    return await this.studentRepository.save(student);
  }
}