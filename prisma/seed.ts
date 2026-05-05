import { prisma } from '../src/lib/db.js';

async function main() {
  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      coffeesNeeded: 7,
      trigger6Coffees: 'У вас майже безкоштовна кава! Залишилося ще трохи.',
      triggerFree: 'Вітаємо! У вас є 1 безкоштовна кава!',
      reminderText: 'Давно не бачились! Заходьте до нас на каву.',
    },
  });

  console.log('Seeded settings:', settings);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Adapter/pool will close on process exit or we can manually close if needed
  });
