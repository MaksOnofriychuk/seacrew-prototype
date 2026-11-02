// Спільні вигадані дані вебу (кабінет рекрутера й адмінка). Реальних людей, компаній і документів немає.
// Що рекрутер бачить про моряка — за правкою №30: ім'я + перша літера прізвища, без прізвища, контактів, фото й файлів.
import type { Availability } from './data'

/* ---------- організація-рекрутер і рекрутери ---------- */

export const RECRUITER_ORG = {
  id: 'org-bw',
  name: 'BlueWave Crewing',
  short: 'BW',
  country: 'Кипр',
  city: 'Лимасол',
  site: 'bluewave-crewing.example',
  verified: true,
  created: '2026-09-14',
}

export type RecruiterRole = 'owner' | 'admin' | 'recruiter'
export const RECRUITER_ROLE_LABEL: Record<RecruiterRole, string> = { owner: 'Владелец', admin: 'Администратор', recruiter: 'Рекрутер' }

export type Recruiter = { id: string; name: string; initials: string; email: string; role: RecruiterRole; lastSeen: string }

export const RECRUITERS: Recruiter[] = [
  { id: 'rc1', name: 'Елена Маринова', initials: 'ЕМ', email: 'elena@bluewave-crewing.example', role: 'owner', lastSeen: 'сейчас' },
  { id: 'rc2', name: 'Томас Вейль', initials: 'ТВ', email: 'thomas@bluewave-crewing.example', role: 'recruiter', lastSeen: '2 ч назад' },
  { id: 'rc3', name: 'Ана Попеску', initials: 'АП', email: 'ana@bluewave-crewing.example', role: 'recruiter', lastSeen: 'вчера' },
]

/** Рекрутер, від імені якого відкрито кабінет. */
export const ME_RECRUITER = RECRUITERS[0]

/** Адмін Seafolio (верхня панель адмінки). */
export const ME_ADMIN = { name: 'Команда Seafolio', initials: 'SF', email: 'admin@seafolio.example' }

/* ---------- моряки (як їх бачить рекрутер) ---------- */

export type WebSeafarer = {
  id: string
  /** «Andrii K.» — ім'я і перша літера прізвища */
  name: string
  initials: string
  position: string
  fleet: string
  department: string
  /** загальний досвід у місяцях; null — моряк приховав загальний стаж (правка №34) */
  experienceMonths: number | null
  nationality: string
  airport: string
  visas: string[]
  availability: Availability
  englishLevel: 'A2' | 'B1' | 'B2' | 'C1'
  certificates: string[]
  diplomas: string[]
  /** медкомісія: назва і до якої дати дійсна */
  medical: { title: string; until: string } | null
  /** «Характеристики, промоушены» — лише позначка «есть» (правки №27, №30) */
  promotions: boolean
  about: string
  updated: string
}

const STCW = ['Basic Safety Training (STCW VI/1)', 'Proficiency in Survival Craft', 'Advanced Fire Fighting', 'Medical First Aid']

