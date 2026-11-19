// Поля профиля моряка для расширенных фильтров поиска рекрутера. Всё вымышленное.

/** 1 — знаком с оборудованием, 2 — практический опыт эксплуатации, 3 — обслуживание и устранение неисправностей */
export type TechLevel = 1 | 2 | 3
export const TECH_LEVELS: { value: TechLevel; label: string; hint: string }[] = [
  { value: 1, label: 'Familiar with', hint: 'знаком с оборудованием' },
  { value: 2, label: 'Operational Experience', hint: 'имеет практический опыт эксплуатации' },
  { value: 3, label: 'Maintenance & Troubleshooting', hint: 'выполнял обслуживание и устранение неисправностей' },
]

export const TECH_GROUPS: { name: string; items: string[] }[] = [
  { name: 'Automation', items: ['Kongsberg K-Chief', 'Kongsberg K-Pos', 'K-Bridge', 'ABB', 'Siemens PLC', 'Wärtsilä Automation'] },
  { name: 'DP Systems', items: ['DP Class 1', 'DP Class 2', 'DP Class 3', 'DP Operations', 'DP Maintenance', 'DP Trials', 'DP FMEA'] },
  { name: 'Navigation', items: ['Furuno', 'JRC', 'Sperry Marine', 'Raytheon Anschütz', 'ECDIS', 'Radar / ARPA'] },
  { name: 'Propulsion', items: ['Schottel', 'Brunvoll', 'ABB Azipod', 'Wärtsilä', 'Rolls-Royce Thrusters'] },
  { name: 'Electrical', items: ['High Voltage'] },
  { name: 'Offshore Equipment', items: ['NOV', 'Huisman', 'MacGregor', 'Liebherr', 'Ampelmann', 'ROV LARS', 'Cable Laying Systems'] },
]

export const LEVELS = ['A2', 'B1', 'B2', 'C1', 'C2']
export const levelRank = (l: string) => ['A1', ...LEVELS].indexOf(l)

export const CURRENCIES = ['USD', 'EUR', 'GBP']
const TO_USD: Record<string, number> = { USD: 1, EUR: 1.1, GBP: 1.3 }

export const GENDER_OPTIONS = [
  { value: 'M', label: 'Мужской' },
  { value: 'F', label: 'Женский' },
]

export const EDUCATION_OPTIONS = ['Диплом рядового (CoP)', 'Младший специалист', 'Бакалавр', 'Магистр']
export const LANGUAGE_OPTIONS = ['Русский', 'Украинский', 'Испанский', 'Немецкий', 'Французский', 'Польский', 'Хинди']

export type Salary = { amount: number; currency: string; period: 'month' | 'day' }
export type SearchProfile = {
  age: number
  residence: string
  gender: 'M' | 'F'
  /** самое большое судно, на котором работал (т) */
  dwt: number
  gt: number
  salary: Salary
  /** языки кроме английского (английский — englishLevel моряка) */
  languages: { lang: string; level: string }[]
  education: string
  /** опыт в текущей должности, месяцев */
  rankMonths: number
  tech: Record<string, TechLevel>
}

/** Ожидаемая зарплата в USD за месяц — чтобы сравнивать день/месяц и разные валюты. */
export const salaryMonthly = (s: Salary) => s.amount * TO_USD[s.currency] * (s.period === 'day' ? 30 : 1)

const t = (s: string): Record<string, TechLevel> => Object.fromEntries(s.split('|').filter(Boolean).map((p) => [p.slice(0, p.lastIndexOf(':')), Number(p.slice(-1)) as TechLevel]))
const l = (s: string) => s.split(',').filter(Boolean).map((p) => ({ lang: p.split(':')[0], level: p.split(':')[1] }))
const sal = (amount: number, currency: string, period: 'month' | 'day' = 'month'): Salary => ({ amount, currency, period })

type Row = [id: string, age: number, residence: string, gender: 'M' | 'F', dwt: number, gt: number, salary: Salary, languages: string, education: string, rankMonths: number, tech: string]

