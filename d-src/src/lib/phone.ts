import { COUNTRIES, type Country } from './countries'

// Телефон — одна строка «+380 67 123 4567»: код країни, пробіл, номер із групами цифр.
// Довжина номера (без коду) залежить від країни; для країн без точних даних — 7–12 цифр.
export type Dial = { country: Country; iso: string; dial: string; min: number; max: number; groups: number[] }

// ISO-код (для прапора), код країни, довжина номера (min, max), групи цифр.
// Ключ — англійська назва з COUNTRIES.
const T: Record<string, [string, string, number, number, number[]?]> = {
  Australia: ['AU', '61', 9, 9, [3, 3, 3]],
  Azerbaijan: ['AZ', '994', 9, 9, [2, 3, 2, 2]],
  'Antigua and Barbuda': ['AG', '1268', 7, 7, [3, 4]],
  Bahamas: ['BS', '1242', 7, 7, [3, 4]],
  Bangladesh: ['BD', '880', 10, 10, [4, 6]],
  Belgium: ['BE', '32', 9, 9, [3, 2, 2, 2]],
  Belize: ['BZ', '501', 7, 7, [3, 4]],
  Bulgaria: ['BG', '359', 9, 9, [3, 3, 3]],
  Brazil: ['BR', '55', 10, 11, [2, 5, 4]],
  'United Kingdom': ['GB', '44', 10, 10, [4, 6]],
  Vietnam: ['VN', '84', 9, 10, [3, 3, 3]],
  Ghana: ['GH', '233', 9, 9, [2, 3, 4]],
  Germany: ['DE', '49', 10, 11, [3, 4, 4]],
  Gibraltar: ['GI', '350', 8, 8, [4, 4]],
  'Hong Kong': ['HK', '852', 8, 8, [4, 4]],
  Greece: ['GR', '30', 10, 10, [3, 3, 4]],
  Georgia: ['GE', '995', 9, 9, [3, 3, 3]],
  Denmark: ['DK', '45', 8, 8, [2, 2, 2, 2]],
  Egypt: ['EG', '20', 10, 10, [3, 3, 4]],
  India: ['IN', '91', 10, 10, [5, 5]],
  Indonesia: ['ID', '62', 9, 12, [3, 4, 5]],
  Ireland: ['IE', '353', 9, 9, [2, 3, 4]],
  Spain: ['ES', '34', 9, 9, [3, 3, 3]],
  Italy: ['IT', '39', 9, 10, [3, 3, 4]],
  Kazakhstan: ['KZ', '7', 10, 10, [3, 3, 2, 2]],
  Canada: ['CA', '1', 10, 10, [3, 3, 4]],
  Cyprus: ['CY', '357', 8, 8, [2, 6]],
  China: ['CN', '86', 11, 11, [3, 4, 4]],
  Latvia: ['LV', '371', 8, 8, [2, 3, 3]],
  Liberia: ['LR', '231', 7, 8, [2, 3, 3]],
  Lithuania: ['LT', '370', 8, 8, [3, 5]],
  Malaysia: ['MY', '60', 9, 10, [2, 4, 4]],
  Malta: ['MT', '356', 8, 8, [4, 4]],
  'Marshall Islands': ['MH', '692', 7, 7, [3, 4]],
  Myanmar: ['MM', '95', 8, 10, [3, 3, 4]],
  Nigeria: ['NG', '234', 10, 10, [3, 3, 4]],
  Netherlands: ['NL', '31', 9, 9, [2, 3, 4]],
  Norway: ['NO', '47', 8, 8, [3, 2, 3]],
  'United Arab Emirates': ['AE', '971', 9, 9, [2, 3, 4]],
  'Isle of Man': ['IM', '44', 10, 10, [4, 6]],
  Pakistan: ['PK', '92', 10, 10, [3, 7]],
  Panama: ['PA', '507', 8, 8, [4, 4]],
  Poland: ['PL', '48', 9, 9, [3, 3, 3]],
  Portugal: ['PT', '351', 9, 9, [3, 3, 3]],
  'South Korea': ['KR', '82', 9, 10, [2, 4, 4]],
  Moldova: ['MD', '373', 8, 8, [2, 3, 3]],
  Romania: ['RO', '40', 9, 9, [3, 3, 3]],
  'Saint Vincent and the Grenadines': ['VC', '1784', 7, 7, [3, 4]],
  Singapore: ['SG', '65', 8, 8, [4, 4]],
  'United States': ['US', '1', 10, 10, [3, 3, 4]],
  Turkey: ['TR', '90', 10, 10, [3, 3, 4]],
  Ukraine: ['UA', '380', 9, 9, [2, 3, 4]],
  Philippines: ['PH', '63', 10, 10, [3, 3, 4]],
  Finland: ['FI', '358', 9, 10, [2, 3, 4]],
  France: ['FR', '33', 9, 9, [1, 2, 2, 2, 2]],
  Croatia: ['HR', '385', 8, 9, [2, 3, 4]],
  Montenegro: ['ME', '382', 8, 8, [2, 3, 3]],
  Sweden: ['SE', '46', 9, 9, [2, 3, 4]],
  'Sri Lanka': ['LK', '94', 9, 9, [2, 3, 4]],
  Estonia: ['EE', '372', 7, 8, [4, 4]],
  Japan: ['JP', '81', 10, 10, [2, 4, 4]],
}

