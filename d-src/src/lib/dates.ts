// Дати в прототипі — рядки «ДД.ММ.ГГГГ» (і «ММ.ГГГГ» для періодів контракту). Вводити руками не можна —
// лише вибір; межі min/max не дають вибрати неможливу дату (видача пізніше сьогодні, «до» раніше видачі тощо).
export const TODAY = new Date(2026, 10, 3)

export const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
export const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

const two = (n: number) => String(n).padStart(2, '0')

export function fmtDate(d: Date) {
  return `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()}`
}

export function parseDate(v: string | undefined): Date | null {
  const m = v?.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!m) return null
  const d = new Date(+m[3], +m[2] - 1, +m[1])
  return d.getFullYear() === +m[3] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[1] ? d : null
}

export function fmtMonth(y: number, m: number) {
  return `${two(m + 1)}.${y}`
}

export function parseMonth(v: string | undefined): { y: number; m: number } | null {
  const r = v?.match(/^(\d{2})\.(\d{4})$/)
  if (!r || +r[1] < 1 || +r[1] > 12) return null
  return { y: +r[2], m: +r[1] - 1 }
}

export function addYears(d: Date, n: number) {
  return new Date(d.getFullYear() + n, d.getMonth(), d.getDate())
}

export function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

export const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate()

const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

export function clampDate(d: Date, min?: Date | null, max?: Date | null) {
  if (min && day(d) < day(min)) return new Date(min)
  if (max && day(d) > day(max)) return new Date(max)
  return d
}

export const inRange = (d: Date, min?: Date | null, max?: Date | null) => !(min && day(d) < day(min)) && !(max && day(d) > day(max))

// Типові межі. Видача — не пізніше сьогодні; «действителен до» — не раніше видачі; народження — 16–75 років тому.
export const BOUNDS = {
  birth: { min: addYears(TODAY, -75), max: addYears(TODAY, -16) },
  issue: { min: new Date(1970, 0, 1), max: TODAY },
  expiry: (issue?: string) => ({ min: parseDate(issue) ?? new Date(1990, 0, 1), max: addYears(TODAY, 30) }),
  future: { min: TODAY, max: addYears(TODAY, 3) },
}

// Веб-дані зберігають дати як ISO (YYYY-MM-DD) — для таблиць і сортування; календар працює з ДД.ММ.ГГГГ.
export const isoToRu = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('.') : '')
export const ruToIso = (ru: string) => (parseDate(ru) ? ru.split('.').reverse().join('-') : '')
