export default () => ({
  app: {
    port: parseInt(process.env.APP_PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
  swagger: {
    title: process.env.SWAGGER_TITLE || 'API',
    description: process.env.SWAGGER_DESCRIPTION || 'Sin description',
    version: parseInt(process.env.SWAGGER_VERSION ?? '1.0', 10),
  },
  jwt: {
    secret: process.env.JWT_PRIVATE_SECRE!,
    expiresIn: process.env.EXPIRES_TOKEN || '15m',
    refreshToken: {
      secret: process.env.JWT_REFRESH_PRIVATE_SECRET!,
      expiresIn: process.env.EXPIRES_REFRESH_TOKEN || '12h',
    },
  },
});
