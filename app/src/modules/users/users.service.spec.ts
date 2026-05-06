import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../config/prisma/prisma.service';

jest.mock('bcrypt');

jest.mock('src/config/prisma/prisma.service', () => ({
  PrismaService: class MockPrismaService {
    user = {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };
    $transaction = jest.fn();
  },
}));

const mockPrismaService = {
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: typeof mockPrismaService;

  const baseUser = {
    id: 'user-id-1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    password: 'hashed_password',
    role: 'PLAYER',
    isActive: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      prisma.user.create.mockResolvedValue(baseUser);

      const result = await service.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'Secret123',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('Secret123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          password: 'hashed_password',
        },
      });
      expect(result.id).toBe(baseUser.id);
      expect(result.password).toBeUndefined();
    });

    it('should throw ConflictException on duplicate', async () => {
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      prisma.user.create.mockRejectedValue(prismaError);

      await expect(
        service.create({
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          password: 'Secret123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users with meta', async () => {
      prisma.$transaction.mockResolvedValue([[baseUser], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should apply name filter', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ name: 'Test' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Test', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should only return active users by default', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(baseUser);

      const result = await service.findOne('user-id-1');

      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        select: expect.any(Object),
      });
      expect(result.id).toBe(baseUser.id);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUniqueOrThrow.mockRejectedValue(
        Object.assign(new Error('Record not found'), { code: 'P2025' }),
      );

      await expect(service.findOne('non-existent')).rejects.toThrow();
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user by email', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(baseUser);

      const result = await service.findOneByEmail('test@example.com');

      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: expect.any(Object),
      });
      expect(result.email).toBe(baseUser.email);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        name: 'Updated Name',
      });

      const result = await service.update('user-id-1', {
        name: 'Updated Name',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: { name: 'Updated Name' },
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should hash password when updating password', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue(baseUser);

      await service.update('user-id-1', { password: 'NewSecret123' });

      expect(bcrypt.hash).toHaveBeenCalledWith('NewSecret123', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: { password: 'hashed_password' },
      });
    });
  });

  describe('updatePassword', () => {
    it('should update only the password', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue(baseUser);

      await service.updatePassword('user-id-1', {
        password: 'NewPass123',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass123', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: { password: 'hashed_password' },
        select: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('should deactivate user instead of deleting', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue({ ...baseUser, isActive: false });

      const result = await service.remove('user-id-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: { isActive: false },
        select: expect.any(Object),
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe('restore', () => {
    it('should reactivate a deactivated user', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...baseUser,
        isActive: false,
      });
      prisma.user.update.mockResolvedValue({ ...baseUser, isActive: true });

      const result = await service.restore('user-id-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: { isActive: true },
        select: expect.any(Object),
      });
      expect(result.isActive).toBe(true);
    });
  });
});
