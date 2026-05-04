import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../../generated/prisma/client.js', () => ({
  PrismaClient: class MockPrismaClient {
    $connect = jest.fn();
    $disconnect = jest.fn();
  },
}));

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
