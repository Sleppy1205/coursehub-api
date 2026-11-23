import { ConfigService } from '@nestjs/config';
import { createDatabaseOptions } from './database.config.js';

describe('createDatabaseOptions', () => {
  const config = (nodeEnv: string) =>
    new ConfigService({
      NODE_ENV: nodeEnv,
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_USER: 'coursehub_local',
      DB_PASSWORD: 'local-only-test-password',
      DB_NAME: 'coursehub',
    });

  it('enables synchronization and loads registered entities in development', () => {
    const options = createDatabaseOptions(config('development'));

    expect(options).toMatchObject({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'coursehub_local',
      database: 'coursehub',
      autoLoadEntities: true,
      synchronize: true,
    });
  });

  it.each(['production', 'test'])(
    'disables synchronization in %s',
    (nodeEnv) => {
      const options = createDatabaseOptions(config(nodeEnv));

      expect(options.synchronize).toBe(false);
      expect(options.autoLoadEntities).toBe(true);
    },
  );

  it('synchronizes only the dedicated local E2E database', () => {
    const options = createDatabaseOptions(
      new ConfigService({
        NODE_ENV: 'test',
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_USER: 'coursehub_local',
        DB_PASSWORD: 'local-only-test-password',
        DB_NAME: 'coursehub_e2e_test',
      }),
    );

    expect(options.synchronize).toBe(true);
  });

  it('does not synchronize the E2E database on a remote host', () => {
    const options = createDatabaseOptions(
      new ConfigService({
        NODE_ENV: 'test',
        DB_HOST: 'database.example.test',
        DB_PORT: 5432,
        DB_USER: 'coursehub_local',
        DB_PASSWORD: 'local-only-test-password',
        DB_NAME: 'coursehub_e2e_test',
      }),
    );

    expect(options.synchronize).toBe(false);
  });

  it('does not synchronize a different local test database', () => {
    const options = createDatabaseOptions(
      new ConfigService({
        NODE_ENV: 'test',
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_USER: 'coursehub_local',
        DB_PASSWORD: 'local-only-test-password',
        DB_NAME: 'coursehub_test',
      }),
    );

    expect(options.synchronize).toBe(false);
  });
});
