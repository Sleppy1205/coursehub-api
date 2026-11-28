import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator'; // 1

export class CreateCourseDto {
  // 2
  @ApiProperty({ example: 'NestJS Fundamentals', minLength: 1 })
  @IsString() // 3
  @IsNotEmpty() // 4
  title: string;

  @ApiProperty({ enum: ['beginner', 'intermediate', 'advanced'] })
  @IsIn(['beginner', 'intermediate', 'advanced']) // 5
  level: string;
}
