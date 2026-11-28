import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { EnrollmentsQueryDto } from './dto/enrollments-query.dto.js';
import { ParseNumericIdPipe } from './pipes/parse-numeric-id.pipe.js';
import {
  ApiErrorResponseDto,
  EnrollmentCollectionResponseDto,
  EnrollmentResponseDto,
} from '../common/openapi/api-response.dto.js';
import { ApiGenericServerErrorResponse } from '../common/openapi/api-generic-server-error.decorator.js';

@Controller('enrollments')
@ApiTags('Enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Enroll an active student in a course' })
  @ApiCreatedResponse({ type: EnrollmentResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid input or the student is inactive.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The student or course does not exist.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The student is already enrolled in the course.',
    type: ApiErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  @ApiGenericServerErrorResponse()
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List enrollments with related student and course data',
  })
  @ApiOkResponse({ type: EnrollmentCollectionResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  @ApiGenericServerErrorResponse()
  findAll(@Query() query: EnrollmentsQueryDto) {
    return this.enrollmentsService.findAll(query);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an enrollment' })
  @ApiParam({ name: 'id', schema: { type: 'integer', minimum: 1 } })
  @ApiOkResponse({ type: EnrollmentResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  @ApiGenericServerErrorResponse()
  remove(@Param('id', ParseNumericIdPipe) id: number) {
    return this.enrollmentsService.remove(id);
  }
}
