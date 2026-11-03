// Дані — ті самі вигадані, що у вкладці C (index.html: POSTS, JOBS). Реальних даних немає.

export type Post =
  | { id: string; kind: 'news'; pin?: boolean; title: string; text: string; time: string }
  | { id: string; kind: 'user'; av: string; name: string; role: string; time: string; text: string; photo?: boolean; likes: number; comments: number }

export const POSTS: Post[] = [
  { id: 'n1', kind: 'news', pin: true, title: 'Seafolio запущен', text: 'Сфотографируйте удостоверение, диплом и CV — данные из них появятся в профиле, останется проверить. Анкету агентства потом отправите в один тап.', time: 'Закреплено' },
  { id: 'u1', kind: 'user', av: 'МП', name: 'Марко Петров', role: 'Chief Officer · Bulk Carrier', time: '2 ч', text: 'Закончил 6-месячный контракт на MV Nordic Star. Отличный экипаж, ротация по графику, зарплата вовремя. Спрашивайте о компании что угодно.', photo: true, likes: 24, comments: 6 },
  { id: 'u2', kind: 'user', av: 'ИБ', name: 'Ирина Бондарь', role: '2nd Officer · Container Ship', time: '5 ч', text: 'Кто недавно проходил медосмотр в Одессе? Посоветуйте клинику, где делают за один день и без очередей.', likes: 8, comments: 14 },
  { id: 'n2', kind: 'news', title: 'Напоминание: сроки сертификатов STCW', text: 'Проверьте даты в разделе «Документы». Мы напомним за 180, 90 и 30 дней до окончания срока.', time: 'вчера' },
  { id: 'u3', kind: 'user', av: 'ОК', name: 'Олег Коваленко', role: 'Master · Chemical Tanker', time: '2 дня', text: 'Совет молодым офицерам: держите сканы всех документов в одном месте и следите за сроками. Половина отказов — из-за просроченного сертификата.', likes: 61, comments: 9 },
]

export type Job = {
  t: string
  sal: string
  ship: string
  board: string
  dur: string
  co: string
  lg: string
  ago: string
  tags: string[]
  vessel: [string, string][]
  req: [string, boolean][]
  desc: string
}

export const JOBS: Job[] = [
  { t: '3rd Engineer', sal: '$4 200–4 600 / мес', ship: 'Chemical Tanker', board: '05.12.2026', dur: '4 ±1 мес', co: 'BlueWave Crewing', lg: 'BW', ago: '2 ч назад', tags: ['NEW'],
    vessel: [['Судно', 'MT Aurora Spirit'], ['Флаг', 'Malta'], ['DWT', '19 800'], ['Построено', '2018'], ['Главный двигатель', 'MAN B&W 6S46']],
    req: [['Английский — хороший (B1+)', true], ['Диплом 3rd Engineer (III/1)', true], ['Опыт на Chemical Tanker от 12 мес', true], ['Действующий медосмотр', true], ['Basic Safety Training (STCW VI/1)', true], ['Шенгенская виза', false]],
    desc: 'Надёжный судовладелец, ротация 4 месяца ±1. Смены экипажа в ЕС, интернет на борту, оплата в USD без задержек.' },
  { t: '3rd Engineer', sal: '$4 000 / мес', ship: 'Container Ship', board: 'как можно скорее', dur: '6 мес', co: 'Nordline Ship Management', lg: 'NS', ago: '5 ч назад', tags: ['NEW', 'Срочно'],
    vessel: [['Судно', 'MV Baltic Way'], ['Флаг', 'Liberia'], ['TEU', '4 200'], ['Построено', '2015']],
    req: [['Английский — хороший (B1+)', true], ['Диплом 3rd Engineer (III/1)', true], ['Опыт на Container Ship от 6 мес', false], ['Действующий медосмотр', true]],
    desc: 'Срочная замена. Линия Европа — Азия, экипаж смешанный.' },
  { t: '4th Engineer', sal: 'Договорная', ship: 'Oil Tanker', board: '15.12.2026', dur: '4 мес', co: 'Meridian Crew', lg: 'MC', ago: '1 д назад', tags: [],
    vessel: [['Судно', 'MT North Pearl'], ['Флаг', 'Marshall Islands'], ['DWT', '45 000']],
    req: [['Английский — средний (A2+)', true], ['Диплом 4th Engineer', true], ['Действующий медосмотр', true]],
    desc: 'Подойдёт кандидатам, которые хотят опыт на танкерах.' },
  { t: '3rd Engineer', sal: '$4 500 / мес', ship: 'LPG Carrier', board: '20.12.2026', dur: '5 мес', co: 'Atlas Marine Services', lg: 'AM', ago: '2 д назад', tags: [],
    vessel: [['Судно', 'LPG Atlas Star'], ['Флаг', 'Panama'], ['CBM', '22 000']],
    req: [['Английский — хороший (B1+)', true], ['Диплом 3rd Engineer (III/1)', true], ['Gas Tanker Familiarization', false], ['Действующий медосмотр', true]],
    desc: 'Газовоз, ротация 5 месяцев, бонус за продление.' },
]

// Лічильники в навігації застосунку (правка №16): непрочитані повідомлення й сповіщення.
export const APP_COUNTS = { messages: 2, notifications: 3 }

/* ---------- статус доступності (правки №1, №15, №19, №20, №23) ---------- */

