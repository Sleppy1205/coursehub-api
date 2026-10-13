import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { FilterEnrollmentDto } from './dto/filter-enrollment.dto.js';
import { ParseNumericIdPipe } from './pipes/parse-numeric-id.pipe.js';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get()
  findAll(@Query() filters: FilterEnrollmentDto) {
    return this.enrollmentsService.findAll(filters.studentId, filters.courseId);
  }

  @Delete(':id')
  remove(@Param('id', ParseNumericIdPipe) id: number) {
    return this.enrollmentsService.remove(id);
  }
}