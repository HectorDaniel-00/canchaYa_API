import { Test, TestingModule } from '@nestjs/testing';
import { CourtsService } from './courts.service';
import { PrismaService } from '../../config/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SurfaceType } from '../../common/enums/surface.enum';

const mockPrismaService = {
  court: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

describe('CourtsService', () => {
  let service: CourtsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourtsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CourtsService>(CourtsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'Test Court',
      description: 'Test Description',
      price: '50.00',
      location: 'Test Location',
      lat: '40.7128',
      lng: '-74.0060',
      surface: SurfaceType.SYNTHETIC,
      ownerId: 'owner-uuid',
    };

    it('should create a court successfully', async () => {
      const mockCourt = {
        id: 'court-uuid',
        ...createDto,
        price: 50,
        lat: 40.7128,
        lng: -74.006,
        isActive: true,
        createdAt: new Date(),
      };

      prisma.court.create.mockResolvedValue(mockCourt);

      const result = await service.create(createDto);

      expect(prisma.court.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          price: 50,
          lat: 40.7128,
          lng: -74.006,
        },
      });
      expect(result.name).toEqual('Test Court');
    });

    it('should throw BadRequestException when court already exists', async () => {
      prisma.court.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException on unknown error', async () => {
      prisma.court.create.mockRejectedValue(new Error('Unknown error'));

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated courts', async () => {
      const mockCourts = [
        {
          id: 'court-1',
          name: 'Court 1',
          price: 50,
          lat: 40.7128,
          lng: -74.006,
          surface: SurfaceType.SYNTHETIC,
          isActive: true,
          location: 'Location 1',
          ownerId: 'owner-1',
          owner: { id: 'owner-1', name: 'Owner', email: 'owner@test.com' },
          _count: { timeSlots: 5, bookings: 2, reviews: 3 },
          createdAt: new Date(),
        },
      ];

      prisma.court.findMany.mockResolvedValue(mockCourts);
      prisma.court.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toEqual(1);
      expect(result.meta.totalPages).toEqual(1);
    });

    it('should filter by isActive', async () => {
      prisma.court.findMany.mockResolvedValue([]);
      prisma.court.count.mockResolvedValue(0);

      await service.findAll({ isActive: true });

      expect(prisma.court.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should filter by price range', async () => {
      prisma.court.findMany.mockResolvedValue([]);
      prisma.court.count.mockResolvedValue(0);

      await service.findAll({ minPrice: 30, maxPrice: 100 });

      expect(prisma.court.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 30, lte: 100 },
          }),
        }),
      );
    });

    it('should filter by surface type', async () => {
      prisma.court.findMany.mockResolvedValue([]);
      prisma.court.count.mockResolvedValue(0);

      await service.findAll({ surface: SurfaceType.NATURAL });

      expect(prisma.court.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ surface: SurfaceType.NATURAL }),
        }),
      );
    });

    it('should filter by location (case insensitive)', async () => {
      prisma.court.findMany.mockResolvedValue([]);
      prisma.court.count.mockResolvedValue(0);

      await service.findAll({ location: 'downtown' });

      expect(prisma.court.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: {
              contains: 'downtown',
              mode: 'insensitive',
            },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a court by id', async () => {
      const mockCourt = {
        id: 'court-uuid',
        name: 'Test Court',
        price: 50,
        lat: 40.7128,
        lng: -74.006,
        surface: SurfaceType.SYNTHETIC,
        isActive: true,
        location: 'Test Location',
        ownerId: 'owner-1',
        owner: { id: 'owner-1', name: 'Owner', email: 'owner@test.com' },
        _count: { timeSlots: 5, bookings: 2, reviews: 3 },
        createdAt: new Date(),
      };

      prisma.court.findUnique.mockResolvedValue(mockCourt);

      const result = await service.findOne('court-uuid');

      expect(result.name).toEqual('Test Court');
      expect(result.owner).toBeDefined();
      expect(result.counts).toBeDefined();
    });

    it('should throw NotFoundException when court not found', async () => {
      prisma.court.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a court successfully', async () => {
      const existingCourt = {
        id: 'court-uuid',
        name: 'Old Name',
        price: 50,
        isActive: true,
      };

      const updatedCourt = {
        ...existingCourt,
        name: 'New Name',
      };

      prisma.court.findUnique.mockResolvedValue(existingCourt);
      prisma.court.update.mockResolvedValue(updatedCourt);

      const result = await service.update('court-uuid', { name: 'New Name' });

      expect(result.name).toEqual('New Name');
    });

    it('should throw NotFoundException when court not found', async () => {
      prisma.court.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a court', async () => {
      const existingCourt = { id: 'court-uuid', isActive: true };

      prisma.court.findUnique.mockResolvedValue(existingCourt);
      prisma.court.update.mockResolvedValue({ ...existingCourt, isActive: false });

      const result = await service.remove('court-uuid');

      expect(prisma.court.update).toHaveBeenCalledWith({
        where: { id: 'court-uuid' },
        data: { isActive: false },
      });
      expect(result.message).toContain('desactivada correctamente');
    });

    it('should throw NotFoundException when court not found', async () => {
      prisma.court.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findActive', () => {
    it('should return only active courts', async () => {
      prisma.court.findMany.mockResolvedValue([]);
      prisma.court.count.mockResolvedValue(0);

      await service.findActive();

      expect(prisma.court.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  describe('findByPriceRange', () => {
    it('should return courts within price range', async () => {
      prisma.court.findMany.mockResolvedValue([]);
      prisma.court.count.mockResolvedValue(0);

      await service.findByPriceRange(30, 100);

      expect(prisma.court.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 30, lte: 100 },
          }),
        }),
      );
    });

    it('should throw BadRequestException when min > max', async () => {
      await expect(service.findByPriceRange(100, 30)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findWithAvailability', () => {
    it('should return courts with available time slots', async () => {
      const mockCourts = [
        {
          id: 'court-uuid',
          name: 'Available Court',
          price: 50,
          lat: 40.7128,
          lng: -74.006,
          surface: SurfaceType.SYNTHETIC,
          isActive: true,
          location: 'Location',
          ownerId: 'owner-1',
          timeSlots: [{ id: 'slot-1', isBooked: false, startTime: new Date() }],
          createdAt: new Date(),
        },
      ];

      prisma.court.findMany.mockResolvedValue(mockCourts);

      const result = await service.findWithAvailability();

      expect(result).toHaveLength(1);
    });
  });

  describe('findTopRated', () => {
    it('should return courts sorted by average rating', async () => {
      const mockCourts = [
        {
          id: 'court-1',
          name: 'Court A',
          price: 50,
          lat: 40.7128,
          lng: -74.006,
          surface: SurfaceType.SYNTHETIC,
          isActive: true,
          location: 'Location',
          ownerId: 'owner-1',
          reviews: [{ rating: 5 }, { rating: 4 }],
          createdAt: new Date(),
        },
        {
          id: 'court-2',
          name: 'Court B',
          price: 60,
          lat: 40.7128,
          lng: -74.006,
          surface: SurfaceType.NATURAL,
          isActive: true,
          location: 'Location',
          ownerId: 'owner-2',
          reviews: [{ rating: 3 }],
          createdAt: new Date(),
        },
      ];

      prisma.court.findMany.mockResolvedValue(mockCourts);

      const result = await service.findTopRated();

      expect(result[0].name).toEqual('Court A');
      expect(result[0].avgRating).toEqual(4.5);
      expect(result[1].avgRating).toEqual(3);
    });
  });
});
