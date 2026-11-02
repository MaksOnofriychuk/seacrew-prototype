// Вигадані дані адмінки (етап 9). Реальних людей, компаній, документів і номерів немає.
// Документи моряків — лише метадані: тип, дата, стан; фото й значення не показуємо.
import { ADMIN_ORGS, type AdminOrg, type OrgStatus } from './data-web'

/* ---------- організації (ADR-050 п. 7–8) ---------- */

export type OrgDetail = AdminOrg & {
  city: string
  site: string
  regNumber: string
  owner: { name: string; email: string }
  about: string
  verifiedAt?: string
  people: { name: string; role: string; email: string; joined: string }[]
}

const ORG_EXTRA: Record<string, Omit<OrgDetail, keyof AdminOrg>> = {
  'org-bw': { city: 'Лимасол', site: 'bluewave-crewing.example', regNumber: 'HE 418 220', owner: { name: 'Елена Маринова', email: 'elena@bluewave-crewing.example' }, about: 'Крюинг для танкеров и балкеров.', verifiedAt: '2026-09-15', people: [{ name: 'Елена Маринова', role: 'Владелец', email: 'elena@bluewave-crewing.example', joined: '2026-09-14' }, { name: 'Томас Вейль', role: 'Рекрутер', email: 'thomas@bluewave-crewing.example', joined: '2026-09-18' }, { name: 'Ана Попеску', role: 'Рекрутер', email: 'ana@bluewave-crewing.example', joined: '2026-10-02' }] },
  'org-ns': { city: 'Берген', site: 'nordline-sm.example', regNumber: 'NO 921 004 117', owner: { name: 'Ингрид Сольхейм', email: 'ingrid@nordline-sm.example' }, about: 'Оффшорный флот, Северное море.', verifiedAt: '2026-09-21', people: [{ name: 'Ингрид Сольхейм', role: 'Владелец', email: 'ingrid@nordline-sm.example', joined: '2026-09-20' }] },
  'org-mc': { city: 'Гдыня', site: 'meridian-crew.example', regNumber: 'KRS 0000 914 552', owner: { name: 'Павел Новак', email: 'pavel@meridian-crew.example' }, about: 'Набор экипажей на контейнеровозы и ро-ро. Работаем с польскими и украинскими моряками.', people: [{ name: 'Павел Новак', role: 'Владелец', email: 'pavel@meridian-crew.example', joined: '2026-10-31' }] },
  'org-am': { city: 'Пирей', site: 'atlas-marine.example', regNumber: 'GEMI 158 220 301 000', owner: { name: 'Никос Пападакис', email: 'nikos@atlas-marine.example' }, about: 'Менеджмент балкеров, 14 судов под управлением.', people: [{ name: 'Никос Пападакис', role: 'Владелец', email: 'nikos@atlas-marine.example', joined: '2026-11-01' }, { name: 'Мария Каллас', role: 'Рекрутер', email: 'maria@atlas-marine.example', joined: '2026-11-01' }] },
  'org-sh': { city: 'Панама', site: '—', regNumber: 'не указан', owner: { name: 'Без имени', email: 'crew•••@mail.example' }, about: 'Описание не заполнено.', people: [{ name: 'Без имени', role: 'Владелец', email: 'crew•••@mail.example', joined: '2026-10-12' }] },
  'org-qx': { city: 'Дубай', site: 'quickcrew.example', regNumber: 'DMCC 77 410', owner: { name: 'Рашид Аль-Наими', email: 'rashid@quickcrew.example' }, about: 'Быстрый набор экипажей.', verifiedAt: '2026-10-03', people: [{ name: 'Рашид Аль-Наими', role: 'Владелец', email: 'rashid@quickcrew.example', joined: '2026-10-02' }, { name: 'Омар Х.', role: 'Рекрутер', email: 'omar@quickcrew.example', joined: '2026-10-05' }] },
}

export const orgDetail = (id: string): OrgDetail => {
  const o = ADMIN_ORGS.find((x) => x.id === id) ?? ADMIN_ORGS[2]
  return { ...o, ...ORG_EXTRA[o.id] }
}

export type { OrgStatus }

/* ---------- користувачі (правка №12, ADR-087) ---------- */

export type UStatus = 'active' | 'blocked' | 'banned'
export const USTATUS_LABEL: Record<UStatus, string> = { active: 'Активен', blocked: 'Заблокирован', banned: 'Забанен' }

/** документ моряка: лише метадані */
export type DocMeta = { type: string; added: string; pages: number; state: 'confirmed' | 'review' | 'manual'; }
export const DOC_STATE_LABEL: Record<DocMeta['state'], string> = { confirmed: 'Подтверждён', review: 'Ждёт проверки моряком', manual: 'Данные введены вручную' }

/** спроба, що не пройшла (правка №12): що завантажили й що побачив AI — без фото */
export type WrongAttempt = { at: string; where: string; detected: string }

