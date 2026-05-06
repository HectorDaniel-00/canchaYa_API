import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCourtDto, ResponseCourtDto, UpdateCourtDto } from './dto';
import { PrismaService } from '../../config/prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { SurfaceType } from '../../common/enums/surface.enum';

interface FindAllParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  surface?: SurfaceType;
  minPrice?: number;
  maxPrice?: number;
  ownerId?: string;
  location?: string;
}

@Injectable()
export class CourtsService {
  private readonly logger = new Logger(CourtsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCourtDto): Promise<ResponseCourtDto> {
    try {
      const court = await this.prisma.court.create({
        data: {
          ...data,
          price: parseFloat(data.price),
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng),
        },
      });
      return plainToInstance(ResponseCourtDto, court, {
        excludeExtraneousValues: true,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error creating court: ${message}`);
      const code =
        error instanceof Error && 'code' in error
          ? (error as Record<string, string>).code
          : null;
      if (code === 'P2002') {
        throw new BadRequestException('Ya existe una cancha con esos datos');
      }
      throw new BadRequestException('Error al crear la cancha');
    }
  }

  async findAll(params: FindAllParams = {}) {
    const {
      page = 1,
      limit = 10,
      isActive,
      surface,
      minPrice,
      maxPrice,
      ownerId,
      location,
    } = params;

    const skip = (page - 1) * limit;

    const where = {
      ...(isActive !== undefined && { isActive }),
      ...(surface && { surface }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(ownerId && { ownerId }),
      ...(location && {
        location: { contains: location, mode: 'insensitive' as const },
      }),
    };

    const [courts, total] = await Promise.all([
      this.prisma.court.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: {
            select: { timeSlots: true, bookings: true, reviews: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.court.count({ where }),
    ]);

    return {
      data: courts.map((court) =>
        plainToInstance(ResponseCourtDto, court, {
          excludeExtraneousValues: true,
        }),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<
    ResponseCourtDto & {
      owner: { id: string; name: string; email: string };
      counts: { timeSlots: number; bookings: number; reviews: number };
    }
  > {
    const court = await this.prisma.court.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { timeSlots: true, bookings: true, reviews: true } },
      },
    });

    if (!court) {
      throw new NotFoundException(`Cancha con ID ${id} no encontrada`);
    }

    const { _count, ...rest } = court;

    return {
      ...plainToInstance(ResponseCourtDto, rest, {
        excludeExtraneousValues: true,
      }),
      owner: court.owner,
      counts: _count,
    };
  }

  async update(id: string, updateCourtDto: UpdateCourtDto) {
    const court = await this.prisma.court.findUnique({ where: { id } });

    if (!court) {
      throw new NotFoundException(`Cancha con ID ${id} no encontrada`);
    }

    try {
      const { price, lat, lng, ...rest } = updateCourtDto;
      const updated = await this.prisma.court.update({
        where: { id },
        data: {
          ...rest,
          ...(price && { price: parseFloat(price) }),
          ...(lat && { lat: parseFloat(lat) }),
          ...(lng && { lng: parseFloat(lng) }),
        },
      });

      return plainToInstance(ResponseCourtDto, updated, {
        excludeExtraneousValues: true,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error updating court ${id}: ${message}`);
      throw new BadRequestException('Error al actualizar la cancha');
    }
  }

  async remove(id: string) {
    const court = await this.prisma.court.findUnique({ where: { id } });

    if (!court) {
      throw new NotFoundException(`Cancha con ID ${id} no encontrada`);
    }

    await this.prisma.court.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: `Cancha con ID ${id} desactivada correctamente` };
  }

  async findActive(page = 1, limit = 10) {
    return this.findAll({ isActive: true, page, limit });
  }

  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    page = 1,
    limit = 10,
  ) {
    if (minPrice > maxPrice) {
      throw new BadRequestException(
        'El precio mínimo no puede ser mayor al máximo',
      );
    }
    return this.findAll({ minPrice, maxPrice, page, limit });
  }

  async findBySurface(surface: SurfaceType, page = 1, limit = 10) {
    return this.findAll({ surface, page, limit });
  }

  async findByOwner(ownerId: string, page = 1, limit = 10) {
    return this.findAll({ ownerId, page, limit });
  }

  async findByLocation(location: string, page = 1, limit = 10) {
    return this.findAll({ location, page, limit });
  }

  async findWithAvailability() {
    const courts = await this.prisma.court.findMany({
      where: {
        isActive: true,
        timeSlots: {
          some: { isBooked: false },
        },
      },
      include: {
        timeSlots: {
          where: { isBooked: false },
          orderBy: { startTime: 'asc' },
          take: 10,
        },
      },
      take: 20,
    });

    return courts.map((court) =>
      plainToInstance(ResponseCourtDto, court, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findTopRated(limit = 10) {
    const courts = await this.prisma.court.findMany({
      where: { isActive: true, reviews: { some: {} } },
      include: {
        reviews: {
          select: { rating: true },
        },
      },
    });

    const courtsWithAvg = courts.map((court) => {
      const avgRating =
        court.reviews.reduce((sum, r) => sum + r.rating, 0) /
        court.reviews.length;
      return {
        ...plainToInstance(ResponseCourtDto, court, {
          excludeExtraneousValues: true,
        }),
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: court.reviews.length,
      };
    });

    return courtsWithAvg
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, limit);
  }
}
