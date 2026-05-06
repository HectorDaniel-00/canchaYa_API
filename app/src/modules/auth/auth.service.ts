import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, ChangePasswordDto } from './dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../config/prisma/prisma.service';
import { CreateUserDto } from '../users/dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: CreateUserDto) {
    const { email, password, ...rest } = data;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'Ya existe un usuario registrado con ese email',
      );
    }

    const passwordHashed = await bcrypt.hash(password, this.saltRounds);

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        email,
        password: passwordHashed,
        role: 'PLAYER' as const,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        tokenVersion: true,
      },
    });

    const tokens = await this.generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Tu cuenta está desactivada. Contacta soporte.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refresh(userId: string, currentRefreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        tokenVersion: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    let refreshTokenPayload: { tokenVersion: string };
    try {
      refreshTokenPayload = await this.jwtService.verifyAsync(
        currentRefreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    if (refreshTokenPayload.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException(
        'Sesión expirada. Inicia sesión nuevamente.',
      );
    }

    const tokens = await this.generateTokens(user);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: crypto.randomUUID() },
    });

    this.logger.log(`User logged out: ${userId}`);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const newPasswordHashed = await bcrypt.hash(
      dto.newPassword,
      this.saltRounds,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: newPasswordHashed,
        tokenVersion: crypto.randomUUID(),
      },
    });

    this.logger.log(`Password changed for user: ${userId}`);

    return { message: 'Contraseña actualizada exitosamente' };
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    role: string;
    tokenVersion: string;
  }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          tokenVersion: user.tokenVersion,
        },
        {
          secret: process.env.JWT_ACCESS_SECRET,
          expiresIn: Number(process.env.JWT_ACCESS_EXPIRES!),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          tokenVersion: user.tokenVersion,
        },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: Number(process.env.JWT_REFRESH_EXPIRES!),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
