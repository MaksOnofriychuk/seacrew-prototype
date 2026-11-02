// Дані екранів «Веб рекрутера, частина 1» (пошук моряків, профіль, кандидати, запрошення). Усе вигадане.
import { ASSIGNMENTS, INVITATIONS, SEAFARERS, type Assignment, type InvitationStatus, type WebSeafarer } from './data-web'
import { formTitle, type Chat, type ChatMsg } from './data-recruiter-2'

/** «Сегодня» прототипу — для нових запрошень і анкет. */
export const TODAY = '2026-11-02'

/* ---------- стаж по контрактах (правка №34) ---------- */

// Контракти, які моряк указав у профілі (не обов'язково всі — загальний стаж він вказує окремо).
// Рекрутер бачить стаж у місяцях. Якщо моряк сховав загальний стаж — лише по кожному контракту.
export type SeaContract = { position: string; vesselType: string; months: number; year: number }

export const CONTRACTS: Record<string, SeaContract[]> = {
  sf01: [
    { position: '3rd Engineer', vesselType: 'Chemical Tanker', months: 5, year: 2026 },
    { position: '3rd Engineer', vesselType: 'Chemical Tanker', months: 6, year: 2025 },
    { position: '4th Engineer', vesselType: 'Product Tanker', months: 7, year: 2024 },
    { position: '4th Engineer', vesselType: 'Product Tanker', months: 8, year: 2023 },
    { position: 'Motorman', vesselType: 'Bulk Carrier', months: 12, year: 2022 },
  ],
  sf02: [
    { position: 'Chief Officer', vesselType: 'Bulk Carrier', months: 5, year: 2026 },
    { position: 'Chief Officer', vesselType: 'Container Ship', months: 6, year: 2025 },
    { position: 'Chief Officer', vesselType: 'Bulk Carrier', months: 6, year: 2024 },
    { position: 'Chief Officer', vesselType: 'Container Ship', months: 5, year: 2023 },
  ],
  sf03: [
    { position: 'AB (Able Seaman)', vesselType: 'Container Ship', months: 9, year: 2026 },
    { position: 'AB (Able Seaman)', vesselType: 'Container Ship', months: 9, year: 2025 },
    { position: 'OS (Ordinary Seaman)', vesselType: 'Bulk Carrier', months: 8, year: 2024 },
  ],
  sf04: [
    { position: 'ETO (Electro-Technical Officer)', vesselType: 'AHTS', months: 5, year: 2026 },
    { position: 'ETO (Electro-Technical Officer)', vesselType: 'PSV', months: 6, year: 2025 },
    { position: 'Electrician', vesselType: 'PSV', months: 6, year: 2024 },
  ],
  sf05: [
    { position: 'DPO (Dynamic Positioning Operator)', vesselType: 'PSV', months: 4, year: 2026 },
    { position: 'DPO (Dynamic Positioning Operator)', vesselType: 'PSV', months: 4, year: 2025 },
    { position: '2nd Officer', vesselType: 'PSV', months: 5, year: 2024 },
  ],
  sf06: [
    { position: 'Chief Engineer', vesselType: 'Container Ship', months: 4, year: 2026 },
    { position: 'Chief Engineer', vesselType: 'Container Ship', months: 5, year: 2025 },
    { position: '2nd Engineer', vesselType: 'Bulk Carrier', months: 6, year: 2024 },
    { position: '2nd Engineer', vesselType: 'Bulk Carrier', months: 6, year: 2023 },
    { position: '2nd Engineer', vesselType: 'Bulk Carrier', months: 7, year: 2022 },
    { position: '3rd Engineer', vesselType: 'Bulk Carrier', months: 8, year: 2021 },
  ],
  sf07: [
    { position: '2nd Officer', vesselType: 'Cruise Ship', months: 6, year: 2026 },
    { position: '3rd Officer', vesselType: 'Cruise Ship', months: 7, year: 2025 },
  ],
  sf08: [
    { position: 'Motorman', vesselType: 'Oil Tanker', months: 7, year: 2026 },
    { position: 'Wiper', vesselType: 'Oil Tanker', months: 8, year: 2025 },
  ],
  sf09: [
    { position: 'Bosun (Boatswain)', vesselType: 'AHTS', months: 5, year: 2026 },
    { position: 'AB (Able Seaman)', vesselType: 'AHTS', months: 6, year: 2025 },
  ],
  sf10: [
    { position: '2nd Engineer', vesselType: 'LPG Carrier', months: 5, year: 2026 },
    { position: '2nd Engineer', vesselType: 'LPG Carrier', months: 6, year: 2025 },
    { position: '3rd Engineer', vesselType: 'LPG Carrier', months: 7, year: 2024 },
  ],
  sf11: [
    { position: 'Chief Cook', vesselType: 'Container Ship', months: 8, year: 2026 },
    { position: 'Chief Cook', vesselType: 'Bulk Carrier', months: 7, year: 2025 },
  ],
  sf12: [
    { position: 'Master', vesselType: 'Chemical Tanker', months: 4, year: 2026 },
    { position: 'Master', vesselType: 'Chemical Tanker', months: 5, year: 2025 },
    { position: 'Master', vesselType: 'Product Tanker', months: 4, year: 2024 },
  ],
}

export const contractsFor = (id: string) => CONTRACTS[id] ?? []

