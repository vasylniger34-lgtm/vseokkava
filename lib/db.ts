import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL!;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  console.log('Initializing Prisma with connection string (masked):', connectionString.replace(/:[^:@/]+@/, ':***@'));
  
  const pool = new pg.Pool({ 
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: { rejectUnauthorized: false } // Додаємо SSL для Supabase
  });
  
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ 
    adapter,
    log: ['error', 'warn']
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
