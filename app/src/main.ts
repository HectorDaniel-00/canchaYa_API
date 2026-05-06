import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ResponseInterceptor } from './common/interceptors/index.js';
import {
  HttpExceptionFilter,
  PrismaExceptionFilter,
} from './common/filters/index.js';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger(bootstrap.name);
  const PORT = configService.get<number>('app.port')!;

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  app.setGlobalPrefix('v1/api');
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());

  app.use(cookieParser());
  app.use(helmet());

  await app.listen(PORT);
  logger.log(`Servidor expuesto en: http://localhost:${PORT}/v1/api`);
}
bootstrap();
