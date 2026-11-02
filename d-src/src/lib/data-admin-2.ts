// Вигадані дані адмінки, частина 2: преміум моряків, платежі, промокоди й запрошення, верифікація
// і тарифи компаній, скарги, тексти. Реальних людей, компаній, документів і номерів немає.
// Де замовник ще не відповів (ціни, тарифи, рівні верифікації) — заглушки з позначкою «пример».

/* ---------- преміум моряків (відповіді 128–132) ---------- */

/** ціна — приклад: відповідь 128 «цену пока не знаем», регіональних цін не буде */
export const PREMIUM_PRICE = { month: 4.99, year: 39.99 }

export type SubState = 'active' | 'trial' | 'ended'
export const SUB_STATE_LABEL: Record<SubState, string> = { active: 'Активна', trial: 'Пробная неделя', ended: 'Закончилась' }

/** звідки преміум: магазини (відповідь 129), карта на сайті, код, запрошення (130), вручну командою */
export type SubSource = 'appstore' | 'googleplay' | 'card' | 'promo' | 'invite' | 'manual'
export const SUB_SOURCE_LABEL: Record<SubSource, string> = {
  appstore: 'App Store',
  googleplay: 'Google Play',
  card: 'Карта на сайте',
  promo: 'Промокод',
  invite: 'Приглашение',
  manual: 'Вручную',
}

export type SubPlan = 'month' | 'year' | 'week'
export const SUB_PLAN_LABEL: Record<SubPlan, string> = { month: 'Месяц', year: 'Год', week: 'Неделя' }

export type SubEventKind = 'trial' | 'pay' | 'renew' | 'promo' | 'invite' | 'manual' | 'notice' | 'expired' | 'cancel' | 'refund'
export type SubEvent = { at: string; kind: SubEventKind; text: string; amount?: number; who?: string }

export type Sub = {
  id: string
  name: string
  initials: string
  /** id у списку користувачів адмінки (a-user), якщо є */
  userId?: string
  position: string
  plan: SubPlan
  state: SubState
  source: SubSource
  started: string
  until: string
  autoRenew: boolean
  /** заплачено всього, $ */
  paid: number
  history: SubEvent[]
}