export type AUser = {
  id: string
  name: string
  initials: string
  role: 'seafarer' | 'recruiter'
  org?: string
  position?: string
  email: string
  status: UStatus
  /** чому заблоковано / забанено */
  reason?: string
  blockedAt?: string
  /** неправильних документів поспіль (правка №12; 2 — блокування) */
  wrongDocs: number
  attempts: WrongAttempt[]
  created: string
  lastSeen: string
  docs: DocMeta[]
  linked: number
  manualFlag?: boolean
}

export const A_USERS: AUser[] = [
  { id: 'u02', name: 'Vasyl R.', initials: 'VR', role: 'seafarer', position: 'Motorman', email: 'va•••@mail.example', status: 'blocked', reason: 'Дважды подряд загружен не документ моряка', blockedAt: '2026-10-30 14:22', wrongDocs: 2, attempts: [{ at: '2026-10-30 14:18', where: 'Быстрая регистрация, документ моряка', detected: 'Внутренний паспорт' }, { at: '2026-10-30 14:22', where: 'Быстрая регистрация, документ моряка', detected: 'Снимок экрана переписки' }], created: '2026-10-30', lastSeen: '2026-11-01', docs: [], linked: 0 },
  { id: 'u07', name: 'Ramon C.', initials: 'RC', role: 'seafarer', position: 'OS (Ordinary Seaman)', email: 'ra•••@mail.example', status: 'blocked', reason: 'Дважды подряд загружен не документ моряка', blockedAt: '2026-11-01 09:41', wrongDocs: 2, attempts: [{ at: '2026-11-01 09:37', where: 'Документы, новый документ', detected: 'Водительское удостоверение' }, { at: '2026-11-01 09:41', where: 'Документы, новый документ', detected: 'Фото без документа' }], created: '2026-10-21', lastSeen: '2026-11-01', docs: [{ type: 'Seafarer’s ID', added: '2026-10-21', pages: 2, state: 'confirmed' }, { type: 'Basic Safety Training', added: '2026-10-22', pages: 1, state: 'confirmed' }], linked: 0 },
  { id: 'u05', name: 'Samir A.', initials: 'SA', role: 'seafarer', position: 'AB (Able Seaman)', email: 'sa•••@mail.example', status: 'banned', reason: 'Номер документа в бан-листе', blockedAt: '2026-10-18 11:05', wrongDocs: 0, attempts: [], created: '2026-10-18', lastSeen: '2026-10-18', docs: [{ type: 'Seafarer’s ID', added: '2026-10-18', pages: 2, state: 'manual' }], linked: 2, manualFlag: true },
  { id: 'u03', name: 'Kiran P.', initials: 'KP', role: 'seafarer', position: '3rd Officer', email: 'ki•••@mail.example', status: 'active', wrongDocs: 1, attempts: [{ at: '2026-11-01 18:03', where: 'Пошаговая регистрация, диплом', detected: 'Студенческий билет' }], created: '2026-11-01', lastSeen: 'сегодня', docs: [{ type: 'Diploma (CoC)', added: '2026-11-01', pages: 1, state: 'review' }], linked: 0 },
  { id: 'u01', name: 'Andrii K.', initials: 'AK', role: 'seafarer', position: '3rd Engineer', email: 'an•••@mail.example', status: 'active', wrongDocs: 0, attempts: [], created: '2026-10-29', lastSeen: 'сегодня', docs: [{ type: 'Seafarer’s ID', added: '2026-10-29', pages: 2, state: 'confirmed' }, { type: 'Diploma (CoC)', added: '2026-10-29', pages: 1, state: 'confirmed' }, { type: 'Медицинский сертификат', added: '2026-10-30', pages: 3, state: 'confirmed' }, { type: 'Загранпаспорт', added: '2026-10-30', pages: 1, state: 'confirmed' }], linked: 0 },
  { id: 'u08', name: 'Tomas L.', initials: 'TL', role: 'seafarer', position: 'Chief Cook', email: 'to•••@mail.example', status: 'active', wrongDocs: 0, attempts: [], created: '2026-10-27', lastSeen: 'вчера', docs: [{ type: 'Seafarer’s ID', added: '2026-10-27', pages: 2, state: 'manual' }], linked: 1, manualFlag: true },
  { id: 'u09', name: 'Mehmet Y.', initials: 'MY', role: 'seafarer', position: 'Bosun (Boatswain)', email: 'me•••@mail.example', status: 'active', wrongDocs: 0, attempts: [], created: '2026-10-24', lastSeen: '3 дня назад', docs: [{ type: 'Diploma (CoC)', added: '2026-10-24', pages: 1, state: 'confirmed' }], linked: 2 },
  { id: 'u04', name: 'Елена Маринова', initials: 'ЕМ', role: 'recruiter', org: 'BlueWave Crewing', email: 'el•••@bluewave-crewing.example', status: 'active', wrongDocs: 0, attempts: [], created: '2026-09-14', lastSeen: 'сейчас', docs: [], linked: 0 },
  { id: 'u10', name: 'Павел Новак', initials: 'ПН', role: 'recruiter', org: 'Meridian Crew', email: 'pa•••@meridian-crew.example', status: 'active', wrongDocs: 0, attempts: [], created: '2026-10-31', lastSeen: 'вчера', docs: [], linked: 0 },
  { id: 'u11', name: 'Омар Х.', initials: 'ОХ', role: 'recruiter', org: 'Quick Crew Agency', email: 'om•••@quickcrew.example', status: 'blocked', reason: 'Организация заблокирована', blockedAt: '2026-10-28 16:10', wrongDocs: 0, attempts: [], created: '2026-10-05', lastSeen: '2026-10-28', docs: [], linked: 0 },
]

