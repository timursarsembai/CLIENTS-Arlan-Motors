/**
 * Парсер моделей по марке.
 * Источник: https://www.kolesa.kz/cars/[slug]/
 *
 * Возвращает массив объектов:
 * [{ brand: 'Toyota', slug: 'toyota', model: 'Camry', modelSlug: 'camry' }, ...]
 */

import * as cheerio from 'cheerio';
import { fetchPage, delay } from '../client.js';
import { load as loadData } from '../utils/storage.js';

/**
 * Парсит модели одной марки.
 * @param {{ name: string, slug: string }} brand
 * @returns {Promise<Array<{ brand: string, slug: string, model: string, modelSlug: string }>>}
 */
export async function scrapeModelsForBrand({ name, slug }) {
  const html = await fetchPage(`/cars/${slug}/`);
  const $ = cheerio.load(html);

  const models = [];

  // Модели — ссылки вида /cars/toyota/camry/ (3 сегмента пути)
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    if (!text || !href) return;

    const match = href.match(new RegExp(`^\\/cars\\/${slug}\\/([a-z0-9][a-z0-9-]+)\\/?$`));
    if (!match) return;

    const modelSlug = match[1];
    // Убираем технические страницы
    if (['new', 'used', 'all'].includes(modelSlug)) return;

    // Убираем дубли (одна модель может присутствовать несколько раз на странице)
    if (!models.find(m => m.modelSlug === modelSlug)) {
      models.push({ brand: name, slug, model: text, modelSlug });
    }
  });

  return models;
}

/**
 * Парсит модели для всех марок.
 * @param {Array<{ name: string, slug: string }>} brands — список из scrapeBrands()
 * @param {{ delayMs?: number, onProgress?: Function }} opts
 * @returns {Promise<Array>}
 */
export async function scrapeAllModels(brands, { delayMs = 700, onProgress } = {}) {
  const all = [];

  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    const prefix = `  [${i + 1}/${brands.length}] ${brand.name}`;

    try {
      const models = await scrapeModelsForBrand(brand);
      all.push(...models);
      console.log(`${prefix} — ${models.length} моделей`);
      if (onProgress) onProgress({ brand, models, index: i, total: brands.length });
    } catch (err) {
      console.warn(`${prefix} — ОШИБКА: ${err.message}`);
    }

    // Пауза между запросами чтобы не получить бан
    if (i < brands.length - 1) await delay(delayMs);
  }

  return all;
}

/**
 * Конвертирует результат scrapeAllModels в формат для Arlan Motors:
 * [{ brand, model }] → объект { 'Toyota': ['Camry', ...], ... }
 * @param {Array} rows
 */
export function toCarData(rows) {
  const result = {};
  for (const { brand, model } of rows) {
    if (!result[brand]) result[brand] = [];
    if (!result[brand].includes(model)) result[brand].push(model);
  }
  return result;
}

/**
 * Конвертирует в плоский массив — формат исходного json.json Arlan Motors.
 * @param {Array} rows
 */
export function toFlatArray(rows) {
  return rows.map(({ brand, model }) => ({ brand, model }));
}
