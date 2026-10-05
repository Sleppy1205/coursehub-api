import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { StudentsService } from './students.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.studentsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(Number(id), updateStudentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(Number(id));
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.studentsService.toggleStatus(Number(id));
  }
}