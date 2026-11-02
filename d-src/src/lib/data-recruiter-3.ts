// Вигадані дані для вебу, частина 3: публічні сторінки (вакансія, профіль моряка, головна),
// тариф і рахунки, верифікація компанії, команда.
// Відповіді 139–141, 160, 161 замовник ще не дав — тарифи, ціни, рівні перевірки й ролі тут ПРИКЛАД (позначено «пример» на екранах).
import type { RecruiterRole } from './data-web'

export const TODAY_R3 = '2026-11-02'

/* ---------- публічна вакансія (відп. 102) — на основі j01 ---------- */

export const PUB_JOB = {
  id: 'j01',
  slug: '/job/j01',
  position: '3rd Engineer',
  vesselType: 'Chemical Tanker',
  vesselName: 'MT Aurora Spirit',
  salary: '$4 200–4 600',
  period: 'в месяц',
  company: 'BlueWave Crewing',
  companyShort: 'BW',
  companyPlace: 'Лимасол, Кипр',
  posted: '2026-10-28',
  facts: [
    ['Посадка', '05.12.2026'],
    ['Контракт', '4 ±1 мес.'],
    ['Регион', 'Европа'],
    ['Флот', 'Merchant / Engine'],
  ] as [string, string][],
  requirements: ['Диплом 3rd Engineer (III/1)', 'Опыт на химовозах от 12 месяцев', 'Двигатели MAN B&W', 'Виза США C1/D', 'Английский от B1'],
  vessel: [
    ['Тип', 'Chemical Tanker'],
    ['Флаг', 'Мальта'],
    ['Год постройки', '2014'],
    ['DWT', '19 800'],
    ['Главный двигатель', 'MAN B&W 6S46MC-C'],
    ['Экипаж', '22'],
  ] as [string, string][],
  description:
    'Судовладелец из ЕС, флот из восьми химовозов IMO II. Смена экипажа в Роттердаме или Антверпене, перелёт за счёт компании. На борту интернет, отдельная каюта. Зарплата без задержек, в последний день месяца.',
  views: 312,
}

/* ---------- публічний профіль (відп. 51, правка №30) ---------- */

export const PUB_PROFILE = {
  slug: '/s/andrii-k',
  name: 'Andrii K.',
  initials: 'AK',
  position: '3rd Engineer',
  fleet: 'Merchant / Engine',
  /** що відкривається в застосунку після входу — без значень */
  closed: ['Опыт работы и стаж по контрактам', 'Дипломы, сертификаты и медицина', 'Визы и ближайший аэропорт', 'Готовность к контракту', 'Публикации'],
}

/* ---------- тарифи (відп. 160, 161 — пример) ---------- */

export type PlanId = 'subscription' | 'per-job' | 'database'

export type Plan = {
  id: PlanId
  name: string
  /** за що платить компанія */
  model: string
  price: string
  unit: string
  includes: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'subscription',
    name: 'Подписка',
    model: 'Фиксированная плата каждый месяц',
    price: '€290',
    unit: 'в месяц',
    includes: ['До 10 открытых вакансий', 'До 5 рекрутеров', 'Поиск по базе моряков', '100 приглашений в месяц'],
  },
  {
    id: 'per-job',
    name: 'За вакансию',
    model: 'Платите, только когда публикуете',
    price: '€49',
    unit: 'за вакансию на 30 дней',
    includes: ['Вакансия в ленте и поиске 30 дней', 'Рекрутеров без ограничений', '15 приглашений на вакансию', 'Поиск по базе — нет'],
  },
  {
    id: 'database',
    name: 'Доступ к базе',
    model: 'Только поиск и приглашения',
    price: '€190',
    unit: 'в месяц',
    includes: ['Поиск по базе моряков', '300 приглашений в месяц', 'До 3 рекрутеров', 'Вакансии — €49 за каждую'],
  },
]

export const PLAN_USAGE = [
  { label: 'Открытые вакансии', used: 4, limit: 10 },
  { label: 'Места рекрутеров', used: 4, limit: 5 },
  { label: 'Приглашения в ноябре', used: 18, limit: 100 },
]

export const BILLING = {
  since: '2026-09-14',
  nextCharge: '2026-11-14',
  card: { brand: 'Visa', last4: '1881', exp: '08/28' },
  details: { company: 'BlueWave Crewing Ltd', vat: 'CY10000000X', email: 'billing@bluewave-crewing.example', address: 'ул. Морская, 12, 3036 Лимасол, Кипр' },
}

/* ---------- рахунки ---------- */

export type InvoiceStatus = 'paid' | 'due' | 'failed'
export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = { paid: 'Оплачен', due: 'Ожидает оплаты', failed: 'Платёж не прошёл' }

export type Invoice = {
  id: string
  number: string
  date: string
  period: string
  item: string
  amount: number
  status: InvoiceStatus
}

