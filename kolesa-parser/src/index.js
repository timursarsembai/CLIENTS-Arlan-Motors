/**
 * CLI точка входа.
 *
 * Использование:
 *   node src/index.js brands        — парсит и сохраняет список марок
 *   node src/index.js models        — парсит модели (нужен brands.json)
 *   node src/index.js all           — brands + models за один прогон
 *   node src/index.js listings      — (в разработке) парсит объявления
 */

import { scrapeBrands }    from './scrapers/brands.js';
import { scrapeAllModels, toFlatArray } from './scrapers/models.js';
import { save, load }      from './utils/storage.js';

const command = process.argv[2] || 'all';

async function runBrands() {
  const brands = await scrapeBrands();
  save('brands.json', brands);
  return brands;
}

async function runModels(brands) {
  if (!brands) {
    brands = load('brands.json');
    if (!brands) {
      console.error('✗ Нет brands.json — сначала запустите: npm run brands');
      process.exit(1);
    }
  }

  console.log(`→ Парсю модели для ${brands.length} марок...`);
  const accumulated = [];
  const rows = await scrapeAllModels(brands, {
    onProgress({ models }) {
      accumulated.push(...models);
      save('models-flat.json', toFlatArray(accumulated));
    },
  });

  save('models-flat.json', toFlatArray(rows));
  console.log('✓ Готово!');
  return rows;
}

async function main() {
  console.log(`\n=== kolesa-parser | команда: ${command} ===\n`);
  const start = Date.now();

  try {
    if (command === 'brands') {
      await runBrands();

    } else if (command === 'models') {
      await runModels();

    } else if (command === 'all') {
      const brands = await runBrands();
      await runModels(brands);

    } else if (command === 'listings') {
      console.log('⚠ Парсер объявлений пока в разработке.');
      console.log('  Смотри: src/scrapers/listings.js');

    } else {
      console.error(`✗ Неизвестная команда: ${command}`);
      console.log('  Доступные команды: brands | models | all | listings');
      process.exit(1);
    }
  } catch (err) {
    console.error(`\n✗ Ошибка: ${err.message}`);
    process.exit(1);
  }

  const sec = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n⏱ Время: ${sec}s`);
}

main();
