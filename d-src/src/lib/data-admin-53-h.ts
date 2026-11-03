// Правка №53 (веб-адмінка, агент H): додаткові вигадані рядки для довідників, каталогу полів, журналів і витрат,
// щоб списки мали 2–3 сторінки. Спільні data-файли не чіпаємо — екрани підмішують ці масиви самі.
import { FLEET_TREE } from './data'
import { CATALOG, ENGINE_CHANGES, LAB, OTHER_ENTRIES, VESSEL_TYPES, type CatalogField, type EngineChange, type LabItem, type OtherEntry } from './data-admin'

/* ---------- довідники ---------- */

export const EXTRA_VESSELS: typeof VESSEL_TYPES = [
  { name: 'Car Carrier', fleet: 'Merchant', jobs: 5 },
  { name: 'Reefer', fleet: 'Merchant', jobs: 3 },
  { name: 'Multipurpose Vessel', fleet: 'Merchant', jobs: 4 },
  { name: 'Heavy Lift Vessel', fleet: 'Merchant', jobs: 0 },
  { name: 'Product Tanker', fleet: 'Merchant', jobs: 8 },
  { name: 'Asphalt Tanker', fleet: 'Merchant', jobs: 0 },
  { name: 'Tug', fleet: 'Offshore', jobs: 6 },
  { name: 'Supply Vessel', fleet: 'Offshore', jobs: 4 },
  { name: 'Pipe Layer', fleet: 'Offshore', jobs: 1 },
  { name: 'Seismic Vessel', fleet: 'Offshore', jobs: 0 },
  { name: 'Wind Farm SOV', fleet: 'Offshore', jobs: 3 },
  { name: 'Expedition Ship', fleet: 'Passenger / Cruise', jobs: 2 },
  { name: 'River Cruise', fleet: 'Passenger / Cruise', jobs: 1 },
  { name: 'Longliner', fleet: 'Fishing', jobs: 1 },
  { name: 'Purse Seiner', fleet: 'Fishing', jobs: 0 },
  { name: 'Research Vessel', fleet: 'Offshore', jobs: 0 },
]
export const ALL_VESSELS = [...VESSEL_TYPES, ...EXTRA_VESSELS]

export const EXTRA_OTHER: OtherEntry[] = [
  { id: 'ot7', text: 'Ice Pilot', list: 'Должность', context: 'Merchant → Deck', people: 2, first: '2026-10-12' },
  { id: 'ot8', text: 'Electrician Assistant', list: 'Должность', context: 'Merchant → Engine', people: 3, first: '2026-10-13' },
  { id: 'ot9', text: 'Ballast Operator', list: 'Должность', context: 'Merchant → Deck', people: 1, first: '2026-10-15' },
  { id: 'ot10', text: 'Pastry Chef', list: 'Должность', context: 'Passenger / Cruise → Hotel & Entertainment', people: 7, first: '2026-10-16' },
  { id: 'ot11', text: 'Dive Supervisor', list: 'Должность', context: 'Offshore → Deck', people: 2, first: '2026-10-17' },
  { id: 'ot12', text: 'Hybrid Tug', list: 'Тип судна', context: 'Offshore', people: 2, first: '2026-10-18' },
  { id: 'ot13', text: 'Sommelier', list: 'Должность', context: 'Passenger / Cruise → Hotel & Entertainment', people: 4, first: '2026-10-19' },
  { id: 'ot14', text: 'Bunker Barge', list: 'Тип судна', context: 'Merchant', people: 3, first: '2026-10-21' },
  { id: 'ot15', text: 'Crane Operator', list: 'Должность', context: 'Offshore → Deck', people: 5, first: '2026-10-23' },
  { id: 'ot16', text: 'Third Cook', list: 'Должность', context: 'Merchant → Other', people: 2, first: '2026-10-24' },
  { id: 'ot17', text: 'Fast Rescue Boat Crew', list: 'Должность', context: 'Merchant → Deck', people: 6, first: '2026-10-27' },
  { id: 'ot18', text: 'Ro-Pax', list: 'Тип судна', context: 'Passenger / Cruise', people: 4, first: '2026-10-28' },
  { id: 'ot19', text: 'Refrigeration Engineer', list: 'Должность', context: 'Fishing → Engine', people: 1, first: '2026-10-29' },
  { id: 'ot20', text: 'Net Mender', list: 'Должность', context: 'Fishing → Deck', people: 3, first: '2026-10-30' },
  { id: 'ot21', text: 'Dredger', list: 'Тип судна', context: 'Merchant', people: 2, first: '2026-10-31' },
  { id: 'ot22', text: 'Steward Trainee', list: 'Должность', context: 'Passenger / Cruise → Hotel & Entertainment', people: 8, first: '2026-11-02' },
]
export const ALL_OTHER = [...OTHER_ENTRIES, ...EXTRA_OTHER]