export const SEAFARERS: WebSeafarer[] = [
  { id: 'sf01', name: 'Andrii K.', initials: 'AK', position: '3rd Engineer', fleet: 'Merchant', department: 'Engine', experienceMonths: 38, nationality: 'Украина', airport: 'Кишинёв (KIV)', visas: ['Шенген', 'США C1/D'], availability: { kind: 'now' }, englishLevel: 'B2', certificates: [...STCW, 'ECDIS'], diplomas: ['3rd Engineer (III/1)'], medical: { title: 'Медицинский сертификат (ILO/STCW)', until: '2027-06-30' }, promotions: true, about: 'Химические танкеры, MAN B&W. Ищу контракт 4 ±1 мес.', updated: '2026-11-01' },
  { id: 'sf02', name: 'Giorgi B.', initials: 'GB', position: 'Chief Officer', fleet: 'Merchant', department: 'Deck', experienceMonths: 112, nationality: 'Грузия', airport: 'Тбилиси (TBS)', visas: ['Шенген'], availability: { kind: 'from', date: '2026-12-15' }, englishLevel: 'C1', certificates: [...STCW, 'ECDIS', 'Ship Security Officer'], diplomas: ['Chief Mate (II/2)'], medical: { title: 'Медицинский сертификат (ILO/STCW)', until: '2027-02-11' }, promotions: true, about: 'Балкеры и контейнеровозы, 9 лет в должности старпома.', updated: '2026-10-30' },
  { id: 'sf03', name: 'Mark Anthony R.', initials: 'MR', position: 'AB (Able Seaman)', fleet: 'Merchant', department: 'Deck', experienceMonths: 54, nationality: 'Филиппины', airport: 'Манила (MNL)', visas: [], availability: { kind: 'now' }, englishLevel: 'B2', certificates: STCW, diplomas: ['Able Seafarer Deck (II/5)'], medical: { title: 'Медицинский сертификат (ILO/STCW)', until: '2027-01-20' }, promotions: false, about: 'Контейнеровозы, готов к длинным контрактам.', updated: '2026-10-29' },
  { id: 'sf04', name: 'Rahul S.', initials: 'RS', position: 'ETO (Electro-Technical Officer)', fleet: 'Offshore', department: 'Engine', experienceMonths: 71, nationality: 'Индия', airport: 'Мумбаи (BOM)', visas: ['Шенген', 'Великобритания'], availability: { kind: 'from', date: '2027-01-10' }, englishLevel: 'C1', certificates: [...STCW, 'High Voltage', 'DP Induction'], diplomas: ['ETO (III/6)'], medical: { title: 'OGUK Offshore Medical', until: '2027-04-02' }, promotions: true, about: 'PSV и AHTS, системы DP2.', updated: '2026-10-28' },
  { id: 'sf05', name: 'Janis O.', initials: 'JO', position: 'DPO (Dynamic Positioning Operator)', fleet: 'Offshore', department: 'Deck', experienceMonths: 64, nationality: 'Латвия', airport: 'Рига (RIX)', visas: ['Шенген', 'США C1/D'], availability: { kind: 'now' }, englishLevel: 'C1', certificates: [...STCW, 'DP Unlimited', 'BOSIET'], diplomas: ['Officer in Charge of a Navigational Watch (II/1)'], medical: { title: 'OGUK Offshore Medical', until: '2026-12-20' }, promotions: false, about: 'Северное море, ротация 4/4.', updated: '2026-10-31' },
  { id: 'sf06', name: 'Piotr W.', initials: 'PW', position: 'Chief Engineer', fleet: 'Merchant', department: 'Engine', experienceMonths: null, nationality: 'Польша', airport: 'Гданьск (GDN)', visas: ['Шенген'], availability: { kind: 'not' }, englishLevel: 'B2', certificates: [...STCW, 'ECDIS'], diplomas: ['Chief Engineer (III/2)'], medical: { title: 'Медицинский сертификат (ILO/STCW)', until: '2027-08-15' }, promotions: true, about: 'Сейчас на контракте, вернусь к поиску весной.', updated: '2026-10-12' },
  { id: 'sf07', name: 'Mihai D.', initials: 'MD', position: '2nd Officer', fleet: 'Passenger / Cruise', department: 'Deck', experienceMonths: 46, nationality: 'Румыния', airport: 'Бухарест (OTP)', visas: ['Шенген', 'США C1/D'], availability: { kind: 'from', date: '2026-12-01' }, englishLevel: 'C1', certificates: [...STCW, 'Crowd Management', 'Crisis Management'], diplomas: ['Officer in Charge of a Navigational Watch (II/1)'], medical: { title: 'Медицинский сертификат (ILO/STCW)', until: '2027-03-09' }, promotions: false, about: 'Круизные суда, Средиземноморье и Карибы.', updated: '2026-10-27' },
  { id: 'sf08', name: 'Elvin H.', initials: 'EH', position: 'Motorman', fleet: 'Merchant', department: 'Engine', experienceMonths: 29, nationality: 'Азербайджан', airport: 'Баку (GYD)', visas: [], availability: { kind: 'now' }, englishLevel: 'A2', certificates: STCW, diplomas: ['Able Seafarer Engine (III/5)'], medical: { title: 'Медицинский сертификат (ILO/STCW)', until: '2027-05-01' }, promotions: false, about: 'Танкеры, готов выехать сразу.', updated: '2026-10-25' },
  { id: 'sf09', name: 'Nikola T.', initials: 'NT', position: 'Bosun (Boatswain)', fleet: 'Offshore', department: 'Deck', experienceMonths: 97, nationality: 'Хорватия', airport: 'Сплит (SPU)', visas: ['Шенген'], availability: { kind: 'now' }, englishLevel: 'B1', certificates: [...STCW, 'Rigging & Slinging', 'BOSIET'], diplomas: ['Able Seafarer Deck (II/5)'], medical: null, promotions: true, about: 'Якорные работы, буксировка платформ.', updated: '2026-10-22' },
  { id: 'sf10', name: 'Dmytro S.', initials: 'DS', position: '2nd Engineer', fleet: 'Merchant', department: 'Engine', experienceMonths: 83, nationality: 'Украина', airport: 'Варшава (WAW)', visas: ['Шенген'], availability: { kind: 'from', date: '2027-02-01' }, englishLevel: 'B2', certificates: [...STCW, 'Tanker Familiarization'], diplomas: ['2nd Engineer (III/2)'], medical: { title: 'Медицинский сертификат (ILO/STCW)', until: '2027-07-19' }, promotions: true, about: 'Газовозы LPG, бонус за продление — не против.', updated: '2026-10-20' },
  { id: 'sf11', name: 'Ivan P.', initials: 'IP', position: 'Chief Cook', fleet: 'Merchant', department: 'Catering', experienceMonths: 120, nationality: 'Болгария', airport: 'Варна (VAR)', visas: ['Шенген'], availability: { kind: 'now' }, englishLevel: 'B1', certificates: [...STCW, 'Ship Cook Certificate', 'Food Hygiene'], diplomas: [], medical: { title: 'Медицинский сертификат (ILO/STCW)', until: '2027-04-30' }, promotions: false, about: 'Смешанные экипажи до 25 человек.', updated: '2026-10-18' },
  { id: 'sf12', name: 'Oleksandr M.', initials: 'OM', position: 'Master', fleet: 'Merchant', department: 'Deck', experienceMonths: 168, nationality: 'Украина', airport: 'Кишинёв (KIV)', visas: ['Шенген', 'США C1/D', 'Великобритания'], availability: { kind: 'not' }, englishLevel: 'C1', certificates: [...STCW, 'ECDIS', 'Ship Security Officer'], diplomas: ['Master (II/2)'], medical: { title: 'Медицинский сертификат (ILO/STCW)', until: '2027-09-03' }, promotions: true, about: 'Химовозы, 6 лет капитаном.', updated: '2026-10-15' },
]

