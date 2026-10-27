import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DB_HOST: Joi.string().trim().min(1).required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().trim().min(1).required(),
  DB_USER: Joi.string().trim().min(1),
  DB_USERNAME: Joi.string().trim().min(1),
  DB_PASSWORD: Joi.string().when('NODE_ENV', {
    is: 'production',
    // Joi uses this key to define the production-only password constraint.
    // oxlint-disable-next-line unicorn/no-thenable
    then: Joi.string().min(1).required(),
    otherwise: Joi.string().allow('').required(),
  }),
  JWT_SECRET: Joi.string().trim().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().trim().min(1).default('15m'),
}).or('DB_USER', 'DB_USERNAME');

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = envValidationSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    const invalidVariables = error.details
      .map(({ path, type }) =>
        type === 'object.missing'
          ? 'DB_USER or DB_USERNAME is required'
          : `${path.join('.')} (${type})`,
      )
      .join(', ');
    throw new Error(`Configuración de entorno inválida: ${invalidVariables}`);
  }

  if (value.DB_USER === undefined) {
    value.DB_USER = value.DB_USERNAME;
  }

  return value;
}
