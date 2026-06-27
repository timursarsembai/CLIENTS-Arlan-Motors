/**
 * HTTP-клиент с задержкой и повторными попытками.
 * Все запросы к kolesa.kz проходят через этот модуль.
 */

const BASE_URL = 'https://www.kolesa.kz';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
};

/**
 * @param {number} ms
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Загружает страницу с повторными попытками при ошибке.
 * @param {string} path  — путь от BASE_URL, например '/cars/toyota/'
 * @param {{ retries?: number, delayMs?: number }} opts
 * @returns {Promise<string>} HTML страницы
 */
export async function fetchPage(path, { retries = 3, delayMs = 800 } = {}) {
  const url = path.startsWith('http') ? path : BASE_URL + path;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = delayMs * attempt;
      console.warn(`  [retry ${attempt}/${retries}] ${err.message} — жду ${wait}ms`);
      await delay(wait);
    }
  }
}
