import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL!;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Створюємо пул з'єднань через стандартний драйвер pg
  const pool = new pg.Pool({ connectionString });
  
  // Використовуємо адаптер для Prisma 7
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