export const aUser = (id: string) => A_USERS.find((u) => u.id === id) ?? A_USERS[0]

/* ---------- кинуті реєстрації, пов'язані акаунти, бан (ADR-087, ADR-086 п. 3.11) ---------- */

export type Attempt = {
  id: string
  started: string
  path: 'quick' | 'stepper'
  step: string
  doc: string | null
  manual: boolean
  email: string | null
  /** днів до автоматичного видалення файлів (30 днів, RG1) */
  daysLeft: number
  match?: string
}

export const ATTEMPTS: Attempt[] = [
  { id: 'ra1', started: '2026-11-02 08:14', path: 'quick', step: 'Проверьте данные', doc: 'Seafarer’s ID', manual: true, email: 'jo•••@mail.example', daysLeft: 30 },
  { id: 'ra2', started: '2026-11-01 21:40', path: 'quick', step: 'Загрузка документа', doc: null, manual: false, email: null, daysLeft: 29 },
  { id: 'ra3', started: '2026-10-31 12:02', path: 'stepper', step: 'Код из письма', doc: 'Diploma (CoC)', manual: false, email: 'ab•••@mail.example', daysLeft: 28 },
  { id: 'ra4', started: '2026-10-29 17:55', path: 'quick', step: 'Проверьте данные', doc: 'Seafarer’s ID', manual: false, email: 'sa•••@mail.example', daysLeft: 26, match: 'Документ в бан-листе' },
  { id: 'ra5', started: '2026-10-20 10:31', path: 'stepper', step: 'Пароль', doc: 'Seafarer’s ID', manual: true, email: 'ne•••@mail.example', daysLeft: 17 },
  { id: 'ra6', started: '2026-10-06 19:12', path: 'quick', step: 'Загрузка документа', doc: null, manual: false, email: null, daysLeft: 3, match: 'Устройство из бан-листа' },
]

export type Trace = 'doc' | 'name' | 'file' | 'device' | 'email'
export const TRACE_LABEL: Record<Trace, string> = { doc: 'Документ моряка', name: 'Имя и дата рождения', file: 'Файл', device: 'Устройство', email: 'Email' }
export const TRACES: Trace[] = ['doc', 'name', 'file', 'device', 'email']

export type LinkedGroup = {
  id: string
  found: string
  /** акаунти групи; traces — сліди, що збіглися з іншими в групі */
  accounts: { userId: string | null; name: string; initials: string; email: string; created: string; status: UStatus | 'deleted'; manual: boolean; traces: Trace[] }[]
  state: 'new' | 'banned' | 'dismissed'
}

export const LINKED: LinkedGroup[] = [
  {
    id: 'lg1', found: '2026-11-01', state: 'new',
    accounts: [
      { userId: 'u05', name: 'Samir A.', initials: 'SA', email: 'sa•••@mail.example', created: '2026-10-18', status: 'banned', manual: true, traces: ['name', 'device'] },
      { userId: 'u09', name: 'Mehmet Y.', initials: 'MY', email: 'me•••@mail.example', created: '2026-10-24', status: 'active', manual: false, traces: ['device', 'file'] },
      { userId: null, name: 'S. Aliyev', initials: 'SA', email: 'al•••@mail.example', created: '2026-10-31', status: 'active', manual: true, traces: ['name', 'file'] },
    ],
  },
  {
    id: 'lg2', found: '2026-10-28', state: 'new',
    accounts: [
      { userId: 'u08', name: 'Tomas L.', initials: 'TL', email: 'to•••@mail.example', created: '2026-10-27', status: 'active', manual: true, traces: ['device'] },
      { userId: null, name: 'Tomas Lukas', initials: 'TL', email: 'tl•••@mail.example', created: '2026-09-30', status: 'deleted', manual: false, traces: ['device'] },
    ],
  },
  {
    id: 'lg3', found: '2026-10-15', state: 'dismissed',
    accounts: [
      { userId: null, name: 'Ivan P.', initials: 'IP', email: 'iv•••@mail.example', created: '2026-10-02', status: 'active', manual: false, traces: ['name'] },
      { userId: null, name: 'Ivan P.', initials: 'IP', email: 'ip•••@mail.example', created: '2026-10-14', status: 'active', manual: false, traces: ['name'] },
    ],
  },
]

