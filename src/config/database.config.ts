import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function createDatabaseOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const nodeEnv = configService.getOrThrow<string>('NODE_ENV');
  const database = configService.getOrThrow<string>('DB_NAME');
  const host = configService.getOrThrow<string>('DB_HOST');
  const isLocalE2eDatabase =
    nodeEnv === 'test' &&
    database === 'coursehub_e2e_test' &&
    ['localhost', '127.0.0.1', '::1'].includes(host);

  return {
    type: 'postgres',
    host,
    port: configService.getOrThrow<number>('DB_PORT'),
    username: configService.getOrThrow<string>('DB_USER'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database,
    autoLoadEntities: true,
    synchronize: nodeEnv === 'development' || isLocalE2eDatabase,
  };
}