/** Стаж для фільтра: загальний, а якщо схований — сума по контрактах (її й так видно по рядках). */
export const expForFilter = (s: WebSeafarer) => s.experienceMonths ?? contractsFor(s.id).reduce((n, c) => n + c.months, 0)

/* ---------- заповненість профілю (ТЗ §6) ---------- */

// Рекрутер бачить позначку «Профиль неполный», поки профіль моряка не заповнено на 100 %. Решта — 100 %.
const PROFILE_PCT: Record<string, number> = { sf03: 70, sf08: 60, sf11: 85 }
export const profilePct = (id: string) => PROFILE_PCT[id] ?? 100

/** «38 мес.» */
export const monthsText = (m: number) => `${m} мес.`

/* ---------- запрошення (правки №22, №30; contract-recruiter-web §7) ---------- */

export type R1InviteStatus = InvitationStatus | 'cancelled'
export const R1_INVITE_LABEL: Record<R1InviteStatus, string> = { pending: 'Ждёт ответа', accepted: 'Интересно', declined: 'Отказ', cancelled: 'Отменено' }

/** Запрошення: моряку з пошуку (seafarerId) або за email акаунта (email). */
export type R1Invite = { id: string; seafarerId?: string; email?: string; jobId?: string; recruiterId: string; status: R1InviteStatus; date: string; message?: string }

export const R1_INVITES: R1Invite[] = [
  ...INVITATIONS.map((i) => ({ ...i })),
  { id: 'in05', email: 'k.morales@mail.example', recruiterId: 'rc2', status: 'declined', date: '2026-10-31', message: 'Есть место Bosun на PSV, Северное море.' },
  { id: 'in06', email: 'v.ilyin@mail.example', jobId: 'j05', recruiterId: 'rc1', status: 'cancelled', date: '2026-10-19' },
]

/* ---------- кандидати: моряки, з якими є контакт ---------- */

export type Candidate = { seafarerId: string; jobId?: string; via: 'application' | 'invitation'; since: string; conversationId?: string }

// Контакт виникає з відгуку на вакансію або з прийнятого запрошення (правка №22).
export const CANDIDATES: Candidate[] = [
  { seafarerId: 'sf01', jobId: 'j01', via: 'application', since: '2026-10-29', conversationId: 'c01' },
  { seafarerId: 'sf05', jobId: 'j03', via: 'invitation', since: '2026-10-30', conversationId: 'c02' },
  { seafarerId: 'sf02', jobId: 'j02', via: 'application', since: '2026-10-27', conversationId: 'c03' },
  { seafarerId: 'sf11', jobId: 'j05', via: 'application', since: '2026-10-24', conversationId: 'c04' },
  { seafarerId: 'sf10', jobId: 'j01', via: 'application', since: '2026-10-30' },
]

export const assignmentsOf = (seafarerId: string): Assignment[] => ASSIGNMENTS.filter((a) => a.seafarerId === seafarerId)

// Переписка кандидата — та сама розмова, що в «Сообщениях» (r-chat, дані частини 2): спершу за вакансією, інакше будь-яка з моряком.
// Кандидат за запрошенням без розмови (conversationId не задано) переписки ще не має.
export const chatOf = (chats: Chat[], c: Candidate) =>
  c.conversationId === undefined && c.via === 'invitation'
    ? undefined
    : (chats.find((x) => x.seafarerId === c.seafarerId && x.jobId === c.jobId) ?? chats.find((x) => x.seafarerId === c.seafarerId))

/** Короткий текст повідомлення для прев'ю: текст, а для вкладень — назва. */
export const msgPreview = (m: ChatMsg) => m.text ?? (m.file ? m.file.name : m.photo ? 'Фото' : m.form ? `Анкета «${formTitle(m.form.formId)}»` : m.link ? m.link.title : '')

/** Останній рух у розмові: «29.10 12:06» → дата для сортування. */
export function lastActivity(chats: Chat[], c: Candidate) {
  const m = chatOf(chats, c)?.messages.at(-1)
  if (!m) return { text: '', sort: 0 }
  const [d, t] = m.time.split(' ')
  const [dd, mm] = d.split('.')
  return { text: m.time, sort: Number(`${mm}${dd}${t.replace(':', '')}`) }
}

/* ---------- списки для фільтрів пошуку ---------- */

const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'ru'))
const BASIC = new Set(['Basic Safety Training (STCW VI/1)', 'Proficiency in Survival Craft', 'Advanced Fire Fighting', 'Medical First Aid'])

export const CERT_OPTIONS = [...BASIC, ...uniq(SEAFARERS.flatMap((s) => s.certificates).filter((c) => !BASIC.has(c)))]
export const VISA_OPTIONS = uniq(SEAFARERS.flatMap((s) => s.visas))
export const AIRPORT_OPTIONS = uniq(SEAFARERS.map((s) => s.airport))
export const EXP_OPTIONS = [
  { value: '12', label: 'от 12 мес.' },
  { value: '36', label: 'от 36 мес.' },
  { value: '60', label: 'от 60 мес.' },
  { value: '120', label: 'от 120 мес.' },
]
export const AVAIL_FILTER = [
  { value: 'now', label: 'Готов сейчас' },
  { value: 'from', label: 'Готов с даты' },
  { value: 'not', label: 'Не ищет работу' },
]
