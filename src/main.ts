import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { createCorsOptions } from './config/cors.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Esta línea habilita la validación global de los DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  app.enableCors(
    createCorsOptions(configService.getOrThrow<string[]>('CORS_ORIGINS')),
  );

  await app.listen(configService.getOrThrow<number>('PORT'));
}
bootstrap();