export const SUBS: Sub[] = [
  {
    id: 's-104', name: 'Andrii K.', initials: 'AK', userId: 'u01', position: '3rd Engineer', plan: 'month', state: 'active', source: 'appstore', started: '2026-09-24', until: '2026-12-01', autoRenew: true, paid: 9.98,
    history: [
      { at: '2026-09-24 21:40', kind: 'trial', text: 'Пробная неделя после онбординга' },
      { at: '2026-10-01 10:05', kind: 'pay', text: 'Оплата в App Store: месяц', amount: 4.99 },
      { at: '2026-11-01 10:05', kind: 'renew', text: 'Автопродление: месяц', amount: 4.99 },
    ],
  },
  {
    id: 's-117', name: 'Kiran P.', initials: 'KP', userId: 'u03', position: '3rd Officer', plan: 'week', state: 'trial', source: 'invite', started: '2026-11-01', until: '2026-11-08', autoRenew: false, paid: 0,
    history: [
      { at: '2026-11-01 18:20', kind: 'invite', text: 'Неделя по приглашению от Mehmet Y.' },
    ],
  },
  {
    id: 's-098', name: 'Tomas L.', initials: 'TL', userId: 'u08', position: 'Chief Cook', plan: 'month', state: 'ended', source: 'googleplay', started: '2026-09-27', until: '2026-10-27', autoRenew: false, paid: 4.99,
    history: [
      { at: '2026-09-27 08:05', kind: 'pay', text: 'Оплата: месяц', amount: 4.99 },
      { at: '2026-10-20 11:30', kind: 'cancel', text: 'Моряк отключил автопродление в Google Play' },
      { at: '2026-10-27 08:05', kind: 'expired', text: 'Премиум закончился' },
      { at: '2026-10-27 08:06', kind: 'notice', text: 'Уведомление: премиум закончился, можно продлить' },
      { at: '2026-10-30 09:00', kind: 'notice', text: 'Напоминание через 3 дня' },
    ],
  },
  {
    id: 's-121', name: 'Mehmet Y.', initials: 'MY', userId: 'u09', position: 'Bosun (Boatswain)', plan: 'year', state: 'active', source: 'card', started: '2026-10-24', until: '2027-10-31', autoRenew: true, paid: 39.99,
    history: [
      { at: '2026-10-24 13:41', kind: 'pay', text: 'Оплата картой на сайте: год', amount: 39.99 },
      { at: '2026-10-31 19:02', kind: 'invite', text: 'Пригласил Kiran P. — плюс неделя к подписке' },
    ],
  },
  {
    id: 's-109', name: 'Dmytro S.', initials: 'DS', position: 'Chief Officer', plan: 'month', state: 'active', source: 'appstore', started: '2026-10-11', until: '2026-11-11', autoRenew: true, paid: 4.99,
    history: [{ at: '2026-10-11 07:55', kind: 'pay', text: 'Оплата: месяц', amount: 4.99 }],
  },
  {
    id: 's-112', name: 'Jose M.', initials: 'JM', position: 'AB (Able Seaman)', plan: 'week', state: 'trial', source: 'promo', started: '2026-10-30', until: '2026-11-06', autoRenew: false, paid: 0,
    history: [{ at: '2026-10-30 16:10', kind: 'promo', text: 'Промокод MANILA-FAIR: неделя премиума' }],
  },
  {
    id: 's-115', name: 'Arjun N.', initials: 'AN', position: '2nd Engineer', plan: 'week', state: 'trial', source: 'appstore', started: '2026-10-31', until: '2026-11-07', autoRenew: true, paid: 0,
    history: [{ at: '2026-10-31 22:03', kind: 'trial', text: 'Пробная неделя после онбординга' }],
  },
  {
    id: 's-087', name: 'Giorgi T.', initials: 'GT', position: 'Electrician (ETO)', plan: 'month', state: 'ended', source: 'appstore', started: '2026-09-15', until: '2026-10-15', autoRenew: false, paid: 4.99,
    history: [
      { at: '2026-09-15 12:00', kind: 'pay', text: 'Оплата: месяц', amount: 4.99 },
      { at: '2026-09-16 09:14', kind: 'refund', text: 'Apple вернула деньги по запросу моряка', amount: -4.99 },
      { at: '2026-10-15 12:00', kind: 'expired', text: 'Премиум закончился' },
    ],
  },
  {
    id: 's-101', name: 'Rizal A.', initials: 'RA', position: 'Oiler', plan: 'month', state: 'active', source: 'manual', started: '2026-10-20', until: '2026-11-20', autoRenew: false, paid: 0,
    history: [{ at: '2026-10-20 15:30', kind: 'manual', text: 'Месяц вручную: участник бета-теста', who: 'Команда Seafolio' }],
  },
  {
    id: 's-093', name: 'Bogdan L.', initials: 'BL', position: 'Master', plan: 'year', state: 'active', source: 'googleplay', started: '2026-10-01', until: '2027-10-01', autoRenew: true, paid: 39.99,
    history: [{ at: '2026-10-01 06:40', kind: 'pay', text: 'Оплата: год', amount: 39.99 }],
  },
  {
    id: 's-079', name: 'Ivan P.', initials: 'IP', position: 'Cook', plan: 'week', state: 'ended', source: 'appstore', started: '2026-10-10', until: '2026-10-17', autoRenew: false, paid: 0,
    history: [
      { at: '2026-10-10 20:15', kind: 'trial', text: 'Пробная неделя после онбординга' },
      { at: '2026-10-17 20:15', kind: 'expired', text: 'Пробная неделя закончилась, оплаты не было' },
      { at: '2026-10-17 20:16', kind: 'notice', text: 'Уведомление: премиум закончился, можно продлить' },
    ],
  },
]

/** зведення для верхнього блоку a2-subs (більше, ніж у таблиці: таблиця — вибірка) */
export const SUB_TOTALS = { paying: 318, trial: 64, gift: 30, endedMonth: 41, returned: 12 }

