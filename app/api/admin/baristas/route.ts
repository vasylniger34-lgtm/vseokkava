import { NextResponse } from 'next/server';
import { validateTelegramWebAppData, parseTelegramInitData } from '@/lib/telegram';
import { prisma } from '@/lib/db';

const OWNER_USERNAME = 'wire_code';

// GET — list all baristas
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const initData = searchParams.get('initData') || '';
    const botToken = process.env.BOT_TOKEN;

    if (!botToken || !validateTelegramWebAppData(initData, botToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tgUser = parseTelegramInitData(initData);
    if (tgUser.username?.toLowerCase() !== OWNER_USERNAME.toLowerCase()) {
      return NextResponse.json({ error: 'Only owner can access this' }, { status: 403 });
    }

    const baristas = await prisma.user.findMany({
      where: { role: 'BARISTA' },
      select: { id: true, username: true, name: true, telegramId: true, createdAt: true },
    });

    return NextResponse.json({ baristas });
  } catch (error) {
    console.error('Admin baristas GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST — add barista by username
export async function POST(request: Request) {
  try {
    const { initData, username } = await request.json();
    const botToken = process.env.BOT_TOKEN;

    if (!botToken || !validateTelegramWebAppData(initData, botToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tgUser = parseTelegramInitData(initData);
    if (tgUser.username?.toLowerCase() !== OWNER_USERNAME.toLowerCase()) {
      return NextResponse.json({ error: 'Only owner can do this' }, { status: 403 });
    }

    const cleanUsername = username.replace('@', '').toLowerCase().trim();
    if (!cleanUsername) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Find user by username
    const targetUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (!targetUser) {
      return NextResponse.json({ error: `Користувач @${cleanUsername} не знайдений. Він має спочатку запустити бота.` }, { status: 404 });
    }

    if (targetUser.role === 'OWNER') {
      return NextResponse.json({ error: 'Не можна змінити роль власника' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { username: cleanUsername },
      data: { role: 'BARISTA' },
    });

    return NextResponse.json({ success: true, user: { id: updated.id, username: updated.username, name: updated.name } });
  } catch (error) {
    console.error('Admin baristas POST error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE — remove barista (set back to CLIENT)
export async function DELETE(request: Request) {
  try {
    const { initData, userId } = await request.json();
    const botToken = process.env.BOT_TOKEN;

    if (!botToken || !validateTelegramWebAppData(initData, botToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tgUser = parseTelegramInitData(initData);
    if (tgUser.username?.toLowerCase() !== OWNER_USERNAME.toLowerCase()) {
      return NextResponse.json({ error: 'Only owner can do this' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: 'CLIENT' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin baristas DELETE error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
