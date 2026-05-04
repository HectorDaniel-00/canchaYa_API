import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { map, Observable } from 'rxjs';
import { MESSAGE_KEY } from 'src/common/constants';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const message = this.reflector.getAllAndOverride<string>(MESSAGE_KEY, [
      context.getClass(),
      context.getHandler(),
    ]);

    const ctx = context.switchToHttp();
    const res = ctx.getResponse();
    const req: Request = ctx.getRequest();
    return next.handle().pipe(
      map((data) => {
        return {
          success: true,
          code: res.statusCode,
          timestamp: new Date().toISOString(),
          path: req.url,
          method: req.method,
          message: message ?? 'Operacion exitosa',
          data,
        };
      }),
    );
  }
}
