# kolesa-parser

Парсер сайта kolesa.kz. Требует Node.js 18+.

## Установка

```bash
npm install
```

## Команды

| Команда | Что делает |
|---|---|
| `npm run all` | Парсит марки + модели (один прогон) |
| `npm run brands` | Только список марок → `data/brands.json` |
| `npm run models` | Только модели (нужен `brands.json`) → `data/models-flat.json` |
| `npm run listings` | Объявления (в разработке) |

## Структура проекта

```
src/
├── index.js           — CLI точка входа
├── client.js          — HTTP клиент (задержки, retry)
├── scrapers/
│   ├── brands.js      — парсер списка марок
│   ├── models.js      — парсер моделей
│   └── listings.js    — парсер объявлений (заготовка)
└── utils/
    └── storage.js     — сохранение/загрузка JSON
data/                  — результаты парсинга (в .gitignore)
```

## Выходные файлы

- `data/brands.json` — `[{ name, slug }]`
- `data/models-flat.json` — `[{ brand, model }]` — готово для использования в Arlan Motors

## Использование результата в Arlan Motors

Скопировать `data/models-flat.json` в:
```
Arlan Motors/project/cars archive/json.json
```

## Расширение: парсинг объявлений

Смотри `src/scrapers/listings.js` — заготовка с комментариями по URL паттернам.

URL фильтров:
- `/cars/` — все
- `/cars/toyota/` — по марке
- `/cars/toyota/camry/` — по марке + модели
- `/cars/toyota/camry/?year-from=2015&price-to=10000000` — с фильтрами