export type BanEntry = { id: string; trace: Trace; account: string; reason: string; date: string; who: string; tries: number }
export const BANLIST: BanEntry[] = [
  { id: 'b1', trace: 'doc', account: 'Samir A.', reason: 'Жалоба рекрутера: чужой документ', date: '2026-10-18', who: 'Команда Seafolio', tries: 2 },
  { id: 'b2', trace: 'device', account: 'Samir A.', reason: 'Жалоба рекрутера: чужой документ', date: '2026-10-18', who: 'Команда Seafolio', tries: 1 },
  { id: 'b3', trace: 'doc', account: 'удалённый аккаунт', reason: 'Спам в публикациях', date: '2026-10-09', who: 'Команда Seafolio', tries: 0 },
]

/* ---------- вакансії (відповіді 23, 62, 158) ---------- */

export type AJobState = 'review' | 'published' | 'rejected' | 'hidden'
export const AJOB_STATE_LABEL: Record<AJobState, string> = { review: 'На проверке', published: 'Опубликована', rejected: 'Отклонена', hidden: 'Снята' }

export type AJob = {
  id: string
  position: string
  fleet: string
  department: string
  vesselType: string
  org: string
  /** «команда Seafolio» — вакансію додала команда (відповідь 23) */
  byTeam: boolean
  salary: string
  region: string
  board: string
  duration: string
  state: AJobState
  complaints: number
  created: string
  note?: string
}

export const A_JOBS: AJob[] = [
  { id: 'aj1', position: 'Chief Engineer', fleet: 'Merchant', department: 'Engine', vesselType: 'Bulk Carrier', org: 'Atlas Marine Services', byTeam: false, salary: '$12 500 / месяц', region: 'Азия', board: '2026-12-01', duration: '4 мес.', state: 'review', complaints: 0, created: '2026-11-02', note: 'Организация ещё на проверке' },
  { id: 'aj2', position: 'AB (Able Seaman)', fleet: 'Merchant', department: 'Deck', vesselType: 'Container Ship', org: 'Quick Crew Agency', byTeam: false, salary: '$900 / месяц', region: 'ОАЭ', board: '2026-11-05', duration: '9 мес.', state: 'review', complaints: 3, created: '2026-10-27', note: 'Жалобы: оплата за трудоустройство' },
  { id: 'aj3', position: '3rd Engineer', fleet: 'Merchant', department: 'Engine', vesselType: 'Chemical Tanker', org: 'BlueWave Crewing', byTeam: false, salary: '$4 200–4 600 / месяц', region: 'Европа', board: '2026-12-05', duration: '4 ±1 мес.', state: 'published', complaints: 0, created: '2026-10-28' },
  { id: 'aj4', position: 'DPO (Dynamic Positioning Operator)', fleet: 'Offshore', department: 'Deck', vesselType: 'PSV', org: 'Nordline Ship Management', byTeam: false, salary: '€450 / день', region: 'Европа', board: '2026-11-25', duration: '4 недели', state: 'published', complaints: 0, created: '2026-10-30' },
  { id: 'aj5', position: 'Chief Cook', fleet: 'Merchant', department: 'Catering', vesselType: 'Container Ship', org: 'Seafolio', byTeam: true, salary: '$2 900 / месяц', region: 'ОАЭ', board: '2026-12-10', duration: '6 мес.', state: 'published', complaints: 0, created: '2026-10-21' },
  { id: 'aj6', position: '2nd Officer', fleet: 'Passenger / Cruise', department: 'Deck', vesselType: 'Cruise Ship', org: 'Seafolio', byTeam: true, salary: '€5 100 / месяц', region: 'Европа', board: '2026-11-10', duration: '4 мес.', state: 'published', complaints: 1, created: '2026-10-19' },
  { id: 'aj7', position: 'Motorman', fleet: 'Merchant', department: 'Engine', vesselType: 'Oil Tanker', org: 'Seahorse Manning', byTeam: false, salary: '$1 500 / месяц', region: 'Африка', board: '2026-10-30', duration: '6 мес.', state: 'rejected', complaints: 0, created: '2026-10-12', note: 'Организация отклонена' },
  { id: 'aj8', position: 'Cook', fleet: 'Fishing', department: 'Catering', vesselType: 'Fishing Trawler', org: 'Quick Crew Agency', byTeam: false, salary: '$1 100 / месяц', region: 'Африка', board: '2026-11-01', duration: '5 мес.', state: 'hidden', complaints: 4, created: '2026-10-08', note: 'Снята после жалоб' },
]

export const VESSEL_TYPES: { name: string; fleet: string; jobs: number }[] = [
  { name: 'Bulk Carrier', fleet: 'Merchant', jobs: 14 },
  { name: 'Container Ship', fleet: 'Merchant', jobs: 22 },
  { name: 'Oil Tanker', fleet: 'Merchant', jobs: 9 },
  { name: 'Chemical Tanker', fleet: 'Merchant', jobs: 11 },
  { name: 'LPG Carrier', fleet: 'Merchant', jobs: 4 },
  { name: 'LNG Carrier', fleet: 'Merchant', jobs: 3 },
  { name: 'Ro-Ro', fleet: 'Merchant', jobs: 2 },
  { name: 'General Cargo', fleet: 'Merchant', jobs: 6 },
  { name: 'PSV', fleet: 'Offshore', jobs: 7 },
  { name: 'AHTS', fleet: 'Offshore', jobs: 5 },
  { name: 'Drilling Rig', fleet: 'Offshore', jobs: 1 },
  { name: 'Crew Boat', fleet: 'Offshore', jobs: 2 },
  { name: 'Cruise Ship', fleet: 'Passenger / Cruise', jobs: 8 },
  { name: 'Ferry', fleet: 'Passenger / Cruise', jobs: 3 },
  { name: 'Yacht', fleet: 'Passenger / Cruise', jobs: 1 },
  { name: 'Fishing Trawler', fleet: 'Fishing', jobs: 2 },
  { name: 'Fish Factory', fleet: 'Fishing', jobs: 0 },
]

