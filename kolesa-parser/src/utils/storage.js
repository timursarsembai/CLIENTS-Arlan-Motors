/**
 * Утилиты для сохранения и загрузки данных.
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(import.meta.dirname, '../../data');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Сохраняет данные в JSON файл в папке /data.
 * @param {string} filename  — например 'brands.json'
 * @param {any} data
 */
export function save(filename, data) {
  ensureDir(DATA_DIR);
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ Сохранено: data/${filename} (${Array.isArray(data) ? data.length + ' записей' : 'объект'})`);
  return filepath;
}

/**
 * Загружает JSON из /data. Возвращает null если файл не найден.
 * @param {string} filename
 */
export function load(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}
