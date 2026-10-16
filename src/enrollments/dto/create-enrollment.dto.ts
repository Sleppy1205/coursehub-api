import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class CreateEnrollmentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  studentId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  courseId: number;
}