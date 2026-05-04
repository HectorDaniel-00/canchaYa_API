jest.mock('src/generated/prisma/client', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError {
      code: string;
      meta?: { target?: string };
      constructor(code: string) {
        this.code = code;
      }
    },
  },
}));

import { PrismaExceptionFilter } from './prisma-exception.filter';

describe('PrismaExceptionFilter', () => {
  it('should be defined', () => {
    expect(new PrismaExceptionFilter()).toBeDefined();
  });
});