export const seafarerById = (id: string) => SEAFARERS.find((s) => s.id === id)

/** 38 → «3 г. 2 мес.»; null → «скрыт» */
export function expText(months: number | null) {
  if (months === null) return 'скрыт'
  const y = Math.floor(months / 12)
  const m = months % 12
  return [y ? `${y} г.` : '', m ? `${m} мес.` : ''].filter(Boolean).join(' ') || '0 мес.'
}

/* ---------- вакансії ---------- */

export type JobStatus = 'open' | 'draft' | 'closed'
export const JOB_STATUS_LABEL: Record<JobStatus, string> = { open: 'Открыта', draft: 'Черновик', closed: 'Закрыта' }

export type WebJob = {
  id: string
  position: string
  fleet: string
  department: string
  vesselType: string
  vesselName: string
  salary: { amount: string; currency: '$' | '€' | '£'; period: 'день' | 'месяц' }
  region: 'Европа' | 'Африка' | 'ОАЭ'
  board: string
  /** «4 мес.» / «6 недель» */
  duration: string
  status: JobStatus
  recruiterId: string
  created: string
  description: string
}

export const WEB_JOBS: WebJob[] = [
  { id: 'j01', position: '3rd Engineer', fleet: 'Merchant', department: 'Engine', vesselType: 'Chemical Tanker', vesselName: 'MT Aurora Spirit', salary: { amount: '4 200–4 600', currency: '$', period: 'месяц' }, region: 'Европа', board: '2026-12-05', duration: '4 ±1 мес.', status: 'open', recruiterId: 'rc1', created: '2026-10-28', description: 'Надёжный судовладелец, смена экипажа в ЕС, интернет на борту.' },
  { id: 'j02', position: 'Chief Officer', fleet: 'Merchant', department: 'Deck', vesselType: 'Bulk Carrier', vesselName: 'MV Nordic Star', salary: { amount: '8 500', currency: '$', period: 'месяц' }, region: 'ОАЭ', board: '2026-12-20', duration: '6 мес.', status: 'open', recruiterId: 'rc2', created: '2026-10-25', description: 'Supramax, линия Персидский залив — Индия.' },
  { id: 'j03', position: 'DPO (Dynamic Positioning Operator)', fleet: 'Offshore', department: 'Deck', vesselType: 'PSV', vesselName: 'Sea Harrier', salary: { amount: '450', currency: '€', period: 'день' }, region: 'Европа', board: '2026-11-25', duration: '4 недели', status: 'open', recruiterId: 'rc1', created: '2026-10-30', description: 'Северное море, ротация 4/4, DP2.' },
  { id: 'j04', position: 'ETO (Electro-Technical Officer)', fleet: 'Offshore', department: 'Engine', vesselType: 'AHTS', vesselName: 'Ocean Titan', salary: { amount: '380', currency: '£', period: 'день' }, region: 'Африка', board: '2027-01-15', duration: '5 недель', status: 'draft', recruiterId: 'rc3', created: '2026-11-01', description: 'Западная Африка, высокое напряжение.' },
  { id: 'j05', position: 'Chief Cook', fleet: 'Merchant', department: 'Catering', vesselType: 'Container Ship', vesselName: 'MV Baltic Way', salary: { amount: '2 900', currency: '$', period: 'месяц' }, region: 'ОАЭ', board: '2026-12-10', duration: '6 мес.', status: 'open', recruiterId: 'rc2', created: '2026-10-21', description: 'Смешанный экипаж 22 человека.' },
  { id: 'j06', position: '2nd Officer', fleet: 'Passenger / Cruise', department: 'Deck', vesselType: 'Cruise Ship', vesselName: 'Aegean Pearl', salary: { amount: '5 100', currency: '€', period: 'месяц' }, region: 'Европа', board: '2026-11-10', duration: '4 мес.', status: 'closed', recruiterId: 'rc1', created: '2026-09-30', description: 'Средиземноморье, сезон до марта.' },
]

