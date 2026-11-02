// Дані преміуму, зарплати й аналітики, підписок і обговорень (мобілка). Усе вигадане; ціни ще немає (відповідь 128).
// Відповіді замовника: 96, 103, 105, 107, 113, 117, 126, 129–132, 134–136.

/* ---------- премиум ---------- */

/** Ціни поки немає — показуємо заглушку (відповідь 128). */
export const PRICE_STUB = '…'
export const TRIAL_DAYS = 7

export type PlanKind = 'free' | 'trial' | 'active' | 'ended'
export type Plan = { kind: PlanKind; /** dd.mm.yyyy */ until: string }

export const PLAN_TRIAL: Plan = { kind: 'trial', until: '09.11.2026' }
export const PLAN_ACTIVE: Plan = { kind: 'active', until: '02.12.2026' }
export const PLAN_ENDED: Plan = { kind: 'ended', until: '01.11.2026' }

export type FeatureId = 'searches' | 'alerts' | 'autofill' | 'compare'

// Переваги премиуму. Остаточного списку замовник ще не дав (відповідь 127) — це приклад із уже названого.
export const FEATURES: { id: FeatureId; title: string; text: string; to: string }[] = [
  { id: 'alerts', title: 'Подходящие вакансии — сразу', text: 'Пришлём уведомление, как только появится вакансия под ваш профиль', to: 'pr-lock-alerts' },
  { id: 'searches', title: 'До 20 подборок', text: 'Бесплатно — 3 сохранённых поиска', to: 'p17' },
  { id: 'autofill', title: 'Анкеты заполняются из профиля', text: 'Анкету агентства не нужно набирать вручную', to: 'pr-lock' },
  { id: 'compare', title: 'Сравнение вакансий', text: 'Зарплата, судно и сроки рядом, в одной таблице', to: 'pr-compare' },
]

// Що відкриває замок на кожному прикладі (pr-lock*): заголовок вікна і чому це в премиумі.
export const LOCKS: Record<'autofill' | 'searches' | 'compare' | 'alerts', { title: string; text: string }> = {
  autofill: { title: 'Заполнение из профиля', text: 'С премиумом анкета агентства заполнится данными из вашего профиля и документов. Останется проверить и отправить.' },
  searches: { title: 'Больше 3 подборок', text: 'Бесплатно можно хранить 3 подборки. С премиумом — до 20, и по каждой придут новые вакансии.' },
  compare: { title: 'Сравнение вакансий', text: 'Выберите до трёх вакансий — зарплата, судно, контракт и посадка встанут рядом.' },
  alerts: { title: 'Подходящие вакансии сразу', text: 'Сообщения и предложения от рекрутеров приходят всем сразу. С премиумом ещё и уведомление о вакансии, которая подходит под ваш профиль, — в момент публикации.' },
}

export type HistoryRow = { date: string; title: string; sub: string; amount: string }

export const HISTORY: HistoryRow[] = [
  { date: '02.11.2026', title: 'Премиум на месяц', sub: 'Оплата в App Store', amount: `${PRICE_STUB} / мес` },
  { date: '26.10.2026', title: 'Неделя за приглашение', sub: 'Ирина Бондарь зарегистрировалась по вашей ссылке', amount: '+7 дней' },
  { date: '19.10.2026', title: 'Пробная неделя', sub: 'После регистрации', amount: 'бесплатно' },
]

/* ---------- приглашения и промокоды (відповідь 130) ---------- */

export const MY_CODE = 'SEA-4K7Q'
export const INVITE_LINK = 'seafolio.app/i/SEA-4K7Q'

export type Invite = { av: string; name: string; status: 'joined' | 'waiting'; date: string }
export const INVITES: Invite[] = [
  { av: 'ИБ', name: 'Ирина Бондарь', status: 'joined', date: '26.10.2026' },
  { av: 'ДС', name: 'Денис Савчук', status: 'waiting', date: '30.10.2026' },
]

