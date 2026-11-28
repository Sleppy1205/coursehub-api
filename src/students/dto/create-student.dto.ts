import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'Ana García', minLength: 1 })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ana@example.com', format: 'email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 20, minimum: 15 })
  @IsInt()
  @Min(15)
  age: number;

  @ApiProperty({ example: 'Software Engineering' })
  @IsString()
  @IsNotEmpty()
  career: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  semester: number;
}
