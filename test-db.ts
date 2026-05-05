import { prisma } from './lib/db.js';

async function test() {
  try {
    console.log('Testing DB connection...');
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Connection successful! Users found:', users.length);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