export const jobById = (id: string) => WEB_JOBS.find((j) => j.id === id)
/** «$4 200–4 600 / месяц» */
export const salaryText = (j: WebJob) => `${j.salary.currency}${j.salary.amount} / ${j.salary.period}`

/* ---------- відгуки на вакансії (статуси — відповіді 98, 108; правка №22) ---------- */

export type ApplicationStatus = 'sent' | 'waiting' | 'match' | 'rejected'
export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = { sent: 'Отправлено', waiting: 'Ожидание', match: 'Метч', rejected: 'Отклонено' }

export type Application = { id: string; jobId: string; seafarerId: string; status: ApplicationStatus; date: string }

export const APPLICATIONS: Application[] = [
  { id: 'ap01', jobId: 'j01', seafarerId: 'sf01', status: 'match', date: '2026-10-29' },
  { id: 'ap02', jobId: 'j01', seafarerId: 'sf10', status: 'waiting', date: '2026-10-30' },
  { id: 'ap03', jobId: 'j01', seafarerId: 'sf08', status: 'sent', date: '2026-11-01' },
  { id: 'ap04', jobId: 'j02', seafarerId: 'sf02', status: 'waiting', date: '2026-10-27' },
  { id: 'ap05', jobId: 'j02', seafarerId: 'sf12', status: 'rejected', date: '2026-10-26' },
  { id: 'ap06', jobId: 'j03', seafarerId: 'sf05', status: 'match', date: '2026-10-31' },
  { id: 'ap07', jobId: 'j03', seafarerId: 'sf09', status: 'sent', date: '2026-11-01' },
  { id: 'ap08', jobId: 'j05', seafarerId: 'sf11', status: 'sent', date: '2026-10-24' },
  { id: 'ap09', jobId: 'j06', seafarerId: 'sf07', status: 'rejected', date: '2026-10-05' },
  { id: 'ap10', jobId: 'j02', seafarerId: 'sf03', status: 'sent', date: '2026-11-02' },
]

