import * as Joi from 'joi';

export const schemaValidation = Joi.object({
  // App
  APP_PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Postgres
  DATABASE_URL: Joi.string().required(),

  // Swagger
  SWAGGER_TITLE: Joi.string().optional().default('API'),
  SWAGGER_DESCRIPTION: Joi.string().optional().default('Sin description'),
  SWAGGER_VERSION: Joi.number().optional().default(1.0),

  // JWT
  JWT_PRIVATE_SECRET: Joi.string().required(),
  EXPIRES_TOKEN: Joi.string().required().default('15m'),
  JWT_REFRESH_PRIVATE_SECRET: Joi.string().required(),
  EXPIRES_REFRESH_TOKEN: Joi.string().required().default('12h'),
});
