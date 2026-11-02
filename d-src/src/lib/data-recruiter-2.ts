// Вигадані дані для вебу рекрутера, частина 2: вакансії (перегляди, вимоги), розмови з вкладеннями,
// визначення анкет, відповіді моряків. Спільні дані — у data-web.ts; тут лише доповнення.
import { APPLICATIONS, CONVERSATIONS, FORMS, type Application, type WebJob } from './data-web'

/* ---------- вакансії: перегляди (відп. 101) і вимоги (відп. 92) ---------- */

export type JobExtra = {
  /** перегляди за весь час */
  views: number
  /** перегляди за останні 14 днів, від старих до нових */
  daily: number[]
  /** обов'язкові вимоги до моряка — вільним текстом (відп. 92) */
  requirements: string
}

export const JOB_EXTRA: Record<string, JobExtra> = {
  j01: { views: 312, daily: [8, 14, 22, 19, 25, 31, 18, 12, 27, 33, 29, 24, 30, 20], requirements: 'Виза США C1/D. Опыт на химовозах от 12 месяцев. Двигатели MAN B&W.' },
  j02: { views: 248, daily: [11, 16, 20, 15, 18, 22, 17, 19, 21, 14, 16, 18, 20, 21], requirements: 'Стаж в должности от 24 месяцев. Балкеры Supramax. ECDIS.' },
  j03: { views: 167, daily: [0, 0, 0, 0, 0, 0, 0, 0, 9, 24, 31, 38, 35, 30], requirements: 'DP Unlimited. BOSIET и OGUK. Опыт DP2 от 6 месяцев.' },
  j04: { views: 0, daily: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], requirements: 'High Voltage. Опыт на AHTS.' },
  j05: { views: 96, daily: [3, 5, 9, 8, 6, 7, 4, 9, 8, 6, 7, 9, 7, 8], requirements: 'Сертификат судового повара. Опыт в смешанных экипажах.' },
  j06: { views: 421, daily: [30, 34, 28, 25, 31, 27, 22, 0, 0, 0, 0, 0, 0, 0], requirements: 'Опыт на круизных судах от 2 контрактов. Crowd Management.' },
}

export const VESSEL_TYPES_WEB = ['Chemical Tanker', 'Oil Tanker', 'LPG Carrier', 'Bulk Carrier', 'Container Ship', 'PSV', 'AHTS', 'Cruise Ship']
// Регіони роботи — лише ті, що назвав замовник (правка №35).
export const REGIONS = ['Европа', 'Африка', 'ОАЭ'] as const
export const CURRENCIES = ['$', '€', '£'] as const

/** Нова вакансія, коли рекрутер натискає «Опубликовать» у формі. */
export const NEW_JOB_ID = 'j-new'

export const emptyJob = (): WebJob => ({
  id: NEW_JOB_ID,
  position: '',
  fleet: '',
  department: '',
  vesselType: '',
  vesselName: '',
  salary: { amount: '', currency: '$', period: 'месяц' },
  region: 'Европа',
  board: '',
  duration: '',
  status: 'draft',
  recruiterId: 'rc1',
  created: '2026-11-02',
  description: '',
})

/* ---------- розмови (правка №22, відп. 111–115) ---------- */

export type ChatMsg = {
  from: 'me' | 'them' | 'system'
  time: string
  text?: string
  /** «Прочитано» — лише для своїх повідомлень */
  read?: boolean
  photo?: { name: string }
  file?: { name: string; size: string }
  link?: { url: string; title: string }
  /** картка анкети в розмові */
  form?: { formId: string; assignmentId?: string; status: 'sent' | 'submitted' }
}

export type Chat = {
  /** id розмови = id відгуку (чат з'являється після відгуку, №22) */
  id: string
  seafarerId: string
  jobId: string
  unread: number
  online: boolean
  /** коли був у мережі, якщо не онлайн */
  seen: string
  messages: ChatMsg[]
}

const applied = (time: string): ChatMsg => ({ from: 'system', time, text: 'Моряк откликнулся на вакансию' })