/** Дерево довідника з додатковими посадами (щоб колонка «Должность» була довгою) */
const MORE_POSITIONS: Record<string, string[]> = {
  'Merchant/Deck': ['4th Officer', 'Radio Officer', 'Deck Boy', 'Crane Operator', 'Lashing Foreman', 'Safety Officer', 'Security Officer (SSO)', 'Ice Navigator', 'Mooring Supervisor', 'Cargo Officer', 'Trainee Officer', 'Relief Master'],
  'Merchant/Engine': ['5th Engineer', 'Junior Engineer', 'Electrician', 'Refrigeration Engineer', 'Welder', 'Engine Room Rating', 'Plumber', 'Machinist', 'Gas Engineer', 'Superintendent Engineer'],
}
export function buildTree53(): Record<string, Record<string, string[]>> {
  const t: Record<string, Record<string, string[]>> = {}
  for (const f of Object.keys(FLEET_TREE)) {
    t[f] = {}
    for (const d of Object.keys((FLEET_TREE as Record<string, Record<string, string[]>>)[f])) {
      const base = (FLEET_TREE as Record<string, Record<string, string[]>>)[f][d]
      t[f][d] = [...base, ...(MORE_POSITIONS[`${f}/${d}`] ?? [])]
    }
  }
  return t
}

/* ---------- каталог полів ---------- */

const F = (id: string, label: string, lang: string, docType: string, source: 'ai' | 'seafarer', people: number, target: string | null, confirmed: number, rejected: number, state: CatalogField['state']): CatalogField => ({ id, label, lang, docType, source, people, target, confirmed, rejected, state })
export const EXTRA_CATALOG: CatalogField[] = [
  F('f12', 'Date of birth', 'EN', 'Загранпаспорт', 'ai', 530, 'Дата рождения', 501, 1, 'auto'),
  F('f13', 'Surname', 'EN', 'Загранпаспорт', 'ai', 544, 'Фамилия', 520, 0, 'auto'),
  F('f14', 'Given names', 'EN', 'Загранпаспорт', 'ai', 541, 'Имя', 512, 2, 'auto'),
  F('f15', 'Issuing authority', 'EN', 'Диплом', 'ai', 133, 'Кем выдан', 97, 11, 'auto'),
  F('f16', 'Date of issue', 'EN', 'Диплом', 'ai', 210, 'Дата выдачи', 190, 3, 'auto'),
  F('f17', 'Holder’s signature', 'EN', 'Seafarer’s ID', 'ai', 61, null, 0, 0, 'none'),
  F('f18', 'Nationality', 'EN', 'Seafarer’s ID', 'ai', 398, null, 0, 0, 'none'),
  F('f19', 'Limitations', 'EN', 'Диплом', 'ai', 88, 'Ограничения', 52, 14, 'auto'),
  F('f20', 'Regulation', 'EN', 'Сертификат', 'ai', 74, 'Правило STCW', 41, 22, 'offer'),
  F('f21', 'Certificate No.', 'EN', 'Сертификат', 'ai', 301, 'Номер документа', 280, 4, 'auto'),
  F('f22', 'Выдан', 'RU', 'Seaman’s Book', 'seafarer', 12, 'Кем выдан', 8, 1, 'admin'),
  F('f23', 'Дата видачі', 'UK', 'Диплом', 'ai', 36, 'Дата выдачи', 33, 0, 'auto'),
  F('f24', 'Vision', 'EN', 'Медицинский', 'ai', 17, null, 0, 0, 'none'),
  F('f25', 'Fit for sea service', 'EN', 'Медицинский', 'ai', 22, null, 0, 0, 'none'),
  F('f26', 'Rank', 'EN', 'Seaman’s Book', 'ai', 49, 'Квалификация', 12, 18, 'off'),
  F('f27', 'Level', 'EN', 'Сертификат', 'ai', 29, 'Уровень', 9, 8, 'offer'),
  F('f28', 'Course title', 'EN', 'Сертификат', 'ai', 66, 'Название', 51, 3, 'auto'),
  F('f29', 'Termin ważności', 'PL', 'Загранпаспорт', 'seafarer', 2, 'Дата окончания', 1, 0, 'offer'),
  F('f30', 'Place of birth', 'EN', 'Загранпаспорт', 'ai', 120, null, 0, 0, 'none'),
  F('f31', 'Authority code', 'EN', 'Seafarer’s ID', 'ai', 15, 'Кем выдан', 3, 7, 'off'),
]
export const ALL_CATALOG = [...CATALOG, ...EXTRA_CATALOG]

