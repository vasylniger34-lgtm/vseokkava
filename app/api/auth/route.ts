import { NextResponse } from 'next/server';
import { validateTelegramWebAppData, parseTelegramInitData } from '@/lib/telegram';
import { prisma } from '@/lib/db';

const OWNER_USERNAME = 'wire_code';

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
    const tgUsername = tgUser.username?.toLowerCase() || null;
    const isOwner = tgUsername === OWNER_USERNAME.toLowerCase();

    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          username: tgUsername,
          name: tgUser.first_name || 'Гість',
          shortCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          role: isOwner ? 'OWNER' : 'CLIENT',
        },
      });
    } else {
      // Sync username and owner role
      const updateData: any = {};
      if (tgUsername && user.username !== tgUsername) {
        updateData.username = tgUsername;
      }
      if (isOwner && user.role !== 'OWNER') {
        updateData.role = 'OWNER';
      }
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { telegramId },
          data: updateData,
        });
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