export const applicationsFor = (jobId: string) => APPLICATIONS.filter((a) => a.jobId === jobId)

/* ---------- запрошення «Позвать на работу» (правки №22, №30) ---------- */

export type InvitationStatus = 'pending' | 'accepted' | 'declined'
export const INVITATION_STATUS_LABEL: Record<InvitationStatus, string> = { pending: 'Ждёт ответа', accepted: 'Интересно', declined: 'Отказ' }

export type Invitation = { id: string; seafarerId: string; jobId: string; recruiterId: string; status: InvitationStatus; date: string }

export const INVITATIONS: Invitation[] = [
  { id: 'in01', seafarerId: 'sf04', jobId: 'j04', recruiterId: 'rc3', status: 'pending', date: '2026-11-01' },
  { id: 'in02', seafarerId: 'sf05', jobId: 'j03', recruiterId: 'rc1', status: 'accepted', date: '2026-10-30' },
  { id: 'in03', seafarerId: 'sf06', jobId: 'j01', recruiterId: 'rc1', status: 'declined', date: '2026-10-22' },
  { id: 'in04', seafarerId: 'sf09', jobId: 'j03', recruiterId: 'rc2', status: 'pending', date: '2026-11-02' },
]

/* ---------- розмови ---------- */

export type WebMessage = { from: 'me' | 'them' | 'system'; text: string; time: string; read?: boolean }
export type Conversation = { id: string; seafarerId: string; jobId?: string; unread: number; online: boolean; messages: WebMessage[] }

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'c01', seafarerId: 'sf01', jobId: 'j01', unread: 2, online: true,
    messages: [
      { from: 'system', text: 'Моряк откликнулся на вакансию', time: '29.10 10:12' },
      { from: 'me', text: 'Здравствуйте, Andrii! Профиль подходит. Когда сможете выехать?', time: '29.10 11:40', read: true },
      { from: 'them', text: 'Добрый день! Готов приступить сразу, документы действующие.', time: '29.10 12:05' },
      { from: 'them', text: 'Могу прислать характеристики с последнего судна.', time: '29.10 12:06' },
    ],
  },
  {
    id: 'c02', seafarerId: 'sf05', jobId: 'j03', unread: 0, online: false,
    messages: [
      { from: 'system', text: 'Моряк подтвердил интерес к предложению', time: '30.10 09:00' },
      { from: 'me', text: 'Janis, отправила анкету компании — заполните, пожалуйста, до пятницы.', time: '30.10 09:20', read: true },
      { from: 'them', text: 'Заполнил, проверьте.', time: '31.10 18:44' },
    ],
  },
  {
    id: 'c03', seafarerId: 'sf02', jobId: 'j02', unread: 1, online: false,
    messages: [
      { from: 'system', text: 'Моряк откликнулся на вакансию', time: '27.10 14:30' },
      { from: 'them', text: 'Добрый день, какой график смены экипажа?', time: '01.11 08:15' },
    ],
  },
  {
    id: 'c04', seafarerId: 'sf11', jobId: 'j05', unread: 0, online: true,
    messages: [{ from: 'system', text: 'Моряк откликнулся на вакансию', time: '24.10 16:02' }],
  },
]

/* ---------- форми (анкети компанії) ---------- */

export type FormStatus = 'active' | 'draft'
export type WebForm = { id: string; title: string; sections: number; fields: number; status: FormStatus; source: 'manual' | 'import'; sent: number; answered: number; updated: string }

export const FORMS: WebForm[] = [
  { id: 'f01', title: 'Анкета кандидата BlueWave', sections: 6, fields: 48, status: 'active', source: 'manual', sent: 14, answered: 9, updated: '2026-10-20' },
  { id: 'f02', title: 'Offshore application form', sections: 5, fields: 36, status: 'active', source: 'import', sent: 5, answered: 3, updated: '2026-10-28' },
  { id: 'f03', title: 'Медицинская декларация', sections: 2, fields: 12, status: 'draft', source: 'manual', sent: 0, answered: 0, updated: '2026-11-01' },
]

