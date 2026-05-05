import { Bot, Keyboard } from 'grammy';
import { prisma } from '../src/lib/db.js';
import * as dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN is missing');

const bot = new Bot(token);

// Helper to generate short code
function generateShortCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

bot.command('start', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;

  let user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        shortCode: generateShortCode(),
        name: ctx.from?.first_name || 'Гість',
      },
    });
  }

  const webAppUrl = process.env.NEXT_PUBLIC_WEBAPP_URL || 'https://vseokkava.vercel.app';

  await ctx.reply(`👋 Вітаємо у **VseOkKava**! ☕️\n\nЦе ваша картка лояльності. Натисніть кнопку нижче, щоб відкрити додаток, переглянути баланс та отримати безкоштовну каву!`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '☕️ Відкрити Картку',
            web_app: { url: webAppUrl },
          },
        ],
      ],
    },
  });

  // If phone is missing, ask for it
  if (!user.phone) {
    await ctx.reply('📱 Будь ласка, поділіться номером телефону, щоб ми могли нараховувати вам бонуси.', {
      reply_markup: new Keyboard().requestContact('Поділитися контактом').resized().oneTime(),
    });
  }
});

bot.on('message:contact', async (ctx) => {
  const contact = ctx.message.contact;
  const telegramId = ctx.from?.id.toString();

  if (contact && telegramId) {
    await prisma.user.update({
      where: { telegramId },
      data: { phone: contact.phone_number },
    });

    await ctx.reply('✅ Дякуємо! Ваш номер збережено. Тепер ви можете користуватися програмою лояльності.', {
      reply_markup: { remove_keyboard: true },
    });
  }
});

console.log('Bot is starting...');
bot.start();
