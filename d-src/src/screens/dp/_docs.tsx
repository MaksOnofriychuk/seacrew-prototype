import { BookUser, FileText, Files, GraduationCap, HeartPulse, IdCard, Flag, Stamp, Syringe } from 'lucide-react'
import { PASSPORT, READ, VACCINES, VISAS, type AddCat, type OtherField, type ReadField } from '@/lib/data-docs-profile'
import { plural, useDP, useHashParam, useProfile, type Icon } from './_parts'

// Документи моряка для p02, p11, p19, p20: базові (з реєстрації) + додані в застосунку (bag dp.added).

/* ---------- строки ---------- */

// «Сьогодні» в прототипі — фіксоване, щоб строки на знімках не «пливли».
const TODAY = new Date(2026, 10, 2)

export function daysLeft(exp: string) {
  const m = exp.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!m) return null
  const d = new Date(+m[3], +m[2] - 1, +m[1])
  return Math.round((d.getTime() - TODAY.getTime()) / 86400000)
}

// Строк: плашку показуємо лише для документа, що спливає (за 60 днів — перше нагадування) або вже сплив.
export function expiry(exp: string | null): { text: string; variant: 'warning' | 'error' | 'success' } | null {
  if (!exp) return null
  const n = daysLeft(exp)
  if (n === null) return null
  if (n < 0) return { text: 'Срок истёк', variant: 'error' }
  if (n <= 60) return { text: `Истекает через ${n} ${plural(n, 'день', 'дня', 'дней')}`, variant: 'warning' }
  return { text: 'Действует', variant: 'success' }
}

/* ---------- модель ---------- */

export type DocGroup = 'sid' | 'passport' | 'visa' | 'dip' | 'flag' | 'med' | 'vac' | 'other' | 'cv'

export type DocField = { k: string; label: string; value: string; mono?: boolean }

export type Doc = {
  id: string
  group: DocGroup
  icon: Icon
  /** назва в списку і заголовок екрана документа */
  title: string
  /** назва на «папері» (як надруковано); немає — це файл (CV), без шапки primary */
  paper?: string
  /** підпис у списку: номер (замаскований) або тип візи */
  sub?: string
  exp: string | null
  fields: DocField[]
  other?: OtherField[]
  pages: number
  note: string
  photo: string
  /** диплом: додаткове фото Endorsement (відповідь 75, необов'язкове) */
  endorse?: boolean
}

export const GROUPS: { id: DocGroup; title: string; /** показувати порожню групу з рядком «Добавить» */ always: boolean }[] = [
  { id: 'sid', title: 'Документ моряка', always: true },
  { id: 'passport', title: 'Загранпаспорт', always: true },
  { id: 'visa', title: 'Визы', always: true },
  { id: 'dip', title: 'Дипломы и сертификаты', always: true },
  { id: 'flag', title: 'Подфлажные документы', always: false },
  { id: 'med', title: 'Медицинские', always: true },
  { id: 'vac', title: 'Прививки', always: true },
  { id: 'other', title: 'Другие документы', always: false },
  { id: 'cv', title: 'CV', always: true },
]

const CAT_GROUP: Record<AddCat, DocGroup> = { sid: 'sid', passport: 'passport', visa: 'visa', dip: 'dip', flag: 'flag', vac: 'vac', other: 'other' }
const CAT_ICON: Record<AddCat, Icon> = { sid: IdCard, passport: BookUser, visa: Stamp, dip: GraduationCap, flag: Flag, vac: Syringe, other: Files }

/** Потік «Добавить документ» (p02 → p18 → p19): тип, сторінки (поворот кожної), введення вручну. */
export type AddState = { cat: AddCat | null; pages: number[]; manual: boolean }
export const ADD_START: AddState = { cat: null, pages: [0], manual: false }

/** Документ, підтверджений на p19 (bag dp.added). */
export type AddedDoc = { id: string; cat: AddCat; fields: ReadField[]; other: OtherField[]; pages: number; manual: boolean; endorse?: boolean }

// Медичний документ, введений на кроці «Медицинские» (s5.docs) або для знімків (?med=1).
type MedData = { name: string; num: string; issue: string; exp: string; noExp: boolean; country: string }
export const DEMO_MED: { id: string; d: MedData } = {
  id: 'demo',
  d: { name: 'Медосмотр (PEME)', num: 'MC-0001', issue: '14.11.2024', exp: '14.11.2026', noExp: false, country: 'Украина' },
}

export const mask = (num: string, prefix = '') => (num ? `${prefix}•••${num.replace(/\s/g, '').slice(-3)}` : '')

const VISA_TITLE: Record<string, string> = {
  США: 'Виза в США',
  Великобритания: 'Виза в Великобританию',
  'Шенгенская зона': 'Шенгенская виза',
}
export const visaTitle = (country: string) => VISA_TITLE[country] ?? (country ? `Виза: ${country}` : 'Виза')

const READ_NOTE = 'Данные прочитаны из документа и подтверждены вами.'

function fromAdded(a: AddedDoc): Doc {
  const f = (k: string) => a.fields.find((x) => x.k === k)?.value ?? ''
  const name = f('name') || READ[a.cat].title
  const title =
    a.cat === 'visa' ? visaTitle(f('country')) : a.cat === 'passport' ? 'Загранпаспорт' : name
  return {
    id: a.cat === 'passport' ? 'passport' : a.id,
    group: CAT_GROUP[a.cat],
    icon: CAT_ICON[a.cat],
    title,
    paper: a.cat === 'visa' ? 'Visa' : a.cat === 'passport' ? 'Passport' : name,
    sub: a.cat === 'visa' ? f('type') : a.cat === 'vac' ? f('issue') : mask(f('num')),
    exp: f('exp') || null,
    fields: a.fields.map(({ k, label, value, mono }) => ({ k, label, value, mono })),
    other: a.other,
    pages: a.pages,
    note: a.manual ? 'Данные введены вами. Администратор сверит их с фото документа.' : READ_NOTE,
    photo: 'Заменить фото',
    endorse: a.endorse,
  }
}