const RICH: Record<string, Omit<Chat, 'id' | 'seafarerId' | 'jobId' | 'unread' | 'online'>> = {
  ap01: {
    seen: '',
    messages: [
      applied('29.10 10:12'),
      { from: 'me', text: 'Здравствуйте, Andrii! Профиль подходит. Когда сможете выехать?', time: '29.10 11:40', read: true },
      { from: 'them', text: 'Добрый день! Готов приступить сразу, документы действующие.', time: '29.10 12:05' },
      { from: 'them', text: 'Характеристика с последнего судна:', file: { name: 'Reference_MT_Leda.pdf', size: '1,2 МБ' }, time: '02.11 09:14' },
      { from: 'them', photo: { name: 'ECDIS_certificate.jpg' }, time: '02.11 09:15' },
    ],
  },
  ap06: {
    seen: 'был в сети 2 ч назад',
    messages: [
      applied('31.10 08:40'),
      { from: 'me', text: 'Janis, отправила анкету компании — заполните, пожалуйста, до пятницы.', time: '31.10 09:20', read: true },
      { from: 'me', form: { formId: 'f02', status: 'sent' }, time: '31.10 09:20', read: true },
      { from: 'them', form: { formId: 'f02', assignmentId: 'as02', status: 'submitted' }, time: '31.10 18:44' },
      { from: 'them', text: 'Заполнил, проверьте.', time: '31.10 18:44' },
      { from: 'me', text: 'Спасибо! Памятка перед посадкой:', link: { url: 'bluewave-crewing.example/briefing', title: 'Инструктаж для экипажа Sea Harrier' }, time: '01.11 10:02', read: true },
    ],
  },
  ap04: {
    seen: 'был в сети вчера',
    messages: [applied('27.10 14:30'), { from: 'them', text: 'Добрый день, какой график смены экипажа?', time: '01.11 08:15' }],
  },
  ap08: { seen: '', messages: [applied('24.10 16:02')] },
}

/** «29.10 10:12» → «10-29 10:12» для сортування */
const timeKey = (t: string) => t.slice(3, 5) + '-' + t.slice(0, 2) + t.slice(5)
const dm = (iso: string) => iso.slice(8, 10) + '.' + iso.slice(5, 7)

export const CHATS: Chat[] = APPLICATIONS.map((a: Application) => {
  const conv = CONVERSATIONS.find((c) => c.seafarerId === a.seafarerId)
  const rich = RICH[a.id]
  return {
    id: a.id,
    seafarerId: a.seafarerId,
    jobId: a.jobId,
    unread: conv?.unread ?? 0,
    online: conv?.online ?? false,
    seen: rich?.seen ?? 'был в сети ' + dm(a.date),
    messages: rich?.messages ?? [applied(dm(a.date) + ' 12:00')],
  }
}).sort((x, y) => timeKey(y.messages.at(-1)!.time).localeCompare(timeKey(x.messages.at(-1)!.time)))

export const chatById = (id: string) => CHATS.find((c) => c.id === id)

/* ---------- анкети: визначення (contract-recruiter-web §4) ---------- */

export type FieldType = 'profile' | 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'photo' | 'file' | 'documentRequest' | 'consent' | 'signature' | 'group'

export const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  profile: 'Поле профиля',
  text: 'Короткий текст',
  textarea: 'Длинный текст',
  number: 'Число',
  date: 'Дата',
  select: 'Выбор',
  checkbox: 'Флажок',
  photo: 'Фото',
  file: 'Файл',
  documentRequest: 'Запрос документа',
  consent: 'Согласие',
  signature: 'Подпись',
  group: 'Группа полей',
}

export type Audience = 'SEAFARER' | 'AGENCY_ONLY'
export const AUDIENCE_LABEL: Record<Audience, string> = { SEAFARER: 'Моряк', AGENCY_ONLY: 'Только агентство' }

export type FormField = {
  id: string
  label: string
  type: FieldType
  required: boolean
  /** ключ словника профілю — для type 'profile' */
  profileKey?: string
  /** категорія документа — для documentRequest */
  category?: string
  /** поле AcroForm у PDF, якщо анкету імпортовано */
  pdf?: string
  /** поле повторюваної групи */
  repeatable?: boolean
  /** «Нужно подтверждение документом» (ТЗ §9): значення з підтвердженого документа або вручну + фото чи файл */
  proof?: boolean
}

/** Типи полів, які можна вимагати підтвердити документом (ТЗ §9): там, де моряк вводить значення. */
export const PROOF_TYPES: FieldType[] = ['profile', 'text', 'textarea', 'number', 'date', 'select', 'group']

export type FormSection = { id: string; title: string; audience: Audience; fields: FormField[] }

const f = (id: string, label: string, type: FieldType, required = true, extra: Partial<FormField> = {}): FormField => ({ id, label, type, required, ...extra })

