import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

jest.mock('src/config/prisma/prisma.service', () => ({
  PrismaService: class MockPrismaService {
    user = {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
  },
}));

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
};

import { AuthService } from './auth.service';
import { PrismaService } from 'src/config/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const baseUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    password: 'hashed',
    role: 'PLAYER',
    isActive: true,
    tokenVersion: 'token-v1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    mockJwtService.signAsync.mockResolvedValue('mock_token');
  });

  describe('register', () => {
    it('should create a new user with PLAYER role and return tokens', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...baseUser,
        password: 'hashed_password',
      });

      const result = await service.register({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'Secret123',
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'PLAYER',
            password: 'hashed_password',
          }),
        }),
      );
      expect(result.user.role).toBe('PLAYER');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        service.register({
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          password: 'Secret123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return user and tokens on valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'Secret123',
      });

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException for wrong email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'Secret123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...baseUser,
        isActive: false,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'Secret123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return new tokens if refresh token is valid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(baseUser);
      mockJwtService.verifyAsync.mockResolvedValue({
        tokenVersion: 'token-v1',
      });

      const result = await service.refresh('user-1', 'valid_refresh_token');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException if token version mismatch', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(baseUser);
      mockJwtService.verifyAsync.mockResolvedValue({
        tokenVersion: 'old-token-version',
      });

      await expect(
        service.refresh('user-1', 'valid_refresh_token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should update tokenVersion to invalidate tokens', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...baseUser,
        tokenVersion: 'new-token-v2',
      });

      await service.logout('user-1');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { tokenVersion: expect.any(String) },
      });
    });
  });

  describe('changePassword', () => {
    it('should update password and rotate tokenVersion', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue({
        ...baseUser,
        password: 'new_hashed',
      });

      const result = await service.changePassword('user-1', {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass123',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass123', 10);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_password',
            tokenVersion: expect.any(String),
          }),
        }),
      );
      expect(result.message).toContain('Contraseña actualizada');
    });

    it('should throw UnauthorizedException if current password is wrong', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'wrong',
          newPassword: 'NewPass123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
