import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { PrismaModule } from '../../config/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_PRIVATE_SECRET'),
        signOptions: {
          expiresIn: config.get<number>('EXPIRES_REFRESH_TOKEN', 900),
          algorithm: 'HS256',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
