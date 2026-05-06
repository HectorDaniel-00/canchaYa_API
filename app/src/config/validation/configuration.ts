export default () => ({
  app: {
    port: parseInt(process.env.APP_PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    host: process.env.APP_HOST ?? '0.0.0.0',
  },
  database: {
    host: process.env.POSTGRES_HOST!,
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    username: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    name: process.env.POSTGRES_DB!,
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES || '15m',
    refreshToken: {
      secret: process.env.REFRESH_SECRET!,
      expiresIn: process.env.REFRESH_EXPIRES || '12h',
    },
  },
});
