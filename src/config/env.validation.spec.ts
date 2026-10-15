import { validateEnvironment } from './env.validation.js';

describe('envValidationSchema', () => {
  const validConfig = {
    DB_HOST: 'localhost',
    DB_NAME: 'coursehub',
    DB_USER: 'postgres',
    DB_PASSWORD: '',
    NODE_ENV: 'test',
  };

  it('requires database settings and applies defaults', () => {
    const value = validateEnvironment(validConfig);

    expect(value).toMatchObject({
      NODE_ENV: 'test',
      PORT: 3000,
      DB_PORT: 5432,
    });
  });

  it('rejects missing required settings', () => {
    expect(() =>
      validateEnvironment({
        DB_NAME: 'coursehub',
        DB_PASSWORD: '',
      }),
    ).toThrow(/DB_HOST/);

    expect(() =>
      validateEnvironment({
        DB_NAME: 'coursehub',
        DB_PASSWORD: '',
      }),
    ).toThrow(/DB_USER|DB_USERNAME/);
  });

  it('rejects invalid ports and environment names', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        PORT: 'not-a-number',
        NODE_ENV: 'staging',
      }),
    ).toThrow(/PORT/);

    expect(() =>
      validateEnvironment({
        ...validConfig,
        PORT: 'not-a-number',
        NODE_ENV: 'staging',
      }),
    ).toThrow(/NODE_ENV/);
  });

  it('requires a non-empty password in production', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        NODE_ENV: 'production',
      }),
    ).toThrow(/DB_PASSWORD/);
  });

  it('accepts the previous DB_USERNAME variable for local compatibility', () => {
    const value = validateEnvironment({
      DB_HOST: 'localhost',
      DB_NAME: 'coursehub',
      DB_USERNAME: 'postgres',
      DB_PASSWORD: '',
    });

    expect(value.DB_USER).toBe('postgres');
  });
});