/* ---------- платежі (моряки й компанії) ---------- */

export type PayChannel = 'App Store' | 'Google Play' | 'Карта' | 'Счёт'
export type PayState = 'paid' | 'refunded' | 'failed' | 'pending'
export const PAY_STATE_LABEL: Record<PayState, string> = { paid: 'Оплачен', refunded: 'Возврат', failed: 'Не прошёл', pending: 'Ждёт оплаты' }

export type Payment = {
  id: string
  at: string
  payer: string
  payerKind: 'seafarer' | 'company'
  subId?: string
  orgId?: string
  item: string
  channel: PayChannel
  amount: number
  state: PayState
  refund?: { amount: number; reason: string; at: string; who: string }
  /** номер у магазині або платіжній системі — вигаданий */
  ref: string
}

export const PAYMENTS: Payment[] = [
  { id: 'p-2041', at: '2026-11-02 09:12', payer: 'Nordline Ship Management', payerKind: 'company', orgId: 'org-ns', item: 'Тариф «Агентство», месяц', channel: 'Счёт', amount: 399, state: 'pending', ref: 'INV-2026-0118' },
  { id: 'p-2039', at: '2026-11-01 14:30', payer: 'BlueWave Crewing', payerKind: 'company', orgId: 'org-bw', item: 'Тариф «Команда», месяц', channel: 'Карта', amount: 149, state: 'paid', ref: 'ch_8KQ2•••41' },
  { id: 'p-2036', at: '2026-11-01 10:05', payer: 'Andrii K.', payerKind: 'seafarer', subId: 's-104', item: 'Премиум, месяц', channel: 'App Store', amount: 4.99, state: 'paid', ref: 'GPA.3341•••20' },
  { id: 'p-2031', at: '2026-10-31 18:44', payer: 'Atlas Marine Services', payerKind: 'company', orgId: 'org-am', item: 'Тариф «Команда», месяц', channel: 'Карта', amount: 149, state: 'failed', ref: 'ch_8JX0•••07' },
  { id: 'p-2027', at: '2026-10-24 13:41', payer: 'Mehmet Y.', payerKind: 'seafarer', subId: 's-121', item: 'Премиум, год', channel: 'Карта', amount: 39.99, state: 'paid', ref: 'ch_8FA1•••93' },
  { id: 'p-2019', at: '2026-10-11 07:55', payer: 'Dmytro S.', payerKind: 'seafarer', subId: 's-109', item: 'Премиум, месяц', channel: 'App Store', amount: 4.99, state: 'paid', ref: 'GPA.3302•••11' },
  { id: 'p-2014', at: '2026-10-03 11:20', payer: 'Quick Crew Agency', payerKind: 'company', orgId: 'org-qx', item: 'Тариф «Команда», месяц', channel: 'Карта', amount: 149, state: 'refunded', ref: 'ch_8BB4•••52', refund: { amount: 149, reason: 'Организация заблокирована после жалоб', at: '2026-10-28 16:20', who: 'Команда Seafolio' } },
  { id: 'p-2008', at: '2026-10-01 06:40', payer: 'Bogdan L.', payerKind: 'seafarer', subId: 's-093', item: 'Премиум, год', channel: 'Google Play', amount: 39.99, state: 'paid', ref: 'GPA.3288•••76' },
  { id: 'p-1996', at: '2026-09-27 08:05', payer: 'Tomas L.', payerKind: 'seafarer', subId: 's-098', item: 'Премиум, месяц', channel: 'Google Play', amount: 4.99, state: 'paid', ref: 'GPA.3240•••02' },
  { id: 'p-1990', at: '2026-09-15 12:00', payer: 'Giorgi T.', payerKind: 'seafarer', subId: 's-087', item: 'Премиум, месяц', channel: 'App Store', amount: 4.99, state: 'refunded', ref: 'MZ1•••8842', refund: { amount: 4.99, reason: 'Apple вернула деньги по запросу моряка', at: '2026-09-16 09:14', who: 'Apple' } },
]

