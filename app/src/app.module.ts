import { Module } from '@nestjs/common';
import { PrismaModule } from './config/prisma/prisma.module.js';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