/** вписане моряками «Other» (відповідь 63 — так, з модерацією) */
export type OtherEntry = { id: string; text: string; list: 'Должность' | 'Тип судна' | 'Департамент'; context: string; people: number; first: string }
export const OTHER_ENTRIES: OtherEntry[] = [
  { id: 'ot1', text: 'Reefer Engineer', list: 'Должность', context: 'Merchant → Engine', people: 6, first: '2026-10-14' },
  { id: 'ot2', text: 'Cable Layer', list: 'Тип судна', context: 'Offshore', people: 3, first: '2026-10-20' },
  { id: 'ot3', text: 'Gas Engineer', list: 'Должность', context: 'Merchant → Engine', people: 4, first: '2026-10-22' },
  { id: 'ot4', text: 'Spa Therapist', list: 'Должность', context: 'Passenger / Cruise → Hotel & Entertainment', people: 2, first: '2026-10-25' },
  { id: 'ot5', text: 'Second Mate', list: 'Должность', context: 'Merchant → Deck', people: 5, first: '2026-10-26' },
  { id: 'ot6', text: 'Heavy Lift', list: 'Тип судна', context: 'Merchant', people: 1, first: '2026-11-01' },
]

/* ---------- публікації (відповіді 124, 158) ---------- */

export type APostState = 'complaint' | 'published' | 'hidden'
export const APOST_STATE_LABEL: Record<APostState, string> = { complaint: 'Есть жалобы', published: 'Опубликована', hidden: 'Скрыта' }

export type APost = { id: string; author: string; initials: string; authorId?: string; role: string; text: string; photos: number; date: string; complaints: number; reasons: string[]; state: APostState }

export const A_POSTS: APost[] = [
  { id: 'ap1', author: 'Mehmet Y.', initials: 'MY', authorId: 'u09', role: 'Bosun · Offshore', text: 'Срочно! Места на суда без опыта, оформление за 3 дня. Оплата за трудоустройство 500 $, пишите в личку.', photos: 0, date: '2026-11-02 07:50', complaints: 5, reasons: ['Оплата за трудоустройство', 'Спам'], state: 'complaint' },
  { id: 'ap2', author: 'Ramon C.', initials: 'RC', authorId: 'u07', role: 'OS · Container Ship', text: 'Агентство в Маниле третий месяц не возвращает документы. Не ведитесь на их обещания, название в комментариях.', photos: 1, date: '2026-11-01 19:12', complaints: 2, reasons: ['Обвинения без доказательств'], state: 'complaint' },
  { id: 'ap3', author: 'Марко Петров', initials: 'МП', role: 'Chief Officer · Bulk Carrier', text: 'Закончил 6-месячный контракт на MV Nordic Star. Отличный экипаж, ротация по графику, зарплата вовремя.', photos: 1, date: '2026-11-01 12:30', complaints: 0, reasons: [], state: 'published' },
  { id: 'ap4', author: 'Ирина Бондарь', initials: 'ИБ', role: '2nd Officer · Container Ship', text: 'Кто недавно проходил медосмотр в Одессе? Посоветуйте клинику, где делают за один день.', photos: 0, date: '2026-11-01 09:04', complaints: 0, reasons: [], state: 'published' },
  { id: 'ap5', author: 'Tomas L.', initials: 'TL', authorId: 'u08', role: 'Chief Cook · Merchant', text: 'Продаю сертификаты STCW, быстро и недорого. Все курсы, любые даты.', photos: 2, date: '2026-10-30 22:15', complaints: 7, reasons: ['Поддельные документы'], state: 'hidden' },
  { id: 'ap6', author: 'Олег Коваленко', initials: 'ОК', role: 'Master · Chemical Tanker', text: 'Совет молодым офицерам: держите сканы всех документов в одном месте и следите за сроками.', photos: 0, date: '2026-10-30 08:40', complaints: 1, reasons: ['Не по теме'], state: 'published' },
]

/* ---------- каталог полів (ADR-083) ---------- */

export type SynState = 'auto' | 'admin' | 'offer' | 'off' | 'none'
export const SYN_STATE_LABEL: Record<SynState, string> = { auto: 'Включён сам', admin: 'Включён вручную', offer: 'Предложение', off: 'Выключен', none: 'Без поля' }

export type CatalogField = {
  id: string
  label: string
  lang: string
  docType: string
  source: 'ai' | 'seafarer'
  people: number
  /** відоме поле, до якого запропоновано синонім */
  target: string | null
  confirmed: number
  rejected: number
  state: SynState
}

