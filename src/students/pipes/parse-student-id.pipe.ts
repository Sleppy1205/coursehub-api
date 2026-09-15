import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseStudentIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || value.trim().length === 0) {
      throw new BadRequestException('El ID del estudiante no puede estar vacío');
    }
    return value.trim();
  }
}