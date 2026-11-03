// Додаткові вигадані рядки для веб-адмінки (правка №53, агент E): користувачі, організації, реєстрації, бан-лист.
// Підмішуються в кінець списків у screens/a/a-users, a-orgs, a-registrations. Реальних людей і компаній немає.
import { aUser, orgDetail, type AUser, type Attempt, type BanEntry, type DocMeta, type LinkedGroup, type OrgDetail, type Trace } from './data-admin'
import type { AdminOrg, OrgStatus } from './data-web'

/* ---------- користувачі ---------- */

type U = [id: string, name: string, role: 'seafarer' | 'recruiter', pos: string, status: AUser['status'], created: string, seen: string, wrong: number]

const U_ROWS: U[] = [
  ['u12', 'Oleh B.', 'seafarer', 'Second Engineer', 'active', '2026-10-26', 'сегодня', 0],
  ['u13', 'Marta K.', 'seafarer', 'Chief Steward', 'active', '2026-10-25', 'вчера', 0],
  ['u14', 'Dmytro S.', 'seafarer', 'AB (Able Seaman)', 'blocked', '2026-10-23', '2026-10-31', 2],
  ['u15', 'Ivan T.', 'seafarer', 'Electrician', 'active', '2026-10-22', '2 дня назад', 1],
  ['u16', 'Nikolai V.', 'seafarer', 'Chief Officer', 'active', '2026-10-20', 'сегодня', 0],
  ['u17', 'Rafael M.', 'seafarer', 'Oiler', 'banned', '2026-10-19', '2026-10-27', 0],
  ['u18', 'Yurii D.', 'seafarer', 'Master', 'active', '2026-10-17', '3 дня назад', 0],
  ['u19', 'Petr H.', 'seafarer', 'Fitter', 'blocked', '2026-10-15', '2026-10-29', 2],
  ['u20', 'Alex W.', 'seafarer', 'Bosun (Boatswain)', 'active', '2026-10-12', 'неделю назад', 0],
  ['u21', 'Анна Левченко', 'recruiter', 'Atlas Marine Services', 'active', '2026-11-01', 'сегодня', 0],
  ['u22', 'Георгий Папас', 'recruiter', 'Nordline Ship Management', 'active', '2026-10-18', 'вчера', 0],
  ['u23', 'Мария Ковальчук', 'recruiter', 'BlueWave Crewing', 'active', '2026-10-02', 'сейчас', 0],
  ['u24', 'Лукаш Вишневский', 'recruiter', 'Seahorse Manning', 'blocked', '2026-10-12', '2026-10-20', 0],
  ['u25', 'Ханс Эрикссон', 'recruiter', 'Nordline Ship Management', 'active', '2026-09-22', '3 дня назад', 0],
  ['u26', 'Sandro G.', 'seafarer', '4th Engineer', 'active', '2026-10-10', 'вчера', 0],
  ['u27', 'Bogdan F.', 'seafarer', 'Deck Cadet', 'active', '2026-10-09', 'сегодня', 0],
  ['u28', 'Hasan E.', 'seafarer', 'Cook', 'active', '2026-10-08', '4 дня назад', 0],
  ['u29', 'Viktor Z.', 'seafarer', '2nd Officer', 'active', '2026-10-06', 'вчера', 0],
  ['u30', 'Mateo R.', 'seafarer', 'Pumpman', 'banned', '2026-10-04', '2026-10-14', 0],
]

const DOC_TYPES = ['Seafarer’s ID', 'Diploma (CoC)', 'Медицинский сертификат', 'Загранпаспорт', 'Basic Safety Training', 'Advanced Fire Fighting', 'Tanker Familiarization']
const STATES: DocMeta['state'][] = ['confirmed', 'confirmed', 'review', 'confirmed', 'manual']

const REASON: Record<string, string> = {
  blocked: 'Дважды загружен не документ моряка',
  banned: 'Поддельный документ',
}

