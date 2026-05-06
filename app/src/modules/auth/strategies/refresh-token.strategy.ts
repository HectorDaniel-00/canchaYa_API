import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayloadDto } from '../dto';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refreshToken;
        },
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayloadDto) {
    const refreshToken = req.cookies?.refreshToken;
    return { ...payload, refreshToken };
  }
}