/** зведення за листопад для рядка над таблицею */
export const PAY_MONTH = { label: 'ноябрь', seafarers: 1_604.18, companies: 2_235, refunds: 4.99 }

/* ---------- промокоди й запрошення (відповідь 130) ---------- */

export type PromoState = 'active' | 'off' | 'expired'
export const PROMO_STATE_LABEL: Record<PromoState, string> = { active: 'Действует', off: 'Выключен', expired: 'Истёк' }

export type Promo = {
  id: string
  code: string
  /** скільки днів премиуму дає */
  days: number
  /** null — без ліміту */
  limit: number | null
  used: number
  /** null — безстроково */
  until: string | null
  audience: 'new' | 'all'
  state: PromoState
  created: string
  note: string
}

export const PROMOS: Promo[] = [
  { id: 'pc1', code: 'MANILA-FAIR', days: 7, limit: 500, used: 212, until: '2026-11-30', audience: 'new', state: 'active', created: '2026-10-25', note: 'Морская ярмарка в Маниле' },
  { id: 'pc2', code: 'BETA-CREW', days: 30, limit: 50, used: 47, until: '2026-12-31', audience: 'all', state: 'active', created: '2026-10-15', note: 'Участники бета-теста' },
  { id: 'pc3', code: 'ODESA-MED', days: 14, limit: 100, used: 100, until: '2026-11-15', audience: 'new', state: 'active', created: '2026-10-20', note: 'Партнёрская клиника, листовки' },
  { id: 'pc4', code: 'LAUNCH-WEEK', days: 7, limit: null, used: 1_034, until: '2026-10-31', audience: 'new', state: 'expired', created: '2026-10-01', note: 'Запуск' },
  { id: 'pc5', code: 'TEST-QA', days: 30, limit: 10, used: 3, until: null, audience: 'all', state: 'off', created: '2026-09-30', note: 'Для проверки оплаты' },
]

/** правило запрошень: тиждень обом (відповідь 130); ліміт на людину — приклад */
export const INVITE_RULE = { daysEach: 7, maxWeeksPerYear: 8 }
export const INVITE_TOTALS = { links: 1_286, joined: 389, premiumAfter: 61 }

export type Inviter = {
  id: string
  name: string
  initials: string
  userId?: string
  position: string
  /** скільки людей відкрили посилання або ввели код */
  opened: number
  joined: number
  weeks: number
  last: string
  /** підозра: запрошені з того самого пристрою (ADR-087) */
  flag?: string
}

export const INVITERS: Inviter[] = [
  { id: 'iv1', name: 'Mehmet Y.', initials: 'MY', userId: 'u09', position: 'Bosun (Boatswain)', opened: 41, joined: 9, weeks: 8, last: '2026-11-01', flag: '2 приглашённых с его устройства' },
  { id: 'iv2', name: 'Bogdan L.', initials: 'BL', position: 'Master', opened: 27, joined: 7, weeks: 7, last: '2026-10-30' },
  { id: 'iv3', name: 'Andrii K.', initials: 'AK', userId: 'u01', position: '3rd Engineer', opened: 18, joined: 5, weeks: 5, last: '2026-10-31' },
  { id: 'iv4', name: 'Dmytro S.', initials: 'DS', position: 'Chief Officer', opened: 12, joined: 3, weeks: 3, last: '2026-10-22' },
  { id: 'iv5', name: 'Rizal A.', initials: 'RA', position: 'Oiler', opened: 9, joined: 2, weeks: 2, last: '2026-10-19' },
  { id: 'iv6', name: 'Jose M.', initials: 'JM', position: 'AB (Able Seaman)', opened: 6, joined: 0, weeks: 0, last: '2026-10-30' },
]

/* ---------- верифікація компаній (відповідь 139 — немає, усе «пример») ---------- */