export const EXTRA_USERS: AUser[] = U_ROWS.map(([id, name, role, pos, status, created, lastSeen, wrongDocs], i) => {
  const seafarer = role === 'seafarer'
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
  const slug = seafarer ? name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 2) : ['an', 'ge', 'ma', 'lu', 'ha'][i % 5]
  const docsN = seafarer && status !== 'blocked' ? 1 + (i % 4) : 0
  const blockedAt = status !== 'active' ? `${created.slice(0, 8)}${String(Math.min(28, Number(created.slice(8)) + 3)).padStart(2, '0')} 1${i % 9}:2${i % 7}` : undefined
  const attempts = wrongDocs
    ? Array.from({ length: wrongDocs }, (_, k) => ({ at: `${blockedAt?.slice(0, 11) ?? created + ' '}${k ? '1' : '0'}${i % 9}:0${k + 1}`.replace('  ', ' '), where: 'Документы, новый документ', detected: k ? 'Фото без документа' : 'Водительское удостоверение' }))
    : []
  return {
    id,
    name,
    initials,
    role,
    org: seafarer ? undefined : pos,
    position: seafarer ? pos : undefined,
    email: seafarer ? `${slug}•••@mail.example` : `${slug}•••@${pos.toLowerCase().split(' ')[0]}.example`,
    status,
    reason: status === 'active' ? undefined : status === 'blocked' && !seafarer ? 'Организация заблокирована' : REASON[status],
    blockedAt,
    wrongDocs,
    attempts,
    created,
    lastSeen,
    docs: Array.from({ length: docsN }, (_, k) => ({ type: DOC_TYPES[(i + k) % DOC_TYPES.length], added: created, pages: 1 + ((i + k) % 3), state: STATES[(i + k) % STATES.length] })),
    linked: status === 'banned' ? 1 : 0,
  }
})

/** карточка пользователя: основной список или добавленные строки */
export const aUser53 = (id: string): AUser => EXTRA_USERS.find((u) => u.id === id) ?? aUser(id)

/** журнал входов и действий пользователя: вымышленный, детерминированный по id */
export type UserLogRow = { id: string; at: string; what: string; where: string }
const LOG_WHAT = ['Вход в кабинет', 'Выход', 'Загрузка документа', 'Отклик на вакансию', 'Смена пароля', 'Открыт профиль', 'Сообщение в чате', 'Новое устройство']
const LOG_WHERE = ['Android, Киев', 'iPhone, Одесса', 'Chrome, Гданьск', 'Safari, Лимасол', 'iPhone, Варна', 'Chrome, Стамбул']
export function userLog(id: string): UserLogRow[] {
  const seed = [...id].reduce((s, c) => s + c.charCodeAt(0), 0)
  return Array.from({ length: 14 + (seed % 9) }, (_, i) => {
    const day = 2 - Math.floor(i / 4)
    const d = new Date(2026, 10, 2 + 0 * day)
    d.setDate(d.getDate() - Math.floor(i / 2))
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { id: `${id}-l${i}`, at: `${iso} ${String(8 + ((seed + i * 3) % 14)).padStart(2, '0')}:${String((seed * 7 + i * 11) % 60).padStart(2, '0')}`, what: LOG_WHAT[(seed + i) % LOG_WHAT.length], where: LOG_WHERE[(seed + i * 2) % LOG_WHERE.length] }
  })
}

/* ---------- организации ---------- */

type O = [id: string, name: string, country: string, city: string, status: OrgStatus, members: number, jobs: number, created: string, owner: string]

const O_ROWS: O[] = [
  ['org-hz', 'Horizon Crew Solutions', 'Мальта', 'Валлетта', 'pending', 1, 0, '2026-11-02', 'Мартин Борг'],
  ['org-pl', 'Polaris Maritime', 'Финляндия', 'Хельсинки', 'pending', 2, 0, '2026-11-02', 'Юха Лехтинен'],
  ['org-ct', 'Cobalt Ship Crew', 'Турция', 'Стамбул', 'pending', 1, 0, '2026-10-30', 'Эмре Йылмаз'],
  ['org-bm', 'Baltic Manning Group', 'Латвия', 'Рига', 'verified', 4, 7, '2026-10-24', 'Янис Берзиньш'],
  ['org-ar', 'Aurora Offshore Staffing', 'Великобритания', 'Абердин', 'verified', 6, 9, '2026-10-22', 'Эндрю Блэк'],
  ['org-dk', 'Danube Crewing', 'Румыния', 'Констанца', 'verified', 3, 4, '2026-10-19', 'Раду Попа'],
  ['org-gs', 'Gulf Star Marine', 'ОАЭ', 'Абу-Даби', 'verified', 5, 8, '2026-10-17', 'Халид Мансури'],
  ['org-ib', 'Iberia Seafarers', 'Испания', 'Валенсия', 'rejected', 1, 0, '2026-10-15', 'Карлос Руис'],
  ['org-nv', 'Novus Ship Agency', 'Хорватия', 'Риека', 'verified', 2, 2, '2026-10-14', 'Ивана Йелич'],
  ['org-ow', 'OceanWay Recruitment', 'Филиппины', 'Манила', 'blocked', 3, 5, '2026-10-09', 'Рамон Сантос'],
  ['org-pk', 'Pacific Keel Manning', 'Сингапур', 'Сингапур', 'verified', 7, 12, '2026-10-08', 'Ли Вэй'],
  ['org-sg', 'Sigma Crew Services', 'Украина', 'Одесса', 'verified', 4, 6, '2026-10-06', 'Олег Мельник'],
  ['org-tr', 'Tridente Marine', 'Италия', 'Генуя', 'rejected', 1, 0, '2026-10-05', 'Марко Конти'],
  ['org-va', 'Vega Navigation Crewing', 'Греция', 'Салоники', 'verified', 3, 3, '2026-09-30', 'Алексис Георгиу'],
  ['org-wk', 'Westerly Ship Staff', 'Ирландия', 'Корк', 'pending', 1, 0, '2026-11-01', 'Шон Мёрфи'],
]