export const CATALOG: CatalogField[] = [
  { id: 'f1', label: 'Date of expiry', lang: 'EN', docType: 'Seafarer’s ID', source: 'ai', people: 412, target: 'Дата окончания', confirmed: 388, rejected: 2, state: 'auto' },
  { id: 'f2', label: 'Valid until', lang: 'EN', docType: 'Сертификат', source: 'ai', people: 236, target: 'Дата окончания', confirmed: 219, rejected: 5, state: 'auto' },
  { id: 'f3', label: 'Дійсний до', lang: 'UK', docType: 'Диплом', source: 'ai', people: 41, target: 'Дата окончания', confirmed: 39, rejected: 0, state: 'auto' },
  { id: 'f4', label: 'Place of issue', lang: 'EN', docType: 'Загранпаспорт', source: 'ai', people: 187, target: 'Место выдачи', confirmed: 160, rejected: 21, state: 'auto' },
  { id: 'f5', label: 'Capacity', lang: 'EN', docType: 'Диплом', source: 'ai', people: 95, target: 'Квалификация', confirmed: 31, rejected: 34, state: 'offer' },
  { id: 'f6', label: 'Grade', lang: 'EN', docType: 'Диплом', source: 'ai', people: 12, target: 'Уровень', confirmed: 2, rejected: 0, state: 'offer' },
  { id: 'f7', label: 'Номер книжки', lang: 'RU', docType: 'Seaman’s Book', source: 'seafarer', people: 8, target: 'Номер документа', confirmed: 6, rejected: 1, state: 'admin' },
  { id: 'f8', label: 'Endorsement No.', lang: 'EN', docType: 'Диплом', source: 'ai', people: 27, target: 'Номер документа', confirmed: 4, rejected: 9, state: 'off' },
  { id: 'f9', label: 'Blood group', lang: 'EN', docType: 'Медицинский', source: 'ai', people: 19, target: null, confirmed: 0, rejected: 0, state: 'none' },
  { id: 'f10', label: 'Watchkeeping', lang: 'EN', docType: 'Сертификат', source: 'ai', people: 14, target: null, confirmed: 0, rejected: 0, state: 'none' },
  { id: 'f11', label: 'Kurs', lang: 'PL', docType: 'Сертификат', source: 'seafarer', people: 3, target: 'Название', confirmed: 1, rejected: 1, state: 'offer' },
]

export const KNOWN_FIELDS = ['Фамилия', 'Имя', 'Дата рождения', 'Номер документа', 'Дата выдачи', 'Дата окончания', 'Место выдачи', 'Кем выдан', 'Название', 'Квалификация', 'Уровень', 'Правило STCW', 'Ограничения']

/* ---------- рушії (ADR-068) ---------- */

export type EngineState = 'working' | 'disabled-by-admin' | 'daily-limit' | 'missing-key' | 'rate-limited'
export const ENGINE_STATE_LABEL: Record<EngineState, string> = { working: 'Работает', 'disabled-by-admin': 'Выключен вручную', 'daily-limit': 'Дневной лимит исчерпан', 'missing-key': 'Нет ключа', 'rate-limited': 'Занят' }

export type Engine = {
  id: string
  label: string
  policy: 'ok' | 'check' | 'trains'
  tier: 'paid' | 'free'
  enabled: boolean
  state: EngineState
  runs: number
  cost: number
  reqLimit: number | null
  usdLimit: number | null
  timeout: number | null
  readsForms: boolean
}

export const POLICY_LABEL: Record<Engine['policy'], string> = { ok: 'реальные документы', check: 'условия не проверены', trains: 'может обучаться на данных' }

export const ENGINES: Engine[] = [
  { id: 'claude-sonnet', label: 'Claude Sonnet', policy: 'ok', tier: 'paid', enabled: true, state: 'working', runs: 148, cost: 2.31, reqLimit: 600, usdLimit: 15, timeout: null, readsForms: true },
  { id: 'gpt-vision', label: 'GPT Vision', policy: 'ok', tier: 'paid', enabled: true, state: 'working', runs: 37, cost: 0.74, reqLimit: 200, usdLimit: 5, timeout: 90, readsForms: true },
  { id: 'gemini-flash-lite', label: 'Gemini Flash-Lite', policy: 'trains', tier: 'free', enabled: true, state: 'daily-limit', runs: 500, cost: 0, reqLimit: 500, usdLimit: null, timeout: null, readsForms: false },
  { id: 'two-stage', label: 'Двухэтапный (OCR + Claude)', policy: 'ok', tier: 'paid', enabled: false, state: 'disabled-by-admin', runs: 0, cost: 0, reqLimit: null, usdLimit: 3, timeout: 120, readsForms: false },
  { id: 'cf-qwen', label: 'Cloudflare Qwen', policy: 'check', tier: 'free', enabled: true, state: 'rate-limited', runs: 12, cost: 0, reqLimit: 100, usdLimit: null, timeout: 300, readsForms: false },
  { id: 'mistral-ocr', label: 'Mistral OCR', policy: 'check', tier: 'paid', enabled: false, state: 'missing-key', runs: 0, cost: 0, reqLimit: null, usdLimit: null, timeout: null, readsForms: false },
]