export type VerifyLevel = 1 | 2
export const LEVELS: { level: 0 | 1 | 2; title: string; opens: string }[] = [
  { level: 0, title: 'Без проверки', opens: 'Кабинет, черновики вакансий, поиск без контактов' },
  { level: 1, title: 'Уровень 1', opens: 'Публикация вакансий, приглашения морякам, значок «Проверена»' },
  { level: 2, title: 'Уровень 2', opens: 'Имя и фото моряка в поиске, повышенные лимиты' },
]

export const LEVEL_CHECKS: Record<VerifyLevel, string[]> = {
  1: ['Компания есть в реестре страны, номер совпадает', 'Сайт и домен почты принадлежат компании', 'Владелец подтвердил телефон'],
  2: ['Лицензия крюинга действует (MLC 2006, правило 1.4)', 'Договор с судовладельцем или письмо от него', 'Видеозвонок с владельцем проведён'],
}

export type VerifyDoc = { name: string; type: string; pages: number; size: string; uploaded: string }
export type VerifyState = 'pending' | 'approved' | 'rejected'
export const VERIFY_STATE_LABEL: Record<VerifyState, string> = { pending: 'Ждёт проверки', approved: 'Подтверждена', rejected: 'Отклонена' }

export type VerifyReq = {
  id: string
  orgId: string
  org: string
  country: string
  regNumber: string
  level: VerifyLevel
  /** поточний рівень до заявки */
  current: 0 | 1 | 2
  submitted: string
  state: VerifyState
  contact: string
  docs: VerifyDoc[]
  comment?: string
  decidedAt?: string
  reason?: string
}

export const VERIFY_REQS: VerifyReq[] = [
  {
    id: 'vr-31', orgId: 'org-am', org: 'Atlas Marine Services', country: 'Греция', regNumber: 'GEMI 158 220 301 000', level: 1, current: 0, submitted: '2026-11-01 16:20', state: 'pending', contact: 'Никос Пападакис, +30 21• ••• ••12',
    docs: [{ name: 'gemi-extract.pdf', type: 'Выписка из реестра', pages: 2, size: '410 КБ', uploaded: '2026-11-01 16:18' }],
    comment: 'Работаем с 2014 года, 14 балкеров в управлении.',
  },
  {
    id: 'vr-30', orgId: 'org-mc', org: 'Meridian Crew', country: 'Польша', regNumber: 'KRS 0000 914 552', level: 1, current: 0, submitted: '2026-10-31 11:02', state: 'pending', contact: 'Павел Новак, +48 5•• ••• •07',
    docs: [{ name: 'krs-odpis.pdf', type: 'Выписка из реестра', pages: 3, size: '620 КБ', uploaded: '2026-10-31 10:58' }],
  },
  {
    id: 'vr-29', orgId: 'org-bw', org: 'BlueWave Crewing', country: 'Кипр', regNumber: 'HE 418 220', level: 2, current: 1, submitted: '2026-10-30 09:45', state: 'pending', contact: 'Елена Маринова, +357 9• ••• •31',
    docs: [
      { name: 'mlc-licence-2026.pdf', type: 'Лицензия крюинга', pages: 2, size: '780 КБ', uploaded: '2026-10-30 09:40' },
      { name: 'owner-letter.pdf', type: 'Письмо судовладельца', pages: 1, size: '190 КБ', uploaded: '2026-10-30 09:41' },
      { name: 'certificate-inc.jpg', type: 'Свидетельство о регистрации', pages: 1, size: '1,2 МБ', uploaded: '2026-10-30 09:43' },
    ],
    comment: 'Видеозвонок удобен в будни с 10 до 16 по Кипру.',
  },
  {
    id: 'vr-27', orgId: 'org-ns', org: 'Nordline Ship Management', country: 'Норвегия', regNumber: 'NO 921 004 117', level: 2, current: 2, submitted: '2026-10-02 08:30', state: 'approved', decidedAt: '2026-10-06 12:10', contact: 'Ингрид Сольхейм, +47 9•• •• •45',
    docs: [
      { name: 'licence-no.pdf', type: 'Лицензия крюинга', pages: 3, size: '940 КБ', uploaded: '2026-10-02 08:26' },
      { name: 'charter-letter.pdf', type: 'Письмо судовладельца', pages: 1, size: '220 КБ', uploaded: '2026-10-02 08:28' },
    ],
  },
  {
    id: 'vr-22', orgId: 'org-sh', org: 'Seahorse Manning', country: 'Панама', regNumber: 'не указан', level: 1, current: 0, submitted: '2026-10-12 19:40', state: 'rejected', decidedAt: '2026-10-13 10:05', reason: 'Номер не найден в реестре, сайта нет', contact: 'Без имени, crew•••@mail.example',
    docs: [{ name: 'IMG_0412.jpg', type: 'Фото документа', pages: 1, size: '2,4 МБ', uploaded: '2026-10-12 19:38' }],
  },
]