export const EXTRA_ORGS: AdminOrg[] = O_ROWS.map(([id, name, country, , status, members, jobs, created]) => ({ id, name, country, status, members, jobs, created }))

const FIRST = ['Анна', 'Пётр', 'Мария', 'Ян', 'Софи', 'Лука', 'Ева', 'Марк', 'Клара', 'Тимур', 'Ольга', 'Эрик']
const FIRST_EN = ['anna', 'petr', 'maria', 'jan', 'sofi', 'luka', 'eva', 'mark', 'clara', 'timur', 'olga', 'erik']
const SECOND = ['Новак', 'Лайне', 'Росси', 'Кузьмин', 'Берг', 'Иванов', 'Дюран', 'Хансен']

const TR: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e', ю: 'yu', я: 'ya', ь: '', ъ: '' }
const translit = (t: string) => [...t.toLowerCase()].map((c) => TR[c] ?? c).join('').replace(/[^a-z]/g, '')

export function orgDetail53(id: string): OrgDetail {
  const r = O_ROWS.find((x) => x[0] === id)
  if (!r) {
    const base = orgDetail(id)
    // у BlueWave и Nordline больше людей — чтобы было что листать
    if (id !== 'org-bw' && id !== 'org-ns') return base
    return { ...base, people: [...base.people, ...morePeople(base.name, 9, base.created)] }
  }
  const [, name, country, city, status, members, , created, owner] = r
  const domain = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12) + '.example'
  const ownerEmail = `${translit(owner.split(' ')[0])}@${domain}`
  const base = EXTRA_ORGS.find((o) => o.id === id)!
  return {
    ...base,
    country,
    city,
    site: domain,
    regNumber: status === 'rejected' ? 'не указан' : `${country.slice(0, 2).toUpperCase()} ${String(400000 + created.charCodeAt(9) * 731 + members * 97)}`,
    owner: { name: owner, email: ownerEmail },
    about: status === 'rejected' ? 'Описание не заполнено.' : `Набор экипажей: ${['танкеры', 'контейнеровозы', 'балкеры', 'пассажирские суда'][members % 4]}.`,
    verifiedAt: status === 'verified' || status === 'blocked' ? created.slice(0, 8) + String(Math.min(28, Number(created.slice(8)) + 1)).padStart(2, '0') : undefined,
    people: [{ name: owner, role: 'Владелец', email: ownerEmail, joined: created }, ...morePeople(name, members - 1, created)],
  }
}

function morePeople(org: string, n: number, from: string) {
  const domain = org.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12) + '.example'
  return Array.from({ length: Math.max(0, n) }, (_, i) => {
    const f = FIRST[(org.length + i) % FIRST.length]
    const s = SECOND[(org.length * 3 + i) % SECOND.length]
    const day = Math.min(28, Number(from.slice(8)) + 1 + i)
    return { name: `${f} ${s}`, role: 'Рекрутер', email: `${FIRST_EN[(org.length + i) % FIRST_EN.length]}${i}@${domain}`, joined: `${from.slice(0, 8)}${String(day).padStart(2, '0')}` }
  })
}

