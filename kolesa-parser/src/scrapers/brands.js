/**
 * Парсер списка марок.
 *
 * Стратегия: kolesa.kz не имеет отдельной страницы с марками.
 * На главной странице марки смешаны с городами и навигацией.
 * Используем проверенный список слагов (получен анализом сайта),
 * и обогащаем его русским именем марки с главной страницы.
 */

import * as cheerio from 'cheerio';
import { fetchPage } from '../client.js';

// Полный список слагов марок с kolesa.kz (обновлено 2025-06)
const KNOWN_SLUGS = [
  'acura','aito','alfa-romeo','alpina','aston-martin','audi','avatr','aurus',
  'baic','bajaj','baojun','baw','bentley','bmw','borgward','brilliance','bugatti','buick','byd',
  'cadillac','changan','chery','chevrolet','chrysler','citroen','cupra',
  'dacia','daewoo','daihatsu','datsun','deepal','denza','dfsk','dodge','dong-feng','ds',
  'enovate','exeed','evolute',
  'farizon','faw','ferrari','fiat','ford','forthing','foton',
  'gac','geely','geely-galaxy','genesis','gmc','great-wall',
  'hafei','haima','haval','hiphi','honda','hongqi','hozon','hummer','hyundai',
  'icar','im','infiniti','iran-khodro','isuzu',
  'jac','jaecoo','jaguar','jeep','jetour','jetta','jin-bei','jiyue','jmc',
  'kaiyi','karry','kia',
  'lamborghini','land-rover','leapmotor','leopaard','lexus','li','lifan','lincoln','livan','lotus','lucid','lynk-and-co',
  'maserati','maxus','maybach','mazda','mclaren','mercedes-benz','mercedes-maybach','mg','mini','mitsubishi',
  'nio','nissan',
  'omoda','opel','ora',
  'peugeot','polar-stone','polestar','porsche','proton',
  'radar','ram','ravon','renault','rivian','roewe','rolls-royce','rover','rox',
  'saab','samsung','scion','seat','seres','skoda','smart','soueast','ssang-yong','subaru','suzuki',
  'tank','tesla','toyota',
  'vinfast','volkswagen','volvo','voyah',
  'weltmeister','wey','wuling',
  'xiaomi','xpeng',
  'yema',
  'zeekr','zotye','zx',
  // Российские / советские
  'vaz','gaz','uaz','moskvich','tagaz','ij','luaz','raf','zaz','vis',
];

// Словарь slug → читаемое имя (для марок где slug отличается от имени)
const SLUG_TO_NAME = {
  'samsung':      'Renault Samsung',
  'ssang-yong':   'SsangYong',
  'dong-feng':    'DongFeng',
  'lynk-and-co':  'Lynk & Co',
  'jin-bei':      'JinBei',
  'geely-galaxy': 'Geely Galaxy',
  'vaz':          'ВАЗ (Lada)',
  'gaz':          'ГАЗ',
  'uaz':          'УАЗ',
  'moskvich':     'Москвич',
  'tagaz':        'ТагАЗ',
  'ij':           'ИЖ',
  'luaz':         'ЛуАЗ',
  'raf':          'РАФ',
  'zaz':          'ЗАЗ',
  'vis':          'ВИС',
};

/**
 * Возвращает список марок.
 * Имена берём со страницы /cars/ если найдём совпадение по slug,
 * иначе генерируем из slug.
 * @returns {Promise<Array<{ name: string, slug: string }>>}
 */
export async function scrapeBrands() {
  console.log('→ Загружаю список марок...');

  // Пробуем обогатить имена с главной страницы
  const nameMap = new Map(); // slug → display name
  try {
    const html = await fetchPage('/cars/');
    const $ = cheerio.load(html);

    $('a[href]').each((_, el) => {
      const href  = $(el).attr('href') || '';
      const text  = $(el).text().trim();
      if (!text) return;

      // /cars/toyota  или  /cars/toyota/
      const match = href.match(/^\/cars\/([a-z0-9][a-z0-9-]+)\/?$/);
      if (!match) return;
      const slug = match[1];
      if (KNOWN_SLUGS.includes(slug) && !nameMap.has(slug)) {
        nameMap.set(slug, text);
      }
    });
  } catch (err) {
    console.warn(`  Не удалось обогатить имена: ${err.message}`);
  }

  const result = KNOWN_SLUGS.map(slug => {
    const name =
      SLUG_TO_NAME[slug] ||
      nameMap.get(slug) ||
      slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return { name, slug };
  });

  console.log(`  Марок: ${result.length}`);
  return result;
}