export const FORM_DEFS: Record<string, FormSection[]> = {
  f01: [
    {
      id: 's1', title: 'Личные данные', audience: 'SEAFARER', fields: [
        f('surname', 'Фамилия', 'profile', true, { profileKey: 'Фамилия' }),
        f('given', 'Имя', 'profile', true, { profileKey: 'Имя' }),
        f('birth', 'Дата рождения', 'profile', true, { profileKey: 'Дата рождения' }),
        f('nat', 'Гражданство', 'profile', true, { profileKey: 'Гражданство' }),
        f('photo', 'Фото на документы', 'photo'),
      ],
    },
    {
      id: 's2', title: 'Контакты', audience: 'SEAFARER', fields: [
        f('phone', 'Телефон', 'profile', true, { profileKey: 'Телефон' }),
        f('airport', 'Ближайший аэропорт', 'profile', true, { profileKey: 'Аэропорт' }),
        f('nok', 'Контакт на случай ЧС', 'profile', true, { profileKey: 'Ближайший родственник' }),
      ],
    },
    {
      id: 's3', title: 'Документы', audience: 'SEAFARER', fields: [
        f('passport', 'Паспорт моряка', 'documentRequest', true, { category: 'Удостоверение личности' }),
        f('coc', 'Диплом (CoC)', 'documentRequest', true, { category: 'Дипломы' }),
        f('medical', 'Медицинский сертификат', 'documentRequest', true, { category: 'Медицина' }),
        f('bst', 'Basic Safety Training', 'documentRequest', false, { category: 'Сертификаты' }),
      ],
    },
    {
      id: 's4', title: 'Опыт работы', audience: 'SEAFARER', fields: [
        f('service', 'Контракты за 5 лет', 'group', true, { repeatable: true, proof: true }),
        f('engines', 'Типы главных двигателей', 'textarea', false),
      ],
    },
    {
      id: 's5', title: 'Согласие и подпись', audience: 'SEAFARER', fields: [
        f('gdpr', 'Согласие на обработку данных', 'consent'),
        f('sign', 'Подпись', 'signature'),
      ],
    },
    {
      id: 's6', title: 'Оценка агентства', audience: 'AGENCY_ONLY', fields: [
        f('score', 'Оценка после интервью', 'select', false),
        f('interview', 'Дата интервью', 'date', false),
        f('note', 'Комментарий', 'textarea', false),
      ],
    },
  ],
  f02: [
    {
      id: 's1', title: 'Personal details', audience: 'SEAFARER', fields: [
        f('surname', 'Surname', 'profile', true, { profileKey: 'Фамилия', pdf: 'surname_1' }),
        f('given', 'Given names', 'profile', true, { profileKey: 'Имя', pdf: 'given_names' }),
        f('birth', 'Date of birth', 'profile', true, { profileKey: 'Дата рождения', pdf: 'dob' }),
        f('nok', 'Next of kin', 'profile', true, { profileKey: 'Ближайший родственник', pdf: 'NOK_name' }),
      ],
    },
    {
      id: 's2', title: 'Offshore certificates', audience: 'SEAFARER', fields: [
        f('bosiet', 'BOSIET', 'documentRequest', true, { category: 'Сертификаты', pdf: 'cert_bosiet' }),
        f('dp', 'DP certificate', 'documentRequest', true, { category: 'Сертификаты', pdf: 'cert_dp' }),
        f('oguk', 'OGUK medical', 'documentRequest', true, { category: 'Медицина', pdf: 'medical_oguk' }),
      ],
    },
    {
      id: 's3', title: 'DP experience', audience: 'SEAFARER', fields: [
        f('dphours', 'DP hours', 'number', true, { pdf: 'dp_hours', proof: true }),
        f('dpclass', 'DP class', 'select', true, { pdf: 'dp_class' }),
      ],
    },
    {
      id: 's4', title: 'Declaration', audience: 'SEAFARER', fields: [
        f('decl', 'I confirm the information is true', 'consent', true, { pdf: 'declaration_chk' }),
        f('sign', 'Signature', 'signature', true, { pdf: 'signature' }),
      ],
    },
    { id: 's5', title: 'Office use only', audience: 'AGENCY_ONLY', fields: [f('approved', 'Approved by', 'text', false, { pdf: 'office_approved' })] },
  ],
  f03: [
    {
      id: 's1', title: 'Здоровье', audience: 'SEAFARER', fields: [
        f('chronic', 'Хронические заболевания', 'textarea', false),
        f('vacc', 'Прививки', 'file', false),
      ],
    },
    { id: 's2', title: 'Отметки врача', audience: 'AGENCY_ONLY', fields: [f('doctor', 'Заключение', 'textarea', false)] },
  ],
}