/* ---------- тарифи компаній (відповіді 160–161 — немає, усе «пример») ---------- */

export type CompanyPlan = {
  id: string
  name: string
  /** $ на місяць; 0 — безкоштовно */
  month: number
  /** $ на рік */
  year: number
  recruiters: number | null
  jobs: number | null
  invites: number | null
  search: 'none' | 'filters' | 'full'
  forms: boolean
  minLevel: 0 | 1 | 2
  orgs: number
}

export const SEARCH_LABEL: Record<CompanyPlan['search'], string> = { none: 'Нет', filters: 'По фильтрам, без контактов', full: 'Полный, с контактами' }

export const COMPANY_PLANS: CompanyPlan[] = [
  { id: 'start', name: 'Старт', month: 0, year: 0, recruiters: 1, jobs: 2, invites: 10, search: 'filters', forms: false, minLevel: 0, orgs: 14 },
  { id: 'team', name: 'Команда', month: 149, year: 1_490, recruiters: 5, jobs: 15, invites: 150, search: 'full', forms: true, minLevel: 1, orgs: 6 },
  { id: 'agency', name: 'Агентство', month: 399, year: 3_990, recruiters: null, jobs: null, invites: 600, search: 'full', forms: true, minLevel: 2, orgs: 2 },
]

export type OrgPlanRow = { orgId: string; org: string; plan: string; since: string; next: string | null; channel: 'Карта' | 'Счёт' | '—'; state: 'ok' | 'overdue' | 'free' }
export const ORG_PLANS: OrgPlanRow[] = [
  { orgId: 'org-ns', org: 'Nordline Ship Management', plan: 'Агентство', since: '2026-10-06', next: '2026-11-06', channel: 'Счёт', state: 'ok' },
  { orgId: 'org-bw', org: 'BlueWave Crewing', plan: 'Команда', since: '2026-09-15', next: '2026-12-01', channel: 'Карта', state: 'ok' },
  { orgId: 'org-am', org: 'Atlas Marine Services', plan: 'Команда', since: '2026-11-01', next: '2026-11-01', channel: 'Карта', state: 'overdue' },
  { orgId: 'org-mc', org: 'Meridian Crew', plan: 'Старт', since: '2026-10-31', next: null, channel: '—', state: 'free' },
  { orgId: 'org-sh', org: 'Seahorse Manning', plan: 'Старт', since: '2026-10-12', next: null, channel: '—', state: 'free' },
]

/* ---------- скарги (рекомендація 148: бейдж, скарги, попередження в чаті) ---------- */

export type ReportTarget = 'org' | 'job' | 'message'
export const REPORT_TARGET_LABEL: Record<ReportTarget, string> = { org: 'Компания', job: 'Вакансия', message: 'Сообщение в чате' }
export type ReportState = 'open' | 'closed'

export type ChatLine = { from: 'recruiter' | 'seafarer'; author: string; text: string; at: string; reported?: boolean }

export type Report = {
  id: string
  target: ReportTarget
  title: string
  context: string
  reason: string
  comment?: string
  reporter: string
  /** скільки моряків поскаржилися на те саме */
  count: number
  at: string
  state: ReportState
  outcome?: string
  orgId?: string
  jobId?: string
  /** відправник повідомлення (рекрутер) у списку користувачів */
  userId?: string
  chat?: ChatLine[]
}

