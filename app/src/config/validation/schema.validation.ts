import * as Joi from 'joi';

export const schemaValidation = Joi.object({
  // App
  APP_PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Postgres
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),

  // Swagger
  SWAGGER_TITLE: Joi.string().optional(),
  SWAGGER_DESCRIPTION: Joi.string().optional().default('Sin description'),
  SWAGGER_VERSION: Joi.number().optional(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES: Joi.string().required().default('15m'),
  REFRESH_SECRET: Joi.string().required(),
  REFRESH_EXPIRES: Joi.string().required().default('12h'),
});