/* ---------- журнал движків ---------- */

const ENGS = ['claude-sonnet', 'gpt-vision', 'gemini-flash-lite', 'cf-qwen', 'two-stage']
const WHATS = ['Запусков в день: 200 → 500', 'USD в день: 5 → 10', 'Тайм-аут: 60 с → 90 с', 'Включён: выкл. → вкл.', 'Включён: вкл. → выкл.', 'USD в день: без лимита → 20', 'Тайм-аут: по умолчанию → 120 с', 'Запусков в день: 500 → без лимита']
export const EXTRA_ENGINE_CHANGES: EngineChange[] = Array.from({ length: 24 }, (_, i) => {
  const day = 28 - Math.floor(i * 0.9)
  return {
    id: `x${i}`,
    when: `2026-10-${String(Math.max(day, 2)).padStart(2, '0')} ${String(8 + ((i * 3) % 12)).padStart(2, '0')}:${String((i * 17) % 60).padStart(2, '0')}`,
    who: i % 3 ? 'ops@seafolio.example' : 'admin@seafolio.example',
    engine: ENGS[i % ENGS.length],
    what: WHATS[i % WHATS.length],
  }
})
export const ALL_ENGINE_CHANGES = [...ENGINE_CHANGES, ...EXTRA_ENGINE_CHANGES]

/* ---------- лабораторія ---------- */

const CATS = ['Seafarer’s ID', 'Диплом', 'Загранпаспорт', 'Сертификат', 'Медицинский', 'Seaman’s Book']
const STAT: LabItem['status'][] = ['CONFIRMED', 'CONFIRMED', 'NEEDS_REVIEW', 'FAILED', 'CONFIRMED', 'PROCESSING']
export const EXTRA_LAB: LabItem[] = Array.from({ length: 34 }, (_, i) => {
  const status = STAT[(i * 5) % STAT.length]
  return {
    id: `ex-${(0x6f00 - i * 37).toString(16)}`,
    when: `2026-10-${String(31 - Math.floor(i / 2)).padStart(2, '0')} ${String(7 + ((i * 5) % 15)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
    category: CATS[(i * 7) % CATS.length],
    test: i % 3 === 0,
    status,
    photos: 1 + (i % 4),
    runs: 1 + (i % 3),
    confirmed: status === 'CONFIRMED',
  }
})
export const ALL_LAB = [...LAB, ...EXTRA_LAB]

/* ---------- витрати по днях (раніше за 20.10) ---------- */

const OLD_USD = [0.8, 1.4, 2.1, 1.9, 0.7, 0.5, 2.6, 3.1, 2.8, 3.4, 2.2, 1.0, 0.6, 2.9, 3.6, 4.1, 3.3, 2.5, 1.1, 0.9]
export const EARLIER_COST: { day: string; usd: number }[] = OLD_USD.map((usd, i) => {
  const d = new Date(2026, 9, 19 - i)
  return { day: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, usd }
}).reverse()
