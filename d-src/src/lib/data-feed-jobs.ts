// Дані стрічки й вакансій для етапу 4 (вигадані, як у lib/data.ts). Реальних даних немає.
import { FLEET_EMPTY, type FleetValue } from '@/components/app/fleet-picker'
import { JOBS, type Job } from './data'
import type { ApplicationStatus } from './data-web'

/* ---------- вакансії ---------- */

// Ще дві вакансії до спільних JOBS: оплата за день і контракт у тижнях — щоб фільтри й сортування було на чому показати.
const MORE_JOBS: Job[] = [
  { t: '3rd Engineer', sal: '$4 800 / мес', ship: 'Car Carrier', board: '15.01.2027', dur: '5 ±1 мес', co: 'Fjord Line Crewing', lg: 'FL', ago: '3 д назад', tags: [],
    vessel: [['Судно', 'MV Northern Lane'], ['Флаг', 'Norway'], ['Автомобилей', '6 500'], ['Построено', '2019']],
    req: [['Английский — хороший (B1+)', true], ['Диплом 3rd Engineer (III/1)', true], ['Действующий медосмотр', true]],
    desc: 'Автовоз на линии Северная Европа — Средиземное море. Смена экипажа в Бремерхафене.' },
  { t: '2nd Engineer', sal: '$6 800 / мес', ship: 'Bulk Carrier', board: '10.01.2027', dur: '6 мес', co: 'Harbor Crew Agency', lg: 'HC', ago: '4 д назад', tags: [],
    vessel: [['Судно', 'MV Grey Heron'], ['Флаг', 'Cyprus'], ['DWT', '58 000'], ['Построено', '2012']],
    req: [['Английский — хороший (B1+)', true], ['Диплом 2nd Engineer (III/2)', false], ['Опыт на Bulk Carrier от 12 мес', false]],
    desc: 'Балкер на линии Средиземное море — Западная Африка. Смена экипажа в Пирее.' },
  { t: '3rd Engineer', sal: '$170 / день', ship: 'PSV', board: '28.12.2026', dur: '4 недели', co: 'North Sea Offshore Crew', lg: 'NO', ago: '5 д назад', tags: [],
    vessel: [['Судно', 'PSV Skagen Light'], ['Флаг', 'Norway'], ['Построено', '2016']],
    req: [['Английский — хороший (B1+)', true], ['Диплом 3rd Engineer (III/1)', true], ['BOSIET', false]],
    desc: 'Офшор, ротация 4 через 4 недели. Вертолёт с базы в Абердине.' },
]

/** Вакансії застосунку: спільні JOBS + свої. Порядок — від нових до старих (за датою публікації). */
export const FJ_JOBS: Job[] = [...JOBS, ...MORE_JOBS]

// Що потрібно фільтрам і чого немає в Job: флот, регіон роботи, контракт у тижнях. Індекси — як у FJ_JOBS.
export const JOB_META: { fleet: string; dep: string; region: string; weeks: number; closed?: boolean }[] = [
  { fleet: 'Merchant', dep: 'Engine', region: 'Европа', weeks: 17 },
  { fleet: 'Merchant', dep: 'Engine', region: 'Европа', weeks: 26 },
  { fleet: 'Merchant', dep: 'Engine', region: 'ОАЭ', weeks: 17 },
  // Atlas (3) відкрита: на неї рекрутер надсилає пропозицію в «Уведомлениях» (p10).
  { fleet: 'Merchant', dep: 'Engine', region: 'ОАЭ', weeks: 22 },
  { fleet: 'Merchant', dep: 'Engine', region: 'Европа', weeks: 22 },
  // відповідь 106: закрита вакансія лишається в «Сохранённом» сірою, поки моряк сам не прибере
  { fleet: 'Merchant', dep: 'Engine', region: 'Африка', weeks: 26, closed: true },
  { fleet: 'Offshore', dep: 'Engine', region: 'Европа', weeks: 4 },
]

export const isClosed = (k: number) => !!JOB_META[k]?.closed

/** «Сохранённое» за замовчуванням: відкрита вакансія і закрита (сіра). */
export const SAVED_JOBS_DEFAULT = [0, 5]

/* ---------- мої відгуки (відповідь 98: статуси для моряка — як у рекрутера, APPLICATIONS у data-web) ---------- */

// Відгуки, що вже є: Nordline відповів (чат ns) — «Ожидание», Meridian ще ні (чат mc) — «Отправлено»,
// Harbor закрив вакансію — «Отклонено». Нові відгуки з екрана вакансії (bag job.applied) — «Отправлено».
export const MY_APPLICATIONS_DEFAULT: { job: number; status: ApplicationStatus; date: string }[] = [
  { job: 2, status: 'sent', date: '02.11.2026' },
  { job: 1, status: 'waiting', date: '30.10.2026' },
  { job: 5, status: 'rejected', date: '21.10.2026' },
]

/** Перегляди вакансії (відповідь 101: лічильник показуємо). Індекси — як у FJ_JOBS. */
export const JOB_VIEWS = [214, 187, 96, 152, 63, 41, 28]

/* ---------- фільтри (правка №35, відповідь 100) ---------- */

export type Currency = '$' | '€' | '£'
export type JobFilter = {
  fleet: FleetValue
  /** «от», як ввів моряк; '' — без обмеження */
  salary: string
  cur: Currency
  per: 'month' | 'day'
  /** показувати вакансії з договірною зарплатою */
  nego: boolean
  regions: string[]
  /** тривалість контракту; '' — будь-яка */
  dur: string
  durUnit: 'month' | 'week'
}

export const REGIONS = ['Европа', 'Африка', 'ОАЭ']

export const FILTER_EMPTY: JobFilter = { fleet: FLEET_EMPTY, salary: '', cur: '$', per: 'month', nego: true, regions: [], dur: '', durUnit: 'month' }

// За замовчуванням — з профілю моряка: Merchant → Engine → 3rd Engineer, від $4 000 на місяць.
export const FILTER_DEFAULT: JobFilter = {
  ...FILTER_EMPTY,
  fleet: { fleets: ['Merchant'], department: 'Engine', positions: ['3rd Engineer'] },
  salary: '4000',
}

/* ---------- сортування (відповідь 94) ---------- */

export type SortId = 'new' | 'board' | 'salary'
export const SORTS: [SortId, string][] = [
  ['new', 'Сначала новые'],
  ['board', 'Ближайшая посадка'],
  ['salary', 'Выше зарплата'],
]

/* ---------- збережені підборки (відповіді 103–104) ---------- */

export type SavedSearch = { id: string; f: JobFilter; notify: 'daily' | 'update'; fresh: number }

export const SEARCH_LIMIT = 3
export const SEARCH_LIMIT_PREMIUM = 20

export const SEARCHES_DEFAULT: SavedSearch[] = [
  { id: 'ss1', f: FILTER_DEFAULT, notify: 'update', fresh: 2 },
  {
    id: 'ss2',
    f: { ...FILTER_EMPTY, fleet: { fleets: ['Merchant', 'Offshore'], department: 'Engine', positions: ['2nd Engineer', '3rd Engineer'] }, regions: ['Европа'] },
    notify: 'daily',
    fresh: 0,
  },
]
