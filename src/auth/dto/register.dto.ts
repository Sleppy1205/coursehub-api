import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value.trim().toLowerCase();
  })
  @IsEmail()
  email: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value.trim();
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