export type EngineChange = { id: string; when: string; who: string; engine: string; what: string }
export const ENGINE_CHANGES: EngineChange[] = [
  { id: 'c1', when: '2026-11-02 09:12', who: 'admin@seafolio.example', engine: 'two-stage', what: 'Включён: вкл. → выкл.' },
  { id: 'c2', when: '2026-11-01 17:40', who: 'admin@seafolio.example', engine: 'gpt-vision', what: 'Тайм-аут: по умолчанию → 90 с' },
  { id: 'c3', when: '2026-11-01 17:38', who: 'admin@seafolio.example', engine: 'claude-sonnet', what: 'USD в день: 10 → 15' },
  { id: 'c4', when: '2026-10-30 11:05', who: 'max@seafolio.example', engine: 'gemini-flash-lite', what: 'Запусков в день: без лимита → 500' },
  { id: 'c5', when: '2026-10-29 08:20', who: 'max@seafolio.example', engine: 'claude-sonnet', what: 'По умолчанию для документов: GPT Vision → Claude Sonnet' },
]

/* ---------- витрати AI (ADR-029) ---------- */

export type Period = 'today' | 'week' | 'month'
export const BUDGET = { spentToday: 3.05, daily: 20 }

/** витрати за дні поточного місяця, USD */
export const DAILY_COST: { day: string; usd: number }[] = [
  ['10-20', 1.12], ['10-21', 2.4], ['10-22', 1.85], ['10-23', 3.9], ['10-24', 2.2], ['10-25', 0.9], ['10-26', 0.65], ['10-27', 4.8], ['10-28', 6.1], ['10-29', 5.4], ['10-30', 7.85], ['10-31', 4.3], ['11-01', 2.75], ['11-02', 3.05],
].map(([day, usd]) => ({ day: day as string, usd: usd as number }))

export type UsageRow = { id: string; label: string; runs: number; ok: number; failed: number; running: number; failures: string; tokensIn: number; tokensOut: number; cost: number; avgSec: number; tier: 'paid' | 'free' }

const U = (k: number): UsageRow[] => [
  { id: 'claude-sonnet', label: 'Claude Sonnet', runs: 148 * k, ok: 141 * k, failed: 5 * k, running: 2, failures: 'тайм-аут 3 · неверный ответ 2', tokensIn: 412_000 * k, tokensOut: 61_000 * k, cost: 2.31 * k, avgSec: 11.4, tier: 'paid' },
  { id: 'gpt-vision', label: 'GPT Vision', runs: 37 * k, ok: 35 * k, failed: 2 * k, running: 0, failures: 'занят 2', tokensIn: 98_000 * k, tokensOut: 14_500 * k, cost: 0.74 * k, avgSec: 9.8, tier: 'paid' },
  { id: 'gemini-flash-lite', label: 'Gemini Flash-Lite', runs: 500 * k, ok: 471 * k, failed: 29 * k, running: 0, failures: 'дневной лимит 21 · неверный ответ 8', tokensIn: 1_210_000 * k, tokensOut: 188_000 * k, cost: 0, avgSec: 6.2, tier: 'free' },
  { id: 'cf-qwen', label: 'Cloudflare Qwen', runs: 12 * k, ok: 7 * k, failed: 5 * k, running: 0, failures: 'тайм-аут 5', tokensIn: 30_000 * k, tokensOut: 9_000 * k, cost: 0, avgSec: 184, tier: 'free' },
]

export const USAGE: Record<Period, UsageRow[]> = { today: U(1), week: U(5), month: U(14) }
export const PHOTOS: Record<Period, { sent: number; atLimit: number }> = { today: { sent: 318, atLimit: 2 }, week: { sent: 1_540, atLimit: 9 }, month: { sent: 4_210, atLimit: 17 } }

/* ---------- лабораторія (ADR-069) ---------- */

export type LabStatus = 'CONFIRMED' | 'NEEDS_REVIEW' | 'FAILED' | 'PROCESSING'
export const LAB_STATUS_LABEL: Record<LabStatus, string> = { CONFIRMED: 'Подтверждено', NEEDS_REVIEW: 'Требует проверки', FAILED: 'Ошибка', PROCESSING: 'Обработка' }

export type LabItem = { id: string; when: string; category: string; test: boolean; status: LabStatus; photos: number; runs: number; confirmed: boolean }

