// Дополнительные поля вакансии, которых нет в WebJob: места, языки, требования выбором (правка №52, п. 7).
// Лежат в bag 'r2.jobMeta' по id вакансии; r-job-edit пишет, r-job читает.

import type { LanguageLevel } from '@/components/web/language-levels-field'

export type JobMeta = {
  seats: string
  languages: LanguageLevel[]
  certs: string[]
  visas: string[]
  expPos: string
  expVessel: string
  engines: string[]
  tonnageKind: 'DWT' | 'GRT'
  tonnage: string
  dp: string
}

export const EMPTY_META: JobMeta = { seats: '1', languages: [], certs: [], visas: [], expPos: '', expVessel: '', engines: [], tonnageKind: 'DWT', tonnage: '', dp: '' }

export const SEATS = Array.from({ length: 10 }, (_, i) => String(i + 1))
export const LANG_OPTIONS = ['Английский', 'Русский', 'Украинский', 'Филиппинский', 'Хинди', 'Испанский']
export const LANG_LEVELS = ['Базовый', 'Рабочий', 'Свободный']
// Типы двигателей — временный список для прототипа.
export const ENGINE_TYPES = ['Дизельный низкооборотный', 'Дизельный среднеоборотный', 'Дизель-электрический', 'Газовый (dual-fuel)', 'Газовая турбина', 'Паротурбинный']
export const DP_LEVELS = ['Dynamic position 1', 'Dynamic position 2', 'Dynamic position 3']
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
  if (m.languages.length) out.push(`Языки: ${m.languages.map((l) => (l.level ? `${l.lang} — ${l.level.toLowerCase()}` : l.lang)).join(', ')}`)
  if (m.engines.length) out.push(`Типы двигателей: ${m.engines.join(', ')}`)
  if (m.tonnage.trim()) out.push(`${m.tonnageKind}: ${m.tonnage.trim()}`)
  if (m.dp) out.push(`DP Experience: ${m.dp}`)
  return out
}
