import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        const dbUrl = process.env.DATABASE_URL || '';
        // The instruction implies a broader SSL/TLS bypass should be handled at a higher level (e.g., main.ts)
        // by setting process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'.
        // However, the direct modification to PrismaService's constructor for SSL handling remains.
        const isSupabase = dbUrl.includes('supabase');
        const pool = new Pool({ 
            connectionString: dbUrl,
            ssl: isSupabase ? { rejectUnauthorized: false } : false
        });
        const adapter = new PrismaPg(pool);
        super({ adapter });
    }
    async onModuleInit() {
        await this.$connect();
    }
}