export const INVOICES: Invoice[] = [
  { id: 'inv5', number: 'SF-2026-0418', date: '2026-11-14', period: '14.11–13.12.2026', item: 'Подписка, ноябрь', amount: 290, status: 'due' },
  { id: 'inv4', number: 'SF-2026-0391', date: '2026-11-02', period: '02.11–13.11.2026', item: 'Пакет 50 приглашений', amount: 39, status: 'failed' },
  { id: 'inv3', number: 'SF-2026-0287', date: '2026-10-14', period: '14.10–13.11.2026', item: 'Подписка, октябрь', amount: 290, status: 'paid' },
  { id: 'inv2', number: 'SF-2026-0203', date: '2026-10-03', period: '03.10–01.11.2026', item: 'Вакансия ETO, Ocean Titan', amount: 49, status: 'paid' },
  { id: 'inv1', number: 'SF-2026-0112', date: '2026-09-14', period: '14.09–13.10.2026', item: 'Подписка, первый месяц со скидкой', amount: 145, status: 'paid' },
]

/* ---------- верифікація (відп. 139, 140 — пример) ---------- */

export type VerifyDocStatus = 'accepted' | 'replace' | 'uploaded' | 'missing'

export type VerifyDoc = {
  id: string
  title: string
  hint: string
  file?: string
  status: VerifyDocStatus
  /** причина, якщо треба замінити */
  note?: string
}

export const VERIFY_L1 = {
  passed: '2026-09-15',
  checks: [
    'Название и регистрационный номер — сверены с реестром компаний Кипра',
    'Сайт компании и рабочая почта на том же домене',
    'Телефон офиса — подтверждён звонком',
  ],
  unlocks: ['Приглашать моряков', 'Публиковать вакансии', 'Отметка «Агентство проверено» у вакансий'],
}

export const VERIFY_L2 = {
  submitted: '2026-10-28',
  returned: '2026-10-30',
  unlocks: ['Отметка «Проверено, уровень 2» у вакансий и в чате', 'Фамилия и фото моряка после его отклика', 'Выше лимит приглашений'],
  docs: [
    { id: 'reg', title: 'Свидетельство о регистрации компании', hint: 'Скан или PDF, все страницы', file: 'bw-certificate-of-incorporation.pdf', status: 'accepted' },
    { id: 'lic', title: 'Лицензия крюингового агентства', hint: 'По MLC 2006, правило 1.4, или документ страны регистрации', file: 'bw-rps-licence-scan.jpg', status: 'replace', note: 'Не читается срок действия. Загрузите скан целиком, без обрезки.' },
    { id: 'owner', title: 'Договор или письмо от судовладельца', hint: 'Подтверждает, что вы набираете экипаж для его судов', file: 'nordic-shipping-letter.pdf', status: 'accepted' },
    { id: 'office', title: 'Подтверждение адреса офиса', hint: 'Договор аренды или счёт за услуги не старше 3 месяцев', file: 'office-lease-2026.pdf', status: 'accepted' },
  ] as VerifyDoc[],
}

/* ---------- команда (відп. 141 — пример; AC6) ---------- */

export type TeamMember = {
  id: string
  name: string
  initials: string
  email: string
  role: RecruiterRole
  jobs: number
  chats: number
  lastSeen: string
  joined: string
}

export const TEAM: TeamMember[] = [
  { id: 'rc1', name: 'Елена Маринова', initials: 'ЕМ', email: 'elena@bluewave-crewing.example', role: 'owner', jobs: 3, chats: 14, lastSeen: 'сейчас', joined: '2026-09-14' },
  { id: 'rc2', name: 'Томас Вейль', initials: 'ТВ', email: 'thomas@bluewave-crewing.example', role: 'admin', jobs: 2, chats: 9, lastSeen: '2 ч назад', joined: '2026-09-16' },
  { id: 'rc3', name: 'Ана Попеску', initials: 'АП', email: 'ana@bluewave-crewing.example', role: 'recruiter', jobs: 1, chats: 6, lastSeen: 'вчера', joined: '2026-10-02' },
]

export type TeamInvite = { id: string; email: string; role: RecruiterRole; sent: string; expires: string }

export const TEAM_INVITES: TeamInvite[] = [{ id: 'ti1', email: 'k.lindqvist@bluewave-crewing.example', role: 'recruiter', sent: '2026-10-31', expires: '2026-11-07' }]

export const SEATS = 5

/** Що може кожна роль. «Администратор» — проміжна роль, відкрите питання AC6. */
export const PERMISSIONS: { label: string; owner: boolean; admin: boolean; recruiter: boolean }[] = [
  { label: 'Искать моряков и звать на работу', owner: true, admin: true, recruiter: true },
  { label: 'Вакансии, отклики, переписка', owner: true, admin: true, recruiter: true },
  { label: 'Анкеты: создавать и отправлять', owner: true, admin: true, recruiter: true },
  { label: 'Видеть вакансии и переписку коллег', owner: true, admin: true, recruiter: false },
  { label: 'Приглашать и убирать рекрутеров', owner: true, admin: true, recruiter: false },
  { label: 'Профиль компании и верификация', owner: true, admin: true, recruiter: false },
  { label: 'Тариф, оплата и счета', owner: true, admin: false, recruiter: false },
  { label: 'Передать роль владельца', owner: true, admin: false, recruiter: false },
]
