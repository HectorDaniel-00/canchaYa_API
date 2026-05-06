import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '../../../generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error en base de datos';

    let meta: { target?: string };
    let field: string;

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        meta = exception.meta as { target?: string };
        field = meta?.target ? ` (${meta.target})` : '';
        message = `El recurso ya existe${field}`;
        break;

      case 'P2001':
        status = HttpStatus.NOT_FOUND;
        message = 'El recurso no existe';
        break;

      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'El registro no fue encontrado';
        break;

      case 'P2003':
        status = HttpStatus.CONFLICT;
        message = 'Violación de clave foránea';
        break;

      case 'P2014':
        status = HttpStatus.CONFLICT;
        message = 'Violación de relación en base de datos';
        break;

      case 'P2004':
        status = HttpStatus.CONFLICT;
        message = 'Violación de restricción en base de datos';
        break;

      case 'P2037':
        status = HttpStatus.CONFLICT;
        message = 'Demasiadas conexiones a la base de datos';
        break;

      default:
        message = `Error inesperado en base de datos (${exception.code})`;
    }

    res.status(status).json({
      success: false,
      statusCode: status,
      path: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
