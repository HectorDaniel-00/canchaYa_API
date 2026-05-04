import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Reflector } from '@nestjs/core';

jest.mock('src/config/prisma/prisma.service', () => ({
  PrismaService: class MockPrismaService {},
}));

const mockUsersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findOneByEmail: jest.fn(),
  update: jest.fn(),
  updatePassword: jest.fn(),
  remove: jest.fn(),
  restore: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideProvider(Reflector)
      .useValue({
        getAllAndOverride: jest.fn(),
        get: jest.fn(),
      })
      .compile();

    controller = module.get<UsersController>(UsersController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto = {
        name: 'Test',
        email: 'test@test.com',
        phone: '123',
        password: 'Pass123',
      };
      mockUsersService.create.mockResolvedValue({ id: '1', ...dto });

      await controller.create(dto);

      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query params', async () => {
      mockUsersService.findAll.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      });

      await controller.findAll({ page: 1, limit: 10 });

      expect(mockUsersService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      mockUsersService.findOne.mockResolvedValue({ id: '1', name: 'Test' });

      await controller.findOne('1');

      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('findByEmail', () => {
    it('should call service.findOneByEmail with email query param', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
      });

      await controller.findByEmail('test@test.com');

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        'test@test.com',
      );
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto = { name: 'Updated' };
      mockUsersService.update.mockResolvedValue({ id: '1', ...dto });

      await controller.update('1', dto);

      expect(mockUsersService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('updatePassword', () => {
    it('should call service.updatePassword with id and dto', async () => {
      const dto = { password: 'NewPass123' };
      mockUsersService.updatePassword.mockResolvedValue({ id: '1' });

      await controller.updatePassword('1', dto);

      expect(mockUsersService.updatePassword).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      mockUsersService.remove.mockResolvedValue({ id: '1', isActive: false });

      await controller.remove('1');

      expect(mockUsersService.remove).toHaveBeenCalledWith('1');
    });
  });

  describe('restore', () => {
    it('should call service.restore with id', async () => {
      mockUsersService.restore.mockResolvedValue({ id: '1', isActive: true });

      await controller.restore('1');

      expect(mockUsersService.restore).toHaveBeenCalledWith('1');
    });
  });
});