/** Код, який прототип вважає неправильним (решта від 6 символів — правильні). */
export const PROMO_BAD = 'SEA-0000'

/* ---------- зарплата і рейтинг (відповіді 134–135) ---------- */

export const RATING_MIN = 50

export type SalaryInfo = {
  rank: string
  ship: string
  /** поточна зарплата, $ на місяць — іде в рейтинг */
  current: number
  /** бажана — бачать лише рекрутери */
  desired: number
}

export const MY_SALARY: SalaryInfo = { rank: '3rd Engineer', ship: 'Chemical Tanker', current: 4300, desired: 4800 }

// Розподіл поточних зарплат у групі (посада + тип судна): кошики по $250.
export const SALARY_BINS: { from: number; n: number }[] = [
  { from: 3250, n: 6 },
  { from: 3500, n: 14 },
  { from: 3750, n: 27 },
  { from: 4000, n: 41 },
  { from: 4250, n: 46 },
  { from: 4500, n: 38 },
  { from: 4750, n: 24 },
  { from: 5000, n: 12 },
  { from: 5250, n: 6 },
]
export const SALARY_STEP = 250
/** Скільки людей у групі, коли даних замало (стан «Недостаточно данных»). */
export const FEW_PEOPLE = 31

/* ---------- аналітика (відповідь 136; бриф S47) ---------- */

// +1 щоразу, коли профіль потрапляє в результати пошуку рекрутера. Хто шукав — не показуємо.
export const FOUND_WEEKS: { week: string; n: number }[] = [
  { week: '08.09', n: 4 },
  { week: '15.09', n: 6 },
  { week: '22.09', n: 3 },
  { week: '29.09', n: 8 },
  { week: '06.10', n: 7 },
  { week: '13.10', n: 11 },
  { week: '20.10', n: 9 },
  { week: '27.10', n: 14 },
]

// Відкриті вакансії для моєї посади за зарплатою (на місяць).
export const JOBS_BY_SALARY: { label: string; n: number; mine?: boolean }[] = [
  { label: 'до $4 000', n: 9 },
  { label: '$4 000–4 500', n: 17, mine: true },
  { label: '$4 500–5 000', n: 8 },
  { label: 'от $5 000', n: 4 },
]

// Відкриті вакансії для моєї посади за типом судна.
export const JOBS_BY_SHIP: { label: string; n: number }[] = [
  { label: 'Chemical Tanker', n: 12 },
  { label: 'Container Ship', n: 9 },
  { label: 'Oil Tanker', n: 7 },
  { label: 'LPG Carrier', n: 5 },
  { label: 'Другие', n: 5 },
]

/* ---------- рекомендации (відповідь 105) ---------- */

// Індекси FJ_JOBS і чому рекомендуємо (без «соответствия требованиям» — відповідь 99).
export const RECOMMENDED: { k: number; why: string }[] = [
  { k: 0, why: 'Ваша должность и тип судна' },
  { k: 1, why: 'Ваша должность, посадка как можно скорее' },
  { k: 4, why: 'Зарплата выше вашей текущей' },
  { k: 6, why: 'Вы откликались в офшор' },
]

/* ---------- подписки (відповідь 126; бриф S29) ---------- */

export type Company = { id: string; lg: string; name: string; jobs: number; verified: boolean }
export const COMPANIES: Company[] = [
  { id: 'bw', lg: 'BW', name: 'BlueWave Crewing', jobs: 4, verified: true },
  { id: 'ns', lg: 'NS', name: 'Nordline Ship Management', jobs: 2, verified: true },
  { id: 'am', lg: 'AM', name: 'Atlas Marine Services', jobs: 1, verified: false },
]

/** Скільки підписників і підписок у моряків (за іменем автора, вигадані числа). */
export const FOLLOW_COUNTS: Record<string, [number, number]> = {
  'Марко Петров': [214, 38],
  'Ирина Бондарь': [96, 51],
  'Олег Коваленко': [1240, 12],
  'Денис Савчук': [47, 60],
}