export const REPORTS: Report[] = [
  {
    id: 'rp-58', target: 'message', title: 'Омар Х., Quick Crew Agency', context: 'Чат по вакансии Cook, Fishing Trawler', reason: 'Просит деньги за трудоустройство', reporter: 'Ramon C.', count: 1, at: '2026-11-02 08:31', state: 'open', orgId: 'org-qx', userId: 'u11',
    comment: 'Сказал перевести 300 $ на карту до подписания контракта.',
    chat: [
      { from: 'seafarer', author: 'Ramon C.', text: 'Здравствуйте, когда будет собеседование?', at: '2026-11-02 08:10' },
      { from: 'recruiter', author: 'Омар Х.', text: 'Место за вами. Оформление 300 $, переведите сегодня на карту, реквизиты пришлю.', at: '2026-11-02 08:24', reported: true },
    ],
  },
  {
    id: 'rp-57', target: 'job', title: 'AB (Able Seaman), Container Ship', context: 'Quick Crew Agency', reason: 'Оплата за трудоустройство', reporter: 'Jose M.', count: 3, at: '2026-11-01 21:15', state: 'open', jobId: 'aj2', orgId: 'org-qx',
    comment: 'В описании «сбор за визу», по телефону просят 500 $.',
  },
  {
    id: 'rp-55', target: 'org', title: 'Atlas Marine Services', context: 'Греция, на проверке', reason: 'Выдают себя за другую компанию', reporter: 'Bogdan L.', count: 1, at: '2026-11-01 12:40', state: 'open', orgId: 'org-am',
    comment: 'Название похоже на известный менеджмент в Пирее, но сайт другой.',
  },
  {
    id: 'rp-52', target: 'message', title: 'Томас Вейль, BlueWave Crewing', context: 'Чат по вакансии 3rd Engineer', reason: 'Грубость', reporter: 'Arjun N.', count: 1, at: '2026-10-31 17:05', state: 'open', orgId: 'org-bw',
    chat: [
      { from: 'seafarer', author: 'Arjun N.', text: 'Можно перенести звонок на завтра? Я на вахте.', at: '2026-10-31 16:40' },
      { from: 'recruiter', author: 'Томас Вейль', text: 'Если не можете сегодня, не тратьте моё время.', at: '2026-10-31 16:52', reported: true },
    ],
  },
  {
    id: 'rp-49', target: 'job', title: 'Cook, Fishing Trawler', context: 'Quick Crew Agency', reason: 'Вакансии не существует', reporter: 'Ivan P.', count: 4, at: '2026-10-27 10:20', state: 'closed', outcome: 'Вакансия снята', jobId: 'aj8', orgId: 'org-qx',
  },
  {
    id: 'rp-46', target: 'org', title: 'Quick Crew Agency', context: 'ОАЭ', reason: 'Оплата за трудоустройство', reporter: 'Giorgi T.', count: 6, at: '2026-10-26 15:48', state: 'closed', outcome: 'Организация заблокирована', orgId: 'org-qx',
  },
  {
    id: 'rp-41', target: 'job', title: 'DPO, PSV', context: 'Nordline Ship Management', reason: 'Зарплата не совпадает с описанием', reporter: 'Dmytro S.', count: 1, at: '2026-10-22 09:30', state: 'closed', outcome: 'Жалоба отклонена: ставка указана за день', jobId: 'aj4', orgId: 'org-ns',
  },
]

/* ---------- тексти й розсилки (відповіді 152–154, 132, 71) ---------- */

export const LANGS = ['EN', 'RU', 'UK', 'TL', 'ES', 'ID', 'KA', 'PL', 'RO', 'TR'] as const
export type TextKind = 'app' | 'faq' | 'email'
export type TextState = 'draft' | 'review' | 'approved'
export const TEXT_STATE_LABEL: Record<TextState, string> = { draft: 'Черновик', review: 'У заказчика', approved: 'Утверждён' }

export type TextItem = { id: string; kind: TextKind; key: string; title: string; ru: string; en: string; translated: number; state: TextState; updated: string }

