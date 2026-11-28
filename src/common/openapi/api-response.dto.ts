import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/user-role.enum.js';

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: '/courses/abc' })
  path: string;

  @ApiProperty({ example: '2026-11-27T18:00:00.000Z', format: 'date-time' })
  timestamp: string;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'Validation failed' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['page must not be less than 1'],
      },
    ],
  })
  message: string | string[];
}

export class PaginationMetaDto {
  @ApiProperty({ example: 42, minimum: 0 })
  total: number;

  @ApiProperty({ example: 1, minimum: 1 })
  page: number;

  @ApiProperty({ example: 10, minimum: 1, maximum: 50 })
  limit: number;

  @ApiProperty({ example: 5, minimum: 0 })
  totalPages: number;
}

export class AuthUserResponseDto {
  @ApiProperty({ example: 7 })
  id: number;

  @ApiProperty({ example: 'ana@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT })
  role: UserRole;

  @ApiProperty({ example: '2026-11-27T18:00:00.000Z', format: 'date-time' })
  createdAt: Date;
}

export class AuthProfileResponseDto {
  @ApiProperty({ example: 7 })
  id: number;

  @ApiProperty({ example: 'ana@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT })
  role: UserRole;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT Bearer access token. Keep it secret.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;
}

export class CourseResponseDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'NestJS Fundamentals' })
  title: string;

  @ApiProperty({ enum: ['beginner', 'intermediate', 'advanced'] })
  level: string;

  @ApiProperty({ example: 7, nullable: true })
  createdByUserId: number | null;
}

export class CourseCollectionResponseDto {
  @ApiProperty({ type: () => [CourseResponseDto] })
  items: CourseResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class EnrollmentCollectionResponseDto {
  @ApiProperty({ type: () => [EnrollmentResponseDto] })
  items: EnrollmentResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class EnrollmentStudentResponseDto {
  @ApiProperty({ example: 4 })
  id: number;

  @ApiProperty({ example: 'Ana García' })
  name: string;

  @ApiProperty({ example: 'ana@example.com' })
  email: string;

  @ApiProperty({ example: 20 })
  age: number;

  @ApiProperty({ example: 'Software Engineering' })
  career: string;

  @ApiProperty({ example: 4 })
  semester: number;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class EnrollmentResponseDto {
  @ApiProperty({ example: 31 })
  id: number;

  @ApiProperty({ type: () => EnrollmentStudentResponseDto })
  student: EnrollmentStudentResponseDto;

  @ApiProperty({ type: CourseResponseDto })
  course: CourseResponseDto;
}

export class StudentResponseDto {
  @ApiProperty({ example: 4 })
  id: number;

  @ApiProperty({ example: 'Ana García' })
  name: string;

  @ApiProperty({ example: 'ana@example.com', format: 'email' })
  email: string;

  @ApiProperty({ example: 20, minimum: 15 })
  age: number;

  @ApiProperty({ example: 'Software Engineering' })
  career: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 10 })
  semester: number;

  @ApiProperty({ example: true })
  isActive: boolean;
}
