const requiredE2eVariables = [
  'E2E_DB_HOST',
  'E2E_DB_PORT',
  'E2E_DB_NAME',
  'E2E_DB_USER',
  'E2E_DB_PASSWORD',
] as const;

for (const variable of requiredE2eVariables) {
  if (process.env[variable] === undefined) {
    throw new Error(
      `Missing ${variable}. E2E tests require an isolated local test database.`,
    );
  }
}

const databaseHost = process.env.E2E_DB_HOST!;
const databasePort = Number(process.env.E2E_DB_PORT);
const databaseName = process.env.E2E_DB_NAME!;
if (!['localhost', '127.0.0.1', '::1'].includes(databaseHost)) {
  throw new Error('E2E_DB_HOST must point to a local PostgreSQL server.');
}
if (!Number.isInteger(databasePort) || databasePort < 1 || databasePort > 65535) {
  throw new Error('E2E_DB_PORT must be a valid TCP port.');
}
if (databaseName !== 'coursehub_e2e_test') {
  throw new Error('E2E_DB_NAME must be coursehub_e2e_test.');
}

process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.DB_HOST = databaseHost;
process.env.DB_PORT = String(databasePort);
process.env.DB_NAME = databaseName;
process.env.DB_USER = process.env.E2E_DB_USER!;
process.env.DB_PASSWORD = process.env.E2E_DB_PASSWORD!;
process.env.JWT_SECRET =
  'coursehub-e2e-only-secret-never-use-in-production';
process.env.JWT_EXPIRES_IN = '15m';
process.env.CORS_ORIGINS = 'http://localhost:5173';