export const LAB: LabItem[] = [
  { id: 'ex-7f3a', when: '2026-11-02 09:40', category: 'Seafarer’s ID', test: true, status: 'CONFIRMED', photos: 2, runs: 3, confirmed: true },
  { id: 'ex-7e91', when: '2026-11-02 09:12', category: 'Диплом', test: false, status: 'NEEDS_REVIEW', photos: 1, runs: 1, confirmed: false },
  { id: 'ex-7d20', when: '2026-11-02 08:55', category: 'Медицинский', test: false, status: 'CONFIRMED', photos: 3, runs: 2, confirmed: true },
  { id: 'ex-7c08', when: '2026-11-01 22:18', category: 'Сертификат', test: true, status: 'FAILED', photos: 1, runs: 2, confirmed: false },
  { id: 'ex-7b55', when: '2026-11-01 19:03', category: 'Загранпаспорт', test: false, status: 'CONFIRMED', photos: 1, runs: 1, confirmed: true },
  { id: 'ex-7a12', when: '2026-11-01 16:47', category: 'Seaman’s Book', test: true, status: 'PROCESSING', photos: 4, runs: 1, confirmed: false },
  { id: 'ex-79c3', when: '2026-11-01 11:20', category: 'Диплом', test: true, status: 'CONFIRMED', photos: 1, runs: 3, confirmed: true },
]

export type LabRun = { engine: string; state: 'ok' | 'failed'; sec: number; cost: string; tokens: string; error?: string }
export const LAB_RUNS: LabRun[] = [
  { engine: 'Claude Sonnet', state: 'ok', sec: 10.8, cost: '$0,016', tokens: '2 840 / 410' },
  { engine: 'GPT Vision', state: 'ok', sec: 8.9, cost: '$0,021', tokens: '2 610 / 395' },
  { engine: 'Gemini Flash-Lite', state: 'failed', sec: 60, cost: '$0', tokens: '2 790 / 0', error: 'TIMEOUT: нет ответа за 60 с' },
]

/** значення — лише тестового документа (ADR-069 п. 1) */
export type LabField = { field: string; confirmed: string; a: string; b: string }
export const LAB_FIELDS: LabField[] = [
  { field: 'Фамилия', confirmed: 'TESTOV', a: 'TESTOV', b: 'TESTOV' },
  { field: 'Имя', confirmed: 'IVAN', a: 'IVAN', b: 'IVAN' },
  { field: 'Дата рождения', confirmed: '01.01.1990', a: '01.01.1990', b: '01.07.1990' },
  { field: 'Номер документа', confirmed: 'TS 000001', a: 'TS 000001', b: 'TS 000001' },
  { field: 'Дата выдачи', confirmed: '15.03.2024', a: '15.03.2024', b: '15.03.2024' },
  { field: 'Дата окончания', confirmed: '14.03.2029', a: '14.03.2029', b: '14.03.2024' },
  { field: 'Кем выдан', confirmed: 'Test Maritime Authority', a: 'Test Maritime Authority', b: 'Test Maritime Auth.' },
  { field: 'Гражданство', confirmed: 'Тестовая страна', a: 'Тестовая страна', b: 'Тестовая страна' },
]

export type EffRow = { engine: string; docs: number; correct: number; compared: number; cost: string; sec: number; corrected: string; mock?: boolean }
export const EFFECT: EffRow[] = [
  { engine: 'Claude Sonnet', docs: 64, correct: 1_146, compared: 1_212, cost: '$0,017', sec: 11.2, corrected: 'Кем выдан, Место выдачи' },
  { engine: 'GPT Vision', docs: 41, correct: 701, compared: 768, cost: '$0,022', sec: 9.6, corrected: 'Дата окончания, Квалификация' },
  { engine: 'Gemini Flash-Lite', docs: 58, correct: 902, compared: 1_090, cost: '$0', sec: 6.4, corrected: 'Дата рождения, Номер документа' },
  { engine: 'Cloudflare Qwen', docs: 9, correct: 121, compared: 168, cost: '$0', sec: 181, corrected: 'Кем выдан' },
  { engine: 'mock', docs: 12, correct: 0, compared: 0, cost: '$0', sec: 0.1, corrected: '—', mock: true },
]

/** по полю: % по рушіях; null — мала вибірка (< 5 реальних документів) */
export const EFFECT_FIELDS: { field: string; vals: (number | null)[] }[] = [
  { field: 'Фамилия', vals: [99, 98, 96, 93] },
  { field: 'Имя', vals: [98, 97, 95, 90] },
  { field: 'Дата рождения', vals: [97, 95, 84, 81] },
  { field: 'Номер документа', vals: [96, 94, 86, null] },
  { field: 'Дата окончания', vals: [95, 88, 90, null] },
  { field: 'Кем выдан', vals: [86, 89, 79, 62] },
  { field: 'Место выдачи', vals: [84, 87, 80, null] },
]
export const EFFECT_ENGINES = ['Claude Sonnet', 'GPT Vision', 'Gemini Flash-Lite', 'Cloudflare Qwen']
export const AGREEMENT: { pair: string; rate: number; fields: number }[] = [
  { pair: 'Claude Sonnet и GPT Vision', rate: 93, fields: 640 },
  { pair: 'Claude Sonnet и Gemini Flash-Lite', rate: 86, fields: 902 },
  { pair: 'GPT Vision и Gemini Flash-Lite', rate: 84, fields: 577 },
  { pair: 'Claude Sonnet и Cloudflare Qwen', rate: 74, fields: 121 },
]
