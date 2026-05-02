import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ResponseInterceptor } from './common/interceptors/index.js';
import {
  HttpExceptionFilter,
  PrismaExceptionFilter,
} from './common/filters/index.js';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger(bootstrap.name);
  const PORT = process.env.APP_PORT ?? 3007;

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  app.setGlobalPrefix('v1/api');
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());

  await app.listen(PORT);
  logger.log(`Servidor expuesto en: http://localhost:${PORT}/v1/api`);
}
bootstrap();
