import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { WelcomeController } from './welcome.controller.js';
import { welcomeService } from './welcome.service.js';
import { CoursesModule } from './courses/courses.module.js';
import { StudentsModule } from './students/students.module.js';

@Module({
  imports: [CoursesModule, StudentsModule],
  controllers: [AppController, WelcomeController],
  providers: [AppService, welcomeService],
})
export class AppModule {}