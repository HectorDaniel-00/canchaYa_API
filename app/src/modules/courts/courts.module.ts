import { Module } from '@nestjs/common';
import { CourtsService } from './courts.service';
import { CourtsController } from './courts.controller';
import { PrismaModule } from '../../config/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CourtsController],
  providers: [CourtsService],
})
export class CourtsModule {}