const flagOf = (iso: string) => String.fromCodePoint(...[...iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))

export const DIALS: Dial[] = COUNTRIES.flatMap((country) => {
  const t = T[country.en]
  return t ? [{ country, iso: t[0], dial: t[1], min: t[2], max: t[3], groups: t[4] ?? [3, 3, 4] }] : []
})

export const flagFor = (d: Dial) => flagOf(d.iso)

export const DIAL_UA = DIALS.find((d) => d.dial === '380')!

// Кілька країн з одним кодом (1, 7, 44): при вставці номера беремо головну.
const PRIMARY = ['United States', 'Kazakhstan', 'United Kingdom']
const byLongest = [...DIALS].sort((a, b) => b.dial.length - a.dial.length)
export function dialByCode(digits: string): Dial | null {
  const hits = byLongest.filter((d) => digits.startsWith(d.dial))
  if (!hits.length) return null
  const len = hits[0].dial.length
  const same = hits.filter((d) => d.dial.length === len)
  return same.find((d) => PRIMARY.includes(d.country.en)) ?? same[0]
}

export function group(digits: string, d: Dial) {
  const out: string[] = []
  let i = 0
  for (const g of d.groups) {
    if (i >= digits.length) break
    out.push(digits.slice(i, i + g))
    i += g
  }
  if (i < digits.length) out.push(digits.slice(i))
  return out.join(' ')
}

export const toValue = (d: Dial, digits: string) => (digits ? `+${d.dial} ${group(digits, d)}` : '')

// «+380 67 123 4567» (або «380671234567») → країна й цифри номера.
export function parsePhone(v: string, fallback: Dial = DIAL_UA): { dial: Dial; digits: string } {
  const all = v.replace(/\D/g, '')
  if (!all) return { dial: fallback, digits: '' }
  const d = v.trim().startsWith('+') ? dialByCode(all) : null
  if (!d) return { dial: fallback, digits: all.slice(0, fallback.max) }
  return { dial: d, digits: all.slice(d.dial.length, d.dial.length + d.max) }
}

export const phoneIncomplete = (d: Dial, digits: string) => digits.length > 0 && digits.length < d.min

export function findDials(q: string) {
  const n = q.trim().toLowerCase().replace(/^\+/, '')
  if (!n) return DIALS
  return DIALS.filter((d) => d.country.ru.toLowerCase().includes(n) || d.country.en.toLowerCase().includes(n) || d.dial.startsWith(n))
}
