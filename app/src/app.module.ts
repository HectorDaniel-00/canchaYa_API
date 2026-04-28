import { Module } from '@nestjs/common';
import { PrismaModule } from './config/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
