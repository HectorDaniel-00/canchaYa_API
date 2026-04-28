import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name)

    constructor() {
        super({
            adapter: new PrismaPg({
                connectionString: process.env.DATABASE_URL,
            })
        })
    }

    async onModuleInit() {
        try {
            await this.$connect()
            this.logger.log('✅ Database connected successfully')
        } catch (error) {
            this.logger.error('❌ Error connecting to database', error)
            throw error
        }
    }

    async onModuleDestroy() {
        try {
            await this.$disconnect()
            this.logger.log('🔌 Database disconnected successfully')
        } catch (error) {
            this.logger.error('❌ Error disconnecting database', error)
        }
    }
}