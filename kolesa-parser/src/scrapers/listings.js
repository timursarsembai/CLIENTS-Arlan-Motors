/**
 * Парсер объявлений (заготовка для будущего развития).
 *
 * URL паттерны:
 *   Все объявления:          /cars/
 *   По марке:                /cars/toyota/
 *   По марке + модели:       /cars/toyota/camry/
 *   С фильтрами (GET):       /cars/toyota/camry/?year-from=2015&price-to=10000000
 *
 * Структура объявления на странице (предварительно, уточнить при реализации):
 *   .listing-item            — карточка объявления
 *   .listing-item__title     — название
 *   .listing-item__price     — цена
 *   .listing-item__year      — год
 *   .listing-item__mileage   — пробег
 *   .listing-item__location  — город
 */

import * as cheerio from 'cheerio';
import { fetchPage, delay } from '../client.js';

/**
 * Парсит страницу с объявлениями.
 * @param {string} path  — путь, например '/cars/toyota/camry/'
 * @param {Object} params — GET параметры фильтра
 * @returns {Promise<{ listings: Array, totalPages: number }>}
 */
export async function scrapeListingsPage(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  const fullPath = query ? `${path}?${query}` : path;

  const html = await fetchPage(fullPath);
  const $ = cheerio.load(html);

  // TODO: уточнить селекторы после изучения реальной страницы
  const listings = [];

  $('.listing-item, [class*="list-item"], [class*="offer"]').each((_, el) => {
    const title    = $(el).find('[class*="title"]').first().text().trim();
    const price    = $(el).find('[class*="price"]').first().text().trim();
    const year     = $(el).find('[class*="year"]').first().text().trim();
    const mileage  = $(el).find('[class*="mileage"], [class*="km"]').first().text().trim();
    const location = $(el).find('[class*="location"], [class*="city"]').first().text().trim();
    const href     = $(el).find('a').first().attr('href') || '';

    if (title) {
      listings.push({ title, price, year, mileage, location, url: href });
    }
  });

  // TODO: найти селектор пагинации
  const totalPages = 1;

  return { listings, totalPages };
}

/**
 * Парсит все страницы объявлений по фильтру.
 * @param {string} path
 * @param {Object} params
 * @param {{ delayMs?: number, maxPages?: number }} opts
 */
export async function scrapeAllListings(path, params = {}, { delayMs = 1000, maxPages = 50 } = {}) {
  const all = [];

  const { listings: first, totalPages } = await scrapeListingsPage(path, params);
  all.push(...first);
  console.log(`  Страница 1/${Math.min(totalPages, maxPages)}: ${first.length} объявлений`);

  const pages = Math.min(totalPages, maxPages);
  for (let page = 2; page <= pages; page++) {
    await delay(delayMs);
    const { listings } = await scrapeListingsPage(path, { ...params, page });
    all.push(...listings);
    console.log(`  Страница ${page}/${pages}: ${listings.length} объявлений`);
  }

  return all;
}
