import { Bot, Keyboard } from 'grammy';
import { prisma } from '../lib/db.js';
import * as dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN is missing');

// Owner username (without @)
const OWNER_USERNAME = 'wire_code';

const bot = new Bot(token);

function generateShortCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

bot.command('start', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;

  const tgUsername = ctx.from?.username?.toLowerCase() || null;
  console.log(`/start from ${telegramId} (@${tgUsername})`);

  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { telegramId },
    });

    // Determine role
    const isOwner = tgUsername === OWNER_USERNAME.toLowerCase();

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          username: tgUsername,
          shortCode: generateShortCode(),
          name: ctx.from?.first_name || 'Гість',
          role: isOwner ? 'OWNER' : 'CLIENT',
        },
      });
    } else {
      // Update username and role if needed
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
  } catch (error) {
    console.error('Database error in /start:', error);
  }

  const webAppUrl = (process.env.NEXT_PUBLIC_WEBAPP_URL || 'https://vseokkava.vercel.app') + '/card';

  await ctx.reply(`👋 Вітаємо у **VseOkKava**! ☕️\n\nНатисніть кнопку нижче, щоб відкрити додаток.`, {
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

  if (user && !user.phone) {
    await ctx.reply('📱 Поділіться номером телефону для бонусів:', {
      reply_markup: new Keyboard().requestContact('Поділитися контактом').resized().oneTime(),
    });
  }
});

bot.command('ping', (ctx) => ctx.reply('Pong! 🏓'));

bot.on('message:contact', async (ctx) => {
  const contact = ctx.message.contact;
  const telegramId = ctx.from?.id.toString();

  if (contact && telegramId) {
    try {
      await prisma.user.update({
        where: { telegramId },
        data: { phone: contact.phone_number },
      });
      await ctx.reply('✅ Номер збережено!', {
        reply_markup: { remove_keyboard: true },
      });
    } catch (error) {
      console.error('Database error in contact handler:', error);
      await ctx.reply('⚠️ Помилка при збереженні. Спробуйте пізніше.');
    }
  }
});

bot.catch((err) => {
  console.error('GrammY error:', err);
});

console.log('Bot is starting...');
bot.start().catch(err => {
  console.error('Failed to start bot:', err);
});
