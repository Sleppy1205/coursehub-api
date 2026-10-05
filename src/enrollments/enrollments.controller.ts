import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.enrollmentsService.findAll(filters);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enrollmentsService.remove(Number(id));
  }
}