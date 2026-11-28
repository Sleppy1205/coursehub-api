import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsByteLength,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ana@example.com', format: 'email' })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value.trim().toLowerCase();
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'PracticaSegura123',
    minLength: 8,
    maxLength: 72,
    format: 'password',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @IsByteLength(8, 72)
  password: string;
}
