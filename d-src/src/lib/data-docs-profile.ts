// Дані етапу 5: документи, CV, профіль, опыт работы. Усе вигадане (як у lib/data.ts).

/* ---------- профіль моряка ---------- */

// Ті самі значення, що FORM_DEFAULTS швидкої реєстрації (q.form) — щоб ім'я й номери збігались скрізь.
export const ME_DEFAULTS = {
  first: 'Andrii',
  last: 'Koval',
  birth: '14.03.1991',
  cit: 'Украина',
  phone: '+380 00 000 0000',
  email: 'you@example.com',
  docName: "Seafarer's Identity Document",
  docNum: 'AB 123456',
  docIssue: '12.05.2022',
  docExp: '12.05.2027',
  docCountry: 'Украина',
  dipName: 'Certificate of Competency',
  dipNum: 'UA-2021-0457',
  dipIssue: '20.06.2021',
  dipExp: '20.06.2029',
  dipCountry: 'Украина',
  dipRank: '3rd Engineer',
  dipStcw: 'III/1',
  dipLevel: 'Operational',
}

export type MeForm = typeof ME_DEFAULTS

/** Поля профілю, які можна змінити по одному (gaps №6, profile-edit/[field] у застосунку). */
export type ProfileField = 'last' | 'first' | 'birth' | 'cit' | 'phone' | 'email' | 'rank'

/** Звідки значення: з документа, з CV, введено вами, або виправлено вами після документа. */
export type FieldSource = 'doc' | 'cv' | 'you' | 'edited'

export const PROFILE_FIELDS: { k: ProfileField; label: string; ph: string; mono?: boolean; src: FieldSource }[] = [
  { k: 'last', label: 'Фамилия', ph: 'Как в документе', src: 'doc' },
  { k: 'first', label: 'Имя', ph: 'Как в документе', src: 'doc' },
  { k: 'birth', label: 'Дата рождения', ph: 'ДД.ММ.ГГГГ', mono: true, src: 'doc' },
  { k: 'cit', label: 'Гражданство', ph: 'Украина', src: 'doc' },
  { k: 'phone', label: 'Телефон', ph: '+380 …', mono: true, src: 'cv' },
  { k: 'email', label: 'Email', ph: 'name@example.com', src: 'you' },
]

/** Документ, з якого прийшли ім'я, дата народження й громадянство. */
export const PROFILE_DOC = 'Удостоверение личности моряка'

export const RANK_DEFAULT = { fleets: ['Merchant'], department: 'Engine', positions: ['3rd Engineer'] }

/* ---------- загранпаспорт і візи (правка №36) ---------- */

export type Passport = { num: string; country: string; issue: string; exp: string }
export type Visa = { id: string; country: string; type: string; num: string; issue: string; exp: string }

export const PASSPORT: Passport = { num: 'FA 102938', country: 'Украина', issue: '03.08.2020', exp: '03.08.2030' }

export const VISAS: Visa[] = [
  { id: 'visa-schengen', country: 'Шенгенская зона', type: 'C', num: 'UKR 0071234', issue: '15.04.2026', exp: '14.04.2027' },
  { id: 'visa-uk', country: 'Великобритания', type: 'Visitor', num: 'GB 0083516', issue: '10.12.2024', exp: '10.12.2026' },
]

/* ---------- додавання документа (gaps №5, add у застосунку) ---------- */

export type AddCat = 'sid' | 'passport' | 'visa' | 'dip' | 'flag' | 'other'

export const ADD_CATS: { id: AddCat; label: string; sub?: string }[] = [
  { id: 'sid', label: 'Документ моряка', sub: 'Удостоверение, послужная книжка' },
  { id: 'passport', label: 'Загранпаспорт' },
  { id: 'visa', label: 'Виза' },
  { id: 'dip', label: 'Диплом или сертификат' },
  { id: 'flag', label: 'Подфлажный документ', sub: 'Паспорт другого флага, разрешение на работу' },
  { id: 'other', label: 'Другой документ' },
]

/** Скільки сторінок можна додати в один документ (MAX_DOCUMENT_PAGES у застосунку). */
export const MAX_PAGES = 10

/** «Похоже, это …» — що «визначає» ИИ для нових сторінок. */
export const DETECTED: AddCat = 'visa'

export type ReadField = { k: string; label: string; value: string; mono?: boolean; /** ИИ не впевнений — попросимо перевірити */ low?: boolean }
export type OtherField = { k: string; label: string; value: string; mine?: boolean }

