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
}).or('DB_USER', 'DB_USERNAME');

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = envValidationSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    throw error;
  }

  if (value.DB_USER === undefined) {
    value.DB_USER = value.DB_USERNAME;
  }

  return value;
}
