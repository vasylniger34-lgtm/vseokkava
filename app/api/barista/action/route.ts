import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateTelegramWebAppData, parseTelegramInitData } from '@/lib/telegram';

export async function POST(request: Request) {
  try {
    const { initData, action, targetUserId, amount = 1 } = await request.json();
    const botToken = process.env.BOT_TOKEN;

    if (!botToken || !validateTelegramWebAppData(initData, botToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tgUser = parseTelegramInitData(initData);
    const baristaTelegramId = tgUser.id.toString();

    const barista = await prisma.user.findUnique({
      where: { telegramId: baristaTelegramId },
    });

    if (!barista || (barista.role !== 'BARISTA' && barista.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const settings = await prisma.settings.findUnique({ where: { id: 'default' } }) || { coffeesNeeded: 7 };

    if (action === 'ADD_COFFEE') {
      const newBalance = targetUser.balance + amount;
      const freeGained = Math.floor(newBalance / settings.coffeesNeeded);
      const remainingBalance = newBalance % settings.coffeesNeeded;

      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: {
          balance: remainingBalance,
          totalCoffees: { increment: amount },
          freeCoffees: { increment: freeGained },
        },
      });

      await prisma.transaction.create({
        data: {
          userId: targetUserId,
          baristaId: barista.id,
          type: 'ADD_COFFEE',
          amount,
        },
      });

      return NextResponse.json({ 
        success: true, 
        user: updatedUser,
        newBalance: remainingBalance, 
        freeGained 
      });
    } else if (action === 'REDEEM_FREE') {
      if (targetUser.freeCoffees < 1) {
        return NextResponse.json({ error: 'No free coffees available' }, { status: 400 });
      }

      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: {
          freeCoffees: { decrement: 1 },
        },
      });

      await prisma.transaction.create({
        data: {
          userId: targetUserId,
          baristaId: barista.id,
          type: 'REDEEM_FREE',
          amount: 1,
        },
      });

      return NextResponse.json({ success: true, user: updatedUser });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Barista action error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
