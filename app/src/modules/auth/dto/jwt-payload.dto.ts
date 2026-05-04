import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';

export class JwtPayloadDto {
  @IsString()
  sub: string;

  @IsString()
  email: string;

  @IsEnum(['ADMIN', 'OWNER', 'PLAYER'])
  role: string;

  @IsNumber()
  tokenVersion: number;

  @IsString()
  @IsOptional()
  iat?: number;

  @IsString()
  @IsOptional()
  exp?: number;
}
