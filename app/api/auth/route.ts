import { NextResponse } from 'next/server';
import { validateTelegramWebAppData, parseTelegramInitData } from '@/lib/telegram';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();
    const botToken = process.env.BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!validateTelegramWebAppData(initData, botToken)) {
      return NextResponse.json({ error: 'Invalid authentication data' }, { status: 401 });
    }

    const tgUser = parseTelegramInitData(initData);
    const telegramId = tgUser.id.toString();

    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      // Create user if not exists (should have been created by bot, but just in case)
      user = await prisma.user.create({
        data: {
          telegramId,
          name: tgUser.first_name || 'Гість',
          shortCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