// Що «прочитав» ИИ для кожного типу документа (для p19).
export const READ: Record<AddCat, { title: string; fields: ReadField[]; other: OtherField[] }> = {
  visa: {
    title: 'Виза',
    fields: [
      { k: 'country', label: 'Страна', value: 'США' },
      { k: 'type', label: 'Тип визы', value: 'C1/D', mono: true },
      { k: 'num', label: 'Номер', value: 'D 4419270', mono: true },
      { k: 'issue', label: 'Дата выдачи', value: '22.10.2026', mono: true, low: true },
      { k: 'exp', label: 'Действительна до', value: '21.10.2031', mono: true },
    ],
    other: [
      { k: 'place', label: 'Место выдачи', value: 'KYIV' },
      { k: 'entries', label: 'Количество въездов', value: 'M' },
      { k: 'annot', label: 'Annotation', value: 'CREW MEMBER' },
    ],
  },
  passport: {
    title: 'Загранпаспорт',
    fields: [
      { k: 'num', label: 'Номер', value: 'FA 102938', mono: true },
      { k: 'country', label: 'Страна выдачи', value: 'Украина' },
      { k: 'issue', label: 'Дата выдачи', value: '03.08.2020', mono: true },
      { k: 'exp', label: 'Действителен до', value: '03.08.2030', mono: true },
    ],
    other: [
      { k: 'auth', label: 'Орган выдачи', value: '8012' },
      { k: 'pob', label: 'Место рождения', value: 'ODESA' },
    ],
  },
  sid: {
    title: 'Документ моряка',
    fields: [
      { k: 'name', label: 'Название документа', value: "Seaman's Book" },
      { k: 'num', label: 'Номер', value: 'SB 004417', mono: true },
      { k: 'issue', label: 'Дата выдачи', value: '18.02.2023', mono: true },
      { k: 'exp', label: 'Действителен до', value: '18.02.2033', mono: true, low: true },
      { k: 'country', label: 'Страна выдачи', value: 'Украина' },
    ],
    other: [{ k: 'auth', label: 'Орган выдачи', value: 'Капитан порта Одесса' }],
  },
  dip: {
    title: 'Сертификат',
    fields: [
      { k: 'name', label: 'Название документа', value: 'Advanced Fire Fighting' },
      { k: 'stcw', label: 'Правило STCW', value: 'VI/3', mono: true },
      { k: 'num', label: 'Номер', value: 'AFF-2024-1182', mono: true },
      { k: 'issue', label: 'Дата выдачи', value: '04.03.2024', mono: true },
      { k: 'exp', label: 'Действителен до', value: '04.03.2029', mono: true },
      { k: 'country', label: 'Страна выдачи', value: 'Украина' },
    ],
    other: [{ k: 'center', label: 'Учебный центр', value: 'Example Maritime Training Centre' }],
  },
  flag: {
    title: 'Подфлажный документ',
    fields: [
      { k: 'name', label: 'Название документа', value: "Seaman's Book" },
      { k: 'flag', label: 'Флаг', value: 'Panama' },
      { k: 'num', label: 'Номер', value: 'PA-00 81 552', mono: true },
      { k: 'issue', label: 'Дата выдачи', value: '11.01.2025', mono: true },
      { k: 'exp', label: 'Действителен до', value: '11.01.2030', mono: true, low: true },
    ],
    other: [{ k: 'cap', label: 'Capacity', value: '3RD ENGINEER' }],
  },
  other: {
    title: 'Документ',
    fields: [
      { k: 'name', label: 'Название документа', value: 'Yellow Fever Vaccination' },
      { k: 'num', label: 'Номер', value: 'YF 230-118', mono: true },
      { k: 'issue', label: 'Дата выдачи', value: '05.06.2019', mono: true },
    ],
    other: [],
  },
}

/* ---------- контракти (правки №3, №25, №26, №34; бриф S44) ---------- */

export type Contract = {
  id: string
  vessel: string
  type: string
  flag: string
  fleet: string
  department: string
  position: string
  dwt: string
  from: string // ММ.ГГГГ
  to: string // ММ.ГГГГ
  owner: string
  engine: string
}

export const VESSEL_TYPES = ['Tanker', 'Container Ship', 'Bulk Carrier', 'LPG Carrier', 'General Cargo', 'PSV', 'Cruise Ship']

// Ті самі судна й періоди, що на кроці «Опыт работы» (s6): загальний стаж однаковий — 3 г 9 мес.
export const CONTRACTS: Contract[] = [
  { id: 'c1', vessel: 'MV Example Crest', type: 'Tanker', flag: 'Liberia', fleet: 'Merchant', department: 'Engine', position: '3rd Engineer', dwt: '49 990', from: '11.2024', to: '06.2025', owner: 'Example Tankers Ltd', engine: 'MAN B&W 6G50, 8 600 kW' },
  { id: 'c2', vessel: 'MV Example Star', type: 'Container Ship', flag: 'Malta', fleet: 'Merchant', department: 'Engine', position: '3rd Engineer', dwt: '19 800', from: '02.2024', to: '09.2024', owner: 'Example Shipping Ltd', engine: 'MAN B&W 6S46, 7 860 kW' },
  { id: 'c3', vessel: 'MV Example Wave', type: 'Bulk Carrier', flag: 'Panama', fleet: 'Merchant', department: 'Engine', position: '4th Engineer', dwt: '58 000', from: '05.2022', to: '12.2023', owner: 'Example Bulk Management', engine: 'MAN B&W 6S50, 9 480 kW' },
  { id: 'c4', vessel: 'MV Example Reef', type: 'Tanker', flag: 'Marshall Islands', fleet: 'Merchant', department: 'Engine', position: '4th Engineer', dwt: '45 700', from: '03.2021', to: '11.2021', owner: 'Example Tankers Ltd', engine: 'MAN B&W 6S50, 9 480 kW' },
]

// Контракт, який «знаходить» ИИ у сторінках паспорта моряка, послужної книжки чи CV.
export const FOUND_CONTRACT: Contract = {
  id: 'found',
  vessel: 'MV Example Bay',
  type: 'LPG Carrier',
  flag: 'Malta',
  fleet: 'Merchant',
  department: 'Engine',
  position: '3rd Engineer',
  dwt: '22 300',
  from: '09.2025',
  to: '03.2026',
  owner: 'Example Gas Shipping',
  engine: 'MAN B&W 6S35, 5 600 kW',
}

/* ---------- CV (відповіді 86–90) ---------- */

export const CV_UPDATED = '02.11.2026'
export const CV_FILE = 'Andrii_Koval_CV.pdf'

// Англійські назви для CV (CV завжди англійською — відповідь 89).
export const EN_COUNTRY: Record<string, string> = {
  Украина: 'Ukraine',
  США: 'USA',
  Великобритания: 'United Kingdom',
  'Шенгенская зона': 'Schengen Area',
}
export const EN_CIT: Record<string, string> = { Украина: 'Ukrainian' }
