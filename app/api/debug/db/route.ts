import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Пробуємо просто пінганути базу
    await prisma.$queryRaw`SELECT 1`;
    
    // Пробуємо порахувати користувачів
    const count = await prisma.user.count();
    
    return NextResponse.json({ 
      status: 'ok', 
      database: 'connected',
      userCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Debug DB error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message,
      code: error.code,
      stack: error.stack,
      env_check: {
        has_url: !!process.env.DATABASE_URL,
        url_start: process.env.DATABASE_URL?.substring(0, 20) + '...'
      }
    }, { status: 500 });
  }
}