// Три статуси; «В рейсе до» прибрано. Дату для «Готов к контракту с» моряк вибирає сам.
export type AvailKind = 'now' | 'from' | 'not'
export type Availability = { kind: AvailKind; /** ISO yyyy-mm-dd, лише для 'from' */ date?: string }

export const AVAIL_OPTIONS: { kind: AvailKind; label: string }[] = [
  { kind: 'now', label: 'Готов приступить к работе немедленно' },
  { kind: 'from', label: 'Готов к контракту с' },
  { kind: 'not', label: 'Не ищу работу' },
]

export const AVAIL_DEFAULT: Availability = { kind: 'now' }
export const AVAIL_DEFAULT_DATE = '2026-12-01'

// '2026-12-01' → '01.12.2026'
export const ruDate = (iso: string) => iso.split('-').reverse().join('.')

// Повний текст статусу: «Готов к контракту с 01.12.2026».
export function availLabel(a: Availability) {
  const base = AVAIL_OPTIONS.find((o) => o.kind === a.kind)!.label
  return a.kind === 'from' ? `${base} ${ruDate(a.date ?? AVAIL_DEFAULT_DATE)}` : base
}

/* ---------- флот → департамент → посада (правки №2, №25, №35) ---------- */

// Списки — за довідниками KB (40-domains/reference-data: 5 флотів, департаменти, посади з placements).
// Підписи англійською, від мови інтерфейсу не залежать (правило G1). Остаточні списки замовник допрацює.
export const FLEETS = ['Merchant', 'Offshore', 'Passenger / Cruise', 'Fishing', 'Onshore / Office'] as const
export type Fleet = (typeof FLEETS)[number]

// Вторинні департаменти — унизу списку (правило G2).
export const SECONDARY_DEPARTMENTS = ['Hotel & Entertainment', 'Other']

export const FLEET_TREE: Record<Fleet, Record<string, string[]>> = {
  Merchant: {
    Deck: ['Master', 'Chief Officer', '2nd Officer', '3rd Officer', 'Deck Cadet', 'Bosun (Boatswain)', 'AB (Able Seaman)', 'OS (Ordinary Seaman)', 'Pumpman', 'Deck Fitter'],
    Engine: ['Chief Engineer', '2nd Engineer', '3rd Engineer', '4th Engineer', 'ETO (Electro-Technical Officer)', 'Engine Cadet', 'Fitter', 'Motorman', 'Oiler', 'Wiper'],
    Catering: ['Chief Cook', 'Cook', 'Messman', 'Steward'],
  },
  Offshore: {
    Deck: ['Master', 'Chief Officer', '2nd Officer', 'DPO (Dynamic Positioning Operator)', 'Senior DPO', 'Bosun (Boatswain)', 'AB (Able Seaman)', 'Crane Operator', 'Rigger', 'HLO (Helicopter Landing Officer)'],
    Engine: ['Chief Engineer', '2nd Engineer', '3rd Engineer', 'ETO (Electro-Technical Officer)', 'Senior DP Engineer', 'Electrician', 'Mechanic', 'Motorman'],
    Catering: ['Chief Cook', 'Cook', 'Cook Assistant', 'Steward'],
    'Safety / HSE': ['Safety Officer', 'HSE Advisor', 'Medic'],
  },
  'Passenger / Cruise': {
    Deck: ['Master', 'Staff Captain', 'Chief Officer', '2nd Officer', '3rd Officer', 'Bosun (Boatswain)', 'AB (Able Seaman)', 'OS (Ordinary Seaman)'],
    Engine: ['Chief Engineer', 'Staff Chief Engineer', '2nd Engineer', '3rd Engineer', 'ETO (Electro-Technical Officer)', 'Electrician', 'HVAC Technician', 'Plumber', 'Motorman'],
    Catering: ['Executive Chef', 'Sous Chef', 'Chef de Partie', 'Cook Assistant', 'Galley Utility'],
    'Hotel & Entertainment': ['Hotel Director', 'Purser', 'Receptionist', 'Cabin Steward', 'Waiter', 'Bartender', 'Entertainment Staff'],
  },
  Fishing: {
    Deck: ['Skipper', 'Mate', 'Bosun (Boatswain)', 'Deckhand', 'Net Maker'],
    Engine: ['Chief Engineer', '2nd Engineer', 'Motorman'],
    Catering: ['Cook', 'Cook Assistant'],
    'Fishing / Processing': ['Factory Manager', 'Fish Processor', 'Freezer Man', 'Quality Controller'],
  },
  'Onshore / Office': {
    Other: ['Port Captain', 'Marine Superintendent', 'Technical Superintendent', 'Crewing Officer'],
  },
}

const byAlpha = (a: string, b: string) => a.localeCompare(b, 'en')

// Департаменти вибраних флотів: основні за алфавітом, вторинні внизу.
export function departmentsFor(fleets: readonly string[]) {
  const set = new Set(fleets.flatMap((f) => Object.keys(FLEET_TREE[f as Fleet] ?? {})))
  const all = [...set]
  return [...all.filter((d) => !SECONDARY_DEPARTMENTS.includes(d)).sort(byAlpha), ...all.filter((d) => SECONDARY_DEPARTMENTS.includes(d)).sort(byAlpha)]
}

// Посади департаменту у вибраних флотах, без повторів, за алфавітом (одна посада буває в кількох флотах).
export function positionsFor(fleets: readonly string[], department: string | null) {
  if (!department) return []
  return [...new Set(fleets.flatMap((f) => FLEET_TREE[f as Fleet]?.[department] ?? []))].sort(byAlpha)
}