const ROWS: Row[] = [
  ['sf01', 31, 'Украина', 'M', 48000, 29000, sal(5200, 'USD'), 'Русский:C2,Украинский:C2', 'Бакалавр', 20, 'Kongsberg K-Chief:2|ABB:1|Siemens PLC:2|Wärtsilä Automation:1'],
  ['sf02', 44, 'Грузия', 'M', 82000, 45000, sal(7600, 'USD'), 'Русский:C1', 'Магистр', 62, 'ECDIS:3|Radar / ARPA:3|Furuno:2'],
  ['sf03', 36, 'Филиппины', 'M', 61000, 38000, sal(2100, 'USD'), '', 'Диплом рядового (CoP)', 36, ''],
  ['sf04', 38, 'Индия', 'M', 4500, 3200, sal(7200, 'USD'), 'Хинди:C2', 'Бакалавр', 30, 'Kongsberg K-Pos:3|DP Class 2:2|DP Maintenance:3|High Voltage:3|Siemens PLC:2|Schottel:2'],
  ['sf05', 41, 'Латвия', 'M', 5200, 3600, sal(420, 'EUR', 'day'), 'Русский:C1,Немецкий:B1', 'Бакалавр', 40, 'Kongsberg K-Pos:3|DP Class 2:3|DP Class 3:2|DP Operations:3|DP Trials:2|ECDIS:3|Furuno:2'],
  ['sf06', 52, 'Польша', 'M', 74000, 41000, sal(9800, 'USD'), 'Польский:C2,Немецкий:B2', 'Магистр', 48, 'ABB:3|Siemens PLC:3|Wärtsilä Automation:2|Wärtsilä:3'],
  ['sf07', 33, 'Румыния', 'F', 118000, 96000, sal(4300, 'EUR'), 'Французский:B2', 'Бакалавр', 24, 'ECDIS:3|Radar / ARPA:2|JRC:2|Sperry Marine:1'],
  ['sf08', 27, 'Азербайджан', 'M', 52000, 31000, sal(1500, 'USD'), 'Русский:C2', 'Диплом рядового (CoP)', 18, 'Siemens PLC:1'],
  ['sf09', 46, 'Хорватия', 'M', 4800, 3300, sal(3900, 'EUR'), 'Немецкий:B1', 'Диплом рядового (CoP)', 70, 'Huisman:2|MacGregor:3|NOV:2|Ampelmann:1|Cable Laying Systems:2'],
  ['sf10', 39, 'Украина', 'M', 38000, 52000, sal(6400, 'USD'), 'Русский:C2,Украинский:C2,Польский:B1', 'Магистр', 36, 'ABB:2|Siemens PLC:2|Wärtsilä:2'],
  ['sf11', 49, 'Болгария', 'F', 66000, 40000, sal(2800, 'EUR'), 'Русский:B2', 'Диплом рядового (CoP)', 96, ''],
  ['sf12', 55, 'Украина', 'M', 51000, 33000, sal(13500, 'USD'), 'Русский:C2,Украинский:C2', 'Магистр', 72, 'ECDIS:3|Radar / ARPA:3|Raytheon Anschütz:2|Sperry Marine:3'],
  ['sf13', 40, 'Украина', 'M', 76000, 43000, sal(6800, 'USD'), 'Русский:C2,Украинский:C2', 'Магистр', 30, 'ECDIS:2|Radar / ARPA:2|JRC:1'],
  ['sf14', 34, 'Филиппины', 'F', 70000, 42000, sal(2300, 'USD'), '', 'Диплом рядового (CoP)', 30, ''],
  ['sf15', 29, 'Грузия', 'M', 45000, 28000, sal(4700, 'USD'), 'Русский:C1', 'Бакалавр', 14, 'ABB:1|Siemens PLC:1'],
  ['sf16', 37, 'Украина', 'M', 63000, 37000, sal(2600, 'EUR'), 'Русский:C2,Украинский:C2', 'Диплом рядового (CoP)', 45, ''],
  ['sf17', 24, 'Египет', 'M', 30000, 18000, sal(1300, 'USD'), '', 'Младший специалист', 10, ''],
  ['sf18', 35, 'Румыния', 'M', 5000, 3500, sal(4800, 'GBP'), 'Французский:B1', 'Бакалавр', 28, 'DP Class 1:2|DP Operations:1|ECDIS:2|Furuno:2'],
  ['sf19', 42, 'Индия', 'M', 55000, 32000, sal(7100, 'USD'), 'Хинди:C2', 'Магистр', 50, 'Wärtsilä:3|Siemens PLC:2|ABB:3'],
  ['sf20', 45, 'Хорватия', 'M', 59000, 36000, sal(3300, 'EUR'), 'Немецкий:B2', 'Диплом рядового (CoP)', 80, 'Liebherr:1'],
  ['sf21', 58, 'Украина', 'M', 90000, 58000, sal(14200, 'USD'), 'Русский:C2,Украинский:C2', 'Магистр', 110, 'ECDIS:3|Radar / ARPA:3'],
  ['sf22', 50, 'Турция', 'M', 80000, 46000, sal(10400, 'USD'), 'Немецкий:B1', 'Магистр', 66, 'ABB:3|Wärtsilä Automation:3|Wärtsilä:3|Siemens PLC:2'],
  ['sf23', 43, 'Латвия', 'M', 6100, 4100, sal(480, 'EUR', 'day'), 'Русский:C1', 'Бакалавр', 52, 'Kongsberg K-Pos:3|K-Bridge:2|DP Class 2:3|DP Class 3:3|DP Operations:3|DP FMEA:2|DP Maintenance:2|Brunvoll:2'],
  ['sf24', 30, 'Болгария', 'M', 42000, 24000, sal(2400, 'EUR'), 'Русский:B2', 'Младший специалист', 12, 'Siemens PLC:1'],
  ['sf25', 26, 'Филиппины', 'F', 124000, 105000, sal(1800, 'USD'), '', 'Диплом рядового (CoP)', 8, ''],
  ['sf26', 47, 'Украина', 'M', 57000, 34000, sal(3000, 'USD'), 'Русский:C2,Украинский:C2', 'Диплом рядового (CoP)', 36, ''],
  ['sf27', 28, 'Хорватия', 'M', 68000, 39000, sal(3100, 'EUR'), 'Немецкий:B2', 'Бакалавр', 14, 'ECDIS:2|Furuno:1'],
  ['sf28', 44, 'Польша', 'M', 4700, 3300, sal(5600, 'EUR'), 'Польский:C2', 'Младший специалист', 40, 'High Voltage:3|Siemens PLC:3|ABB:2|ABB Azipod:2|Schottel:3'],
]

const PROFILES: Record<string, SearchProfile> = Object.fromEntries(
  ROWS.map(([id, age, residence, gender, dwt, gt, salary, languages, education, rankMonths, tech]) => [id, { age, residence, gender, dwt, gt, salary, languages: l(languages), education, rankMonths, tech: t(tech) }]),
)

export const searchProfile = (id: string): SearchProfile => PROFILES[id]

const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'ru'))
export const RESIDENCE_OPTIONS = uniq(ROWS.map((r) => r[2]))