/** вакансии организации (список для сворачиваемого блока): количество = o.jobs */
export type OrgJobRow = { id: string; position: string; published: string; applications: number; state: 'Открыта' | 'Снята' | 'Закрыта' }
const POSITIONS = ['3rd Engineer', 'AB (Able Seaman)', 'Chief Cook', 'Master', '2nd Officer', 'Motorman', 'Bosun (Boatswain)', 'Electrician', 'Oiler', 'Chief Officer', 'Fitter', 'Deck Cadet']
export function orgJobs(id: string, count: number): OrgJobRow[] {
  const seed = [...id].reduce((s, c) => s + c.charCodeAt(0), 0)
  return Array.from({ length: count }, (_, i) => ({
    id: `${id}-j${i}`,
    position: POSITIONS[(seed + i * 5) % POSITIONS.length],
    published: `2026-10-${String(1 + ((seed + i * 2) % 28)).padStart(2, '0')}`,
    applications: (seed * (i + 3)) % 41,
    state: i % 5 === 3 ? 'Снята' : i % 7 === 6 ? 'Закрыта' : 'Открыта',
  }))
}

/* ---------- незавершённые регистрации, связанные аккаунты, бан-лист ---------- */

const STEPS = ['Проверьте данные', 'Загрузка документа', 'Код из письма', 'Пароль', 'Выбор должности']
export const EXTRA_ATTEMPTS: Attempt[] = Array.from({ length: 14 }, (_, i) => {
  const day = 28 - i
  const month = day > 0 ? 10 : 9
  const d = day > 0 ? day : 30 + day
  const hasDoc = i % 3 !== 1
  return {
    id: `rx${i + 1}`,
    started: `2026-${month}-${String(d).padStart(2, '0')} ${String(7 + ((i * 5) % 15)).padStart(2, '0')}:${String((i * 17) % 60).padStart(2, '0')}`,
    path: i % 2 ? 'stepper' : 'quick',
    step: STEPS[i % STEPS.length],
    doc: hasDoc ? DOC_TYPES[i % 3] : null,
    manual: hasDoc && i % 4 === 0,
    email: i % 5 === 2 ? null : `${'abcdefghijklmnop'[i]}${'xyzwvutsrqponm'[i]}•••@mail.example`,
    daysLeft: Math.max(1, 30 - (28 - day) - 3),
    match: i % 6 === 5 ? 'Устройство из бан-листа' : undefined,
  }
})

const NAMES: [string, string][] = [
  ['Oleksii P.', 'OP'], ['Kamil N.', 'KN'], ['Dan C.', 'DC'], ['Stas M.', 'SM'], ['Teodor A.', 'TA'], ['Nikita G.', 'NG'], ['Yosef B.', 'YB'], ['Ilya R.', 'IR'],
]
const TRACE_SETS: Trace[][] = [['device'], ['name', 'file'], ['doc'], ['device', 'email'], ['file']]
export const EXTRA_LINKED: LinkedGroup[] = Array.from({ length: 10 }, (_, i) => {
  const a = NAMES[i % NAMES.length]
  const b = NAMES[(i + 3) % NAMES.length]
  const t = TRACE_SETS[i % TRACE_SETS.length]
  return {
    id: `lgx${i + 1}`,
    found: `2026-10-${String(26 - i).padStart(2, '0')}`,
    state: i % 4 === 1 ? 'dismissed' : i % 5 === 3 ? 'banned' : 'new',
    accounts: [
      { userId: null, name: a[0], initials: a[1], email: `${a[1].toLowerCase()}•••@mail.example`, created: `2026-10-${String(10 + i).padStart(2, '0')}`, status: 'active', manual: i % 3 === 0, traces: t },
      { userId: null, name: b[0], initials: b[1], email: `${b[1].toLowerCase()}•••@mail.example`, created: `2026-10-${String(12 + i).padStart(2, '0')}`, status: i % 7 === 4 ? 'deleted' : 'active', manual: false, traces: t },
    ],
  } satisfies LinkedGroup
})

const BAN_REASONS = ['Жалоба рекрутера: чужой документ', 'Поддельный документ', 'Спам в публикациях', 'Оплата за трудоустройство', 'Обход бана']
const BAN_TRACES: Trace[] = ['doc', 'device', 'email', 'name', 'file']
export const EXTRA_BANS: BanEntry[] = Array.from({ length: 16 }, (_, i) => ({
  id: `bx${i + 1}`,
  trace: BAN_TRACES[i % BAN_TRACES.length],
  account: i % 4 === 3 ? 'удалённый аккаунт' : NAMES[i % NAMES.length][0],
  reason: BAN_REASONS[i % BAN_REASONS.length],
  date: `2026-10-${String(8 - Math.floor(i / 3)).padStart(2, '0')}`,
  who: i % 5 === 0 ? 'Система' : 'Команда Seafolio',
  tries: i % 6 === 2 ? 3 : i % 4 === 1 ? 1 : 0,
}))