export function useDocs() {
  const { bag } = useDP()
  const { form, name } = useProfile()
  const edits = bag<Record<string, Record<string, string>>>('doc.edits', {})
  const hidden = bag<string[]>('docs.hidden', [])
  const added = bag<AddedDoc[]>('dp.added', [])
  const demoMed = useHashParam('med') === '1' || bag<boolean>('docs.demoMed', false)
  const meds = bag<{ id: string; d: MedData }[]>('s5.docs', [])
  const s = (k: keyof typeof form) => String(form[k] ?? '')
  const noExp = (k: string) => !!(form as Record<string, unknown>)[k]

  const base: Doc[] = [
    {
      id: 'sid',
      group: 'sid',
      icon: IdCard,
      title: 'Удостоверение личности моряка',
      paper: s('docName'),
      sub: `${s('docNum').slice(0, 3)}${mask(s('docNum'))}`,
      exp: noExp('docNoExp') ? null : s('docExp'),
      fields: [
        { k: 'name', label: 'Имя и фамилия', value: name },
        { k: 'num', label: 'Номер', value: s('docNum'), mono: true },
        { k: 'issue', label: 'Дата выдачи', value: s('docIssue'), mono: true },
        { k: 'exp', label: 'Действует до', value: noExp('docNoExp') ? 'Без срока' : s('docExp'), mono: !noExp('docNoExp') },
        { k: 'country', label: 'Страна выдачи', value: s('docCountry') },
      ],
      pages: 1,
      note: READ_NOTE,
      photo: 'Заменить фото',
    },
    {
      id: 'passport',
      group: 'passport',
      icon: BookUser,
      title: 'Загранпаспорт',
      paper: 'Passport',
      sub: `${PASSPORT.num.slice(0, 3)}${mask(PASSPORT.num)}`,
      exp: PASSPORT.exp,
      fields: [
        { k: 'num', label: 'Номер', value: PASSPORT.num, mono: true },
        { k: 'country', label: 'Страна выдачи', value: PASSPORT.country },
        { k: 'issue', label: 'Дата выдачи', value: PASSPORT.issue, mono: true },
        { k: 'exp', label: 'Действует до', value: PASSPORT.exp, mono: true },
      ],
      pages: 1,
      note: READ_NOTE,
      photo: 'Заменить фото',
    },
    ...VISAS.map(
      (v): Doc => ({
        id: v.id,
        group: 'visa',
        icon: Stamp,
        title: visaTitle(v.country),
        paper: 'Visa',
        sub: v.type,
        exp: v.exp,
        fields: [
          { k: 'country', label: 'Страна', value: v.country },
          { k: 'type', label: 'Тип визы', value: v.type },
          { k: 'num', label: 'Номер', value: v.num, mono: true },
          { k: 'issue', label: 'Дата выдачи', value: v.issue, mono: true },
          { k: 'exp', label: 'Действует до', value: v.exp, mono: true },
        ],
        pages: 1,
        note: READ_NOTE,
        photo: 'Заменить фото',
      }),
    ),
    {
      id: 'dip',
      group: 'dip',
      icon: GraduationCap,
      title: `Диплом ${s('dipRank')}`,
      paper: s('dipName'),
      sub: mask(s('dipNum'), '№ '),
      exp: noExp('dipNoExp') ? null : s('dipExp'),
      fields: [
        { k: 'rank', label: 'Должность', value: s('dipRank') },
        { k: 'stcw', label: 'Правило STCW', value: s('dipStcw'), mono: true },
        { k: 'level', label: 'Уровень', value: s('dipLevel') },
        { k: 'num', label: 'Номер', value: s('dipNum'), mono: true },
        { k: 'issue', label: 'Дата выдачи', value: s('dipIssue'), mono: true },
        { k: 'exp', label: 'Действует до', value: noExp('dipNoExp') ? 'Без срока' : s('dipExp'), mono: !noExp('dipNoExp') },
        { k: 'country', label: 'Страна выдачи', value: s('dipCountry') },
      ],
      pages: 2,
      note: READ_NOTE,
      photo: 'Заменить фото',
    },
    // Прививки (відповідь 76) — будь-які; без строку дії.
    ...VACCINES.map(
      (v): Doc => ({
        id: v.id,
        group: 'vac',
        icon: Syringe,
        title: v.name,
        paper: 'Vaccination',
        sub: v.issue,
        exp: null,
        fields: [
          { k: 'name', label: 'Прививка', value: v.name },
          { k: 'issue', label: 'Дата прививки', value: v.issue, mono: true },
          { k: 'num', label: 'Номер сертификата', value: v.num, mono: true },
        ],
        pages: 1,
        note: READ_NOTE,
        photo: 'Заменить фото',
      }),
    ),
    // Медичні — лише ті, що моряк ввів сам (ИИ їх не читає, ADR-090).
    ...(meds.length ? meds : demoMed ? [DEMO_MED] : []).map(
      (m): Doc => ({
        id: `med-${m.id}`,
        group: 'med',
        icon: HeartPulse,
        title: m.d.name || 'Медицинский документ',
        paper: m.d.name || 'Медицинский документ',
        sub: mask(m.d.num),
        exp: m.d.noExp ? null : m.d.exp,
        fields: [
          { k: 'num', label: 'Номер', value: m.d.num, mono: true },
          { k: 'issue', label: 'Дата выдачи', value: m.d.issue, mono: true },
          { k: 'exp', label: 'Действует до', value: m.d.noExp ? 'Без срока' : m.d.exp, mono: !m.d.noExp },
          { k: 'country', label: 'Страна выдачи', value: m.d.country },
        ],
        pages: 1,
        note: 'Данные введены вами. Администратор сверит их с фото документа.',
        photo: 'Заменить фото',
      }),
    ),
    {
      id: 'cv',
      group: 'cv',
      icon: FileText,
      title: 'CV',
      sub: `${s('first') || 'CV'}_${s('last') || 'file'}.pdf`,
      exp: null,
      fields: [
        { k: 'file', label: 'Файл', value: `${s('first') || 'CV'}_${s('last') || 'file'}.pdf` },
        { k: 'date', label: 'Загружено', value: '25.10.2026', mono: true },
      ],
      pages: 2,
      note: 'Данные из CV перенесены в профиль после вашего подтверждения.',
      photo: 'Заменить файл',
    },
  ]

  // Доданий паспорт замінює наявний; решта — дописуються в свою групу.
  const extra = added.map(fromAdded)
  const list = [...base.filter((d) => !extra.some((x) => x.id === d.id)), ...extra]

  // Правки моряка поверх прочитаних даних (p11 «Изменить данные»).
  const docs = list
    .filter((d) => !hidden.includes(d.id))
    .map((d) => {
      const e = edits[d.id]
      if (!e) return d
      const fields = d.fields.map((f) => (e[f.k] !== undefined ? { ...f, value: e[f.k] } : f))
      return { ...d, fields, exp: e.exp !== undefined && d.exp ? e.exp : d.exp }
    })
  return { docs, edits, demoMed }
}
