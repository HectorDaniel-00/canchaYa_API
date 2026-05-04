import { ConflictException, Injectable, Logger } from '@nestjs/common';
import {
  CreateUserDto,
  ResponseUserDto,
  UpdateUserDto,
  UpdateUserPasswordDto,
  FindUsersDto,
} from './dto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly saltRound = 10;

  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto): Promise<ResponseUserDto> {
    const { password, ...rest } = data;

    const passwordHashed = await bcrypt.hash(password, this.saltRound);

    try {
      const user = await this.prisma.user.create({
        data: {
          ...rest,
          password: passwordHashed,
        },
      });

      return plainToInstance(ResponseUserDto, user, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('El email o teléfono ya está registrado');
      }
      throw error;
    }
  }

  async findAll(query: FindUsersDto): Promise<{
    data: ResponseUserDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, name, email, role } = query;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) =>
        plainToInstance(ResponseUserDto, user, {
          excludeExtraneousValues: true,
        }),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ResponseUserDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async findOneByEmail(email: string): Promise<ResponseUserDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<ResponseUserDto> {
    await this.prisma.user.findUniqueOrThrow({ where: { id } });

    const updateData: any = { ...data };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, this.saltRound);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      return plainToInstance(ResponseUserDto, user, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'El email o teléfono ya está en uso por otro usuario',
        );
      }
      throw error;
    }
  }

  async updatePassword(
    id: string,
    data: UpdateUserPasswordDto,
  ): Promise<ResponseUserDto> {
    await this.prisma.user.findUniqueOrThrow({ where: { id } });

    const passwordHashed = await bcrypt.hash(data.password, this.saltRound);

    const user = await this.prisma.user.update({
      where: { id },
      data: { password: passwordHashed },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    return plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string): Promise<ResponseUserDto> {
    await this.prisma.user.findUniqueOrThrow({ where: { id } });

    const deactivated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    return plainToInstance(ResponseUserDto, deactivated, {
      excludeExtraneousValues: true,
    });
  }

  async restore(id: string): Promise<ResponseUserDto> {
    await this.prisma.user.findUniqueOrThrow({ where: { id } });

    const restored = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    return plainToInstance(ResponseUserDto, restored, {
      excludeExtraneousValues: true,
    });
  }
}