/** На кого я підписаний за замовчуванням (імена з AUTHORS). */
export const FOLLOWING_DEFAULT = ['Олег Коваленко', 'Ирина Бондарь']
export const FOLLOWING_COMPANIES_DEFAULT = ['bw', 'ns']

/* ---------- обсуждения (відповідь 113 — у майбутньому) ---------- */

export type Topic = { id: string; title: string; text: string; author: string; av: string; replies: number; last: string; tag: string }
export const TOPICS: Topic[] = [
  { id: 't1', title: 'Смена экипажа в Роттердаме: где ждать катер?', text: 'Через неделю пересадка в Роттердаме, впервые там. Откуда забирают на судно и сколько обычно ждать?', author: 'Марко Петров', av: 'МП', replies: 14, last: '20 мин', tag: 'Порты' },
  { id: 't2', title: 'Продление медосмотра в рейсе — у кого получалось?', text: 'Медосмотр заканчивается за месяц до конца контракта. Можно ли пройти его в порту и примет ли агентство?', author: 'Денис Савчук', av: 'ДС', replies: 9, last: '2 ч', tag: 'Документы' },
  { id: 't3', title: 'Первый контракт 4th Engineer: что взять с собой', text: 'Иду на первый контракт в машину. Что пригодилось вам в первый рейс, а что так и пролежало в сумке?', author: 'Ирина Бондарь', av: 'ИБ', replies: 31, last: 'вчера', tag: 'Новичкам' },
  { id: 't4', title: 'Chemical Tanker после балкера: с чего начать', text: 'Восемь лет на балкерах, хочу на химовозы. Какие курсы нужны сначала и берут ли без опыта на танкерах?', author: 'Олег Коваленко', av: 'ОК', replies: 6, last: '3 д', tag: 'Карьера' },
]

export type Reply = { av: string; name: string; rank: string; time: string; text: string; likes: number }
export const REPLIES: Record<string, Reply[]> = {
  t1: [
    { av: 'ОК', name: 'Олег Коваленко', rank: 'Master', time: '1 ч', text: 'Катер обычно от Maasboulevard. Агент присылает время за сутки, но лучше уточнить у капитана накануне.', likes: 8 },
    { av: 'ИБ', name: 'Ирина Бондарь', rank: '2nd Officer', time: '45 мин', text: 'В прошлом месяце ждали два часа — был туман. Возьмите воду и зарядку.', likes: 5 },
    { av: 'ДС', name: 'Денис Савчук', rank: 'Bosun', time: '20 мин', text: 'Если посадка ночью, гостиницу агент оплачивает — спрашивайте заранее.', likes: 2 },
  ],
  t2: [
    { av: 'МП', name: 'Марко Петров', rank: 'Chief Officer', time: '3 ч', text: 'Проходил в Гамбурге у клиники из списка флага. Агентство приняло, но заранее предупредите оператора.', likes: 4 },
    { av: 'ОК', name: 'Олег Коваленко', rank: 'Master', time: '2 ч', text: 'Сначала проверьте, признаёт ли ваш флаг клинику, — иначе придётся проходить заново дома.', likes: 6 },
  ],
  t3: [
    { av: 'ДС', name: 'Денис Савчук', rank: 'Bosun', time: 'вчера', text: 'Нормальные рабочие ботинки и свои беруши. Остальное выдадут.', likes: 12 },
    { av: 'МП', name: 'Марко Петров', rank: 'Chief Officer', time: 'вчера', text: 'Распечатки всех документов в отдельной папке. На посадке спрашивают бумагу, а не телефон.', likes: 9 },
  ],
  t4: [
    { av: 'ИБ', name: 'Ирина Бондарь', rank: '2nd Officer', time: '3 д', text: 'Сначала Basic Oil and Chemical Tanker, потом ищите агентство, которое берёт с курсом, но без стажа на танкерах.', likes: 3 },
  ],
}
