import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

jest.mock('src/config/prisma/prisma.service', () => ({
  PrismaService: class MockPrismaService {},
}));

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  changePassword: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: {} },
      ],
    })
      .overrideProvider(Reflector)
      .useValue({
        getAllAndOverride: jest.fn(),
        get: jest.fn(),
      })
      .compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call service.register and return access token', async () => {
      const dto = {
        name: 'Test',
        email: 'test@test.com',
        phone: '123',
        password: 'Pass123',
      };
      mockAuthService.register.mockResolvedValue({
        user: { id: '1' },
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const res = { cookie: jest.fn() } as any;
      const result = await controller.register(dto, res);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(res.cookie).toHaveBeenCalled();
      expect(result.accessToken).toBe('access');
    });
  });

  describe('login', () => {
    it('should call service.login and return access token', async () => {
      const dto = { email: 'test@test.com', password: 'Pass123' };
      mockAuthService.login.mockResolvedValue({
        user: { id: '1' },
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const res = { cookie: jest.fn() } as any;
      const result = await controller.login(dto, res);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(res.cookie).toHaveBeenCalled();
      expect(result.accessToken).toBe('access');
    });
  });

  describe('refresh', () => {
    it('should call service.refresh and return new access token', async () => {
      mockAuthService.refresh.mockResolvedValue({
        accessToken: 'new_access',
        refreshToken: 'new_refresh',
      });

      const req = {
        user: { sub: 'user-1' },
        cookies: { refreshToken: 'old_refresh' },
      } as any;
      const res = { cookie: jest.fn() } as any;

      const result = await controller.refresh(req, res);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        'user-1',
        'old_refresh',
      );
      expect(res.cookie).toHaveBeenCalled();
      expect(result.accessToken).toBe('new_access');
    });
  });

  describe('logout', () => {
    it('should call service.logout and clear refresh cookie', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const res = {
        clearCookie: jest.fn(),
      } as any;

      const result = await controller.logout('user-1', res);

      expect(mockAuthService.logout).toHaveBeenCalledWith('user-1');
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/v1/api/auth',
      });
      expect(result.message).toContain('Sesión cerrada');
    });
  });

  describe('changePassword', () => {
    it('should call service.changePassword', async () => {
      const dto = {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass123',
      };
      mockAuthService.changePassword.mockResolvedValue({
        message: 'Contraseña actualizada',
      });

      await controller.changePassword('user-1', dto);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        'user-1',
        dto,
      );
    });
  });
});