/** Анкета, яку зібрав імпорт (r-form-import → r-form-edit). */
export const IMPORTED_FORM_ID = 'f-import'
FORM_DEFS[IMPORTED_FORM_ID] = FORM_DEFS.f02
export const formTitle = (id: string) => (id === IMPORTED_FORM_ID ? 'Application form Nordic Offshore' : (FORMS.find((x) => x.id === id)?.title ?? 'Новая анкета'))

/* ---------- відповіді моряка (assignment) ---------- */

export type AnswerSource = 'profile' | 'edited' | 'manual' | 'library' | 'upload'
export const SOURCE_LABEL: Record<AnswerSource, string> = {
  profile: 'Из профиля',
  edited: 'Изменено',
  manual: 'Введено вручную',
  library: 'Из документов',
  upload: 'Загружено',
}

/** Чим моряк підтвердив поле з позначкою «Нужно подтверждение документом»: документ з профілю або прикріплений файл. */
export type Proof = { kind: 'library' | 'upload'; doc: string; file: { name: string; size: string } }
export type Answer = { value: string; source: AnswerSource; file?: { name: string; size: string }; proof?: Proof }

export const ANSWERS: Record<string, Record<string, Answer>> = {
  as01: {
    surname: { value: 'K.', source: 'profile' },
    given: { value: 'Andrii', source: 'profile' },
    birth: { value: '14.03.1994', source: 'profile' },
    nat: { value: 'Украина', source: 'profile' },
    photo: { value: 'photo_3x4.jpg', source: 'upload', file: { name: 'photo_3x4.jpg', size: '640 КБ' } },
    phone: { value: '+380 50 000 00 41', source: 'edited' },
    airport: { value: 'Кишинёв (KIV)', source: 'profile' },
    nok: { value: 'Ольга K., жена', source: 'manual' },
    passport: { value: 'Паспорт моряка', source: 'library', file: { name: 'Seaman_book.pdf', size: '2,4 МБ' } },
    coc: { value: '3rd Engineer (III/1)', source: 'library', file: { name: 'CoC_III-1.pdf', size: '1,8 МБ' } },
    medical: { value: 'Действует до 30.06.2027', source: 'library', file: { name: 'Medical_ILO.pdf', size: '960 КБ' } },
    bst: { value: 'BST', source: 'upload', file: { name: 'BST_2025.pdf', size: '1,1 МБ' } },
    service: { value: 'MT Leda, Chemical Tanker, 3rd Engineer, 4 мес.\nMT Corsa, Chemical Tanker, 4th Engineer, 6 мес.\nMV Orion Bay, Bulk Carrier, 4th Engineer, 5 мес.', source: 'profile', proof: { kind: 'library', doc: 'Паспорт моряка', file: { name: 'Seaman_book.pdf', size: '2,4 МБ' } } },
    engines: { value: 'MAN B&W 6S50MC-C, Wärtsilä RT-flex', source: 'manual' },
    gdpr: { value: 'Согласен', source: 'manual' },
    sign: { value: 'Andrii K., 30.10.2026', source: 'manual' },
  },
  as02: {
    surname: { value: 'O.', source: 'profile' },
    given: { value: 'Janis', source: 'profile' },
    birth: { value: '02.09.1990', source: 'profile' },
    nok: { value: 'Laura O., sister', source: 'edited' },
    bosiet: { value: 'BOSIET', source: 'library', file: { name: 'BOSIET_2024.pdf', size: '1,3 МБ' } },
    dp: { value: 'DP Unlimited', source: 'library', file: { name: 'DP_Unlimited.pdf', size: '850 КБ' } },
    oguk: { value: 'До 20.12.2026', source: 'library', file: { name: 'OGUK_medical.jpg', size: '2,1 МБ' } },
    dphours: { value: '4 120', source: 'manual', proof: { kind: 'upload', doc: 'DP logbook', file: { name: 'DP_logbook_p12.jpg', size: '1,6 МБ' } } },
    dpclass: { value: 'DP2', source: 'manual' },
    decl: { value: 'Подтверждено', source: 'manual' },
    sign: { value: 'Janis O., 31.10.2026', source: 'manual' },
  },
}
