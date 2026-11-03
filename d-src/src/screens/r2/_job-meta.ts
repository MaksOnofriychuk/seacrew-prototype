// Дополнительные поля вакансии, которых нет в WebJob: места, языки, требования выбором (правка №52, п. 7).
// Лежат в bag 'r2.jobMeta' по id вакансии; r-job-edit пишет, r-job читает.

export type JobMeta = {
  seats: string
  langs: string[]
  english: string
  certs: string[]
  visas: string[]
  expPos: string
  expVessel: string
  note: string
}

export const EMPTY_META: JobMeta = { seats: '1', langs: [], english: '', certs: [], visas: [], expPos: '', expVessel: '', note: '' }

export const SEATS = Array.from({ length: 10 }, (_, i) => String(i + 1))
export const LANG_OPTIONS = ['Английский', 'Русский', 'Украинский', 'Филиппинский', 'Хинди', 'Испанский']
export const ENGLISH_LEVELS = ['Не важен', 'Базовый', 'Рабочий', 'Свободный']
export const CERT_OPTIONS = [
  'STCW II/1 (вахтенный помощник)',
  'STCW II/2 (старпом / капитан)',
  'STCW III/1 (вахтенный механик)',
  'STCW III/2 (2-й / старший механик)',
  'GMDSS GOC',
  'Advanced Fire Fighting',
  'Tanker Familiarization',
  'Chemical Tanker (специализация)',
  'Gas Tanker (LPG / LNG)',
  'BOSIET',
  'DP Unlimited',
  'High Voltage',
  'ECDIS',
  'Crowd Management',
  'Сертификат судового повара',
]
export const VISA_OPTIONS = ['США C1/D', 'Шенген', 'Великобритания', 'Канада', 'Австралия', 'ОАЭ']
export const EXPERIENCE = ['Не требуется', 'от 6 месяцев', 'от 1 года', 'от 2 лет', 'от 3 лет', 'от 5 лет', 'от 8 лет']

/** Требования одной строкой (для карточки и страницы вакансии). */
export function requirementLines(m: JobMeta): string[] {
  const out: string[] = []
  if (m.expPos && m.expPos !== EXPERIENCE[0]) out.push(`Стаж в должности ${m.expPos}`)
  if (m.expVessel && m.expVessel !== EXPERIENCE[0]) out.push(`Опыт на этом типе судна ${m.expVessel}`)
  if (m.certs.length) out.push(`Сертификаты: ${m.certs.join(', ')}`)
  if (m.visas.length) out.push(`Визы: ${m.visas.join(', ')}`)
  if (m.langs.length) out.push(`Языки: ${m.langs.join(', ')}${m.english && m.english !== ENGLISH_LEVELS[0] ? `, английский — ${m.english.toLowerCase()}` : ''}`)
  if (m.note.trim()) out.push(m.note.trim())
  return out
}
