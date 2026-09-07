import { Injectable } from '@nestjs/common';

@Injectable()
export class welcomeService {
  getMessage(): { message: string } {
    return { message: 'Bienvenido a CourseHub API' };
  }
}