export const TEXTS: TextItem[] = [
  { id: 't1', kind: 'app', key: 'onboarding.slide1', title: 'Онбординг, слайд 1', ru: 'Все документы моряка в одном месте', en: 'All your seafarer documents in one place', translated: 10, state: 'approved', updated: '2026-10-28' },
  { id: 't2', kind: 'app', key: 'premium.paywall', title: 'Выбор тарифа в конце онбординга', ru: 'Премиум: больше вакансий в подборках и уведомления раньше всех', en: 'Premium: more saved searches and alerts before everyone else', translated: 3, state: 'review', updated: '2026-11-01' },
  { id: 't3', kind: 'app', key: 'premium.ended', title: 'Премиум закончился', ru: 'Премиум закончился. Продлите, чтобы подборки снова работали', en: 'Your Premium has ended. Renew to keep your saved searches', translated: 2, state: 'draft', updated: '2026-11-02' },
  { id: 't4', kind: 'app', key: 'chat.warning.payment', title: 'Предупреждение в чате об оплате', ru: 'Не переводите деньги рекрутеру. Честные компании не берут плату за работу', en: 'Never send money to a recruiter. Honest companies don’t charge for jobs', translated: 5, state: 'approved', updated: '2026-10-30' },
  { id: 't5', kind: 'faq', key: 'faq.documents.safe', title: 'Кто видит мои документы?', ru: 'Рекрутер видит только то, что вы открыли в профиле. Файлы зашифрованы', en: 'Recruiters see only what you share in your profile. Files are encrypted', translated: 4, state: 'review', updated: '2026-10-29' },
  { id: 't6', kind: 'faq', key: 'faq.invite', title: 'Как пригласить друга?', ru: 'Отправьте ссылку или код из профиля. Неделя премиума — вам и другу', en: 'Share your link or code. You both get a week of Premium', translated: 1, state: 'draft', updated: '2026-11-02' },
  { id: 't7', kind: 'email', key: 'email.org.verified', title: 'Письмо: организация проверена', ru: 'Организация проверена — можно приглашать моряков', en: 'Your organisation is verified — you can now invite seafarers', translated: 2, state: 'approved', updated: '2026-10-20' },
  { id: 't8', kind: 'email', key: 'email.doc.expiring', title: 'Письмо: документ истекает', ru: 'Срок документа заканчивается через 30 дней', en: 'Your document expires in 30 days', translated: 6, state: 'approved', updated: '2026-10-18' },
]

export type Mailing = { id: string; title: string; channel: 'Push' | 'Email' | 'Push и email'; trigger: string; audience: string; state: 'on' | 'off' | 'draft'; sent: number }
export const MAILINGS: Mailing[] = [
  { id: 'm1', title: 'Премиум закончился', channel: 'Push и email', trigger: 'В день окончания и через 3 дня', audience: 'Моряки без продления', state: 'on', sent: 53 },
  { id: 'm2', title: 'Документ скоро истекает', channel: 'Push', trigger: 'За 180, 90 и 30 дней', audience: 'Все моряки', state: 'on', sent: 412 },
  { id: 'm3', title: 'Профиль заполнен меньше чем на 70 %', channel: 'Push', trigger: 'Через 2 дня после регистрации', audience: 'Новые моряки', state: 'on', sent: 288 },
  { id: 'm4', title: 'Пригласите друга — неделя премиума', channel: 'Email', trigger: 'Один раз, вручную', audience: 'Активные за 30 дней', state: 'draft', sent: 0 },
  { id: 'm5', title: 'Новые вакансии по вашей должности', channel: 'Push', trigger: 'Раз в неделю', audience: 'Без премиума', state: 'off', sent: 1_904 },
]

/* ---------- формат ---------- */

/** 4.99 → '$4,99'; 1490 → '$1 490' */
export function money(n: number) {
  const abs = Math.abs(n)
  const s = Number.isInteger(abs) ? abs.toLocaleString('ru') : abs.toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (n < 0 ? '−$' : '$') + s.replace(/ /g, ' ')
}
