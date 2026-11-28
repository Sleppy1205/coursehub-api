import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupOpenApi(app: INestApplication, nodeEnv: string): void {
  if (nodeEnv !== 'development') {
    return;
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CourseHub API')
    .setDescription(
      [
        'API para administrar cursos, estudiantes y matrículas.',
        '',
        'Las rutas protegidas requieren un JWT Bearer válido. CORS no sustituye autenticación ni autorización.',
        'En producción usa HTTPS/TLS. No incluyas credenciales ni tokens reales en ejemplos o registros.',
        'Los errores usan { statusCode, path, timestamp, message }; los errores internos devuelven un mensaje genérico.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Pega el accessToken obtenido en POST /auth/login.',
      },
      'BearerAuth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
  });
}