/** Відповідь моряка на форму. */
export type Assignment = { id: string; formId: string; seafarerId: string; status: 'sent' | 'in_progress' | 'submitted'; date: string }
export const ASSIGNMENT_STATUS_LABEL: Record<Assignment['status'], string> = { sent: 'Отправлена', in_progress: 'Заполняется', submitted: 'Получена' }

export const ASSIGNMENTS: Assignment[] = [
  { id: 'as01', formId: 'f01', seafarerId: 'sf01', status: 'submitted', date: '2026-10-30' },
  { id: 'as02', formId: 'f02', seafarerId: 'sf05', status: 'submitted', date: '2026-10-31' },
  { id: 'as03', formId: 'f01', seafarerId: 'sf02', status: 'in_progress', date: '2026-11-01' },
  { id: 'as04', formId: 'f01', seafarerId: 'sf10', status: 'sent', date: '2026-11-02' },
]

/* ---------- лічильники навігації рекрутера ---------- */

export const RECRUITER_COUNTS = {
  applications: APPLICATIONS.filter((a) => a.status === 'sent').length,
  messages: CONVERSATIONS.reduce((s, c) => s + c.unread, 0),
  invitations: INVITATIONS.filter((i) => i.status === 'pending').length,
}

/* ---------- адмінка ---------- */

export type OrgStatus = 'pending' | 'verified' | 'rejected' | 'blocked'
export const ORG_STATUS_LABEL: Record<OrgStatus, string> = { pending: 'На проверке', verified: 'Проверена', rejected: 'Отклонена', blocked: 'Заблокирована' }

export type AdminOrg = { id: string; name: string; country: string; status: OrgStatus; members: number; jobs: number; created: string }

export const ADMIN_ORGS: AdminOrg[] = [
  { id: 'org-bw', name: 'BlueWave Crewing', country: 'Кипр', status: 'verified', members: 3, jobs: 6, created: '2026-09-14' },
  { id: 'org-ns', name: 'Nordline Ship Management', country: 'Норвегия', status: 'verified', members: 5, jobs: 11, created: '2026-09-20' },
  { id: 'org-mc', name: 'Meridian Crew', country: 'Польша', status: 'pending', members: 1, jobs: 0, created: '2026-10-31' },
  { id: 'org-am', name: 'Atlas Marine Services', country: 'Греция', status: 'pending', members: 2, jobs: 0, created: '2026-11-01' },
  { id: 'org-sh', name: 'Seahorse Manning', country: 'Панама', status: 'rejected', members: 1, jobs: 0, created: '2026-10-12' },
  { id: 'org-qx', name: 'Quick Crew Agency', country: 'ОАЭ', status: 'blocked', members: 2, jobs: 3, created: '2026-10-02' },
]

export type UserStatus = 'active' | 'blocked' | 'banned'
export type AdminUser = {
  id: string
  name: string
  role: 'seafarer' | 'recruiter'
  /** email частково скрыт */
  email: string
  status: UserStatus
  /** причина блокування (правка №12: 2-й поспіль не той документ) */
  reason?: string
  wrongDocs: number
  created: string
}

export const ADMIN_USERS: AdminUser[] = [
  { id: 'u01', name: 'Andrii K.', role: 'seafarer', email: 'an•••@mail.example', status: 'active', wrongDocs: 0, created: '2026-10-29' },
  { id: 'u02', name: 'Vasyl R.', role: 'seafarer', email: 'va•••@mail.example', status: 'blocked', reason: 'Дважды загружен не документ моряка', wrongDocs: 2, created: '2026-10-30' },
  { id: 'u03', name: 'Kiran P.', role: 'seafarer', email: 'ki•••@mail.example', status: 'active', wrongDocs: 1, created: '2026-11-01' },
  { id: 'u04', name: 'Елена Маринова', role: 'recruiter', email: 'el•••@bluewave-crewing.example', status: 'active', wrongDocs: 0, created: '2026-09-14' },
  { id: 'u05', name: 'Samir A.', role: 'seafarer', email: 'sa•••@mail.example', status: 'banned', reason: 'Номер документа в бан-листе', wrongDocs: 0, created: '2026-10-18' },
]

/* ---------- лічильники навігації адмінки ---------- */
// ADMIN_COUNTS — у lib/data-admin.ts: «Пользователи» рахуємо з A_USERS (ті самі, що на a-users).

