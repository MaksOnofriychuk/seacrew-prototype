import { useProto } from '@/lib/proto-state'

// Настройки вида кабинета рекрутера (правка №52, п. 11). Живут в bag под ключом 'rweb.prefs'.
// WebShell (recruiter) читает их и ставит data-атрибуты на свой корень — стили в src/web-themes.css.
// Другие экраны могут читать usePrefs().prefs: rows (строк на странице по умолчанию), start (стартовая страница),
// dateFmt / tz / lang — для подписей.

export type Accent = 'blue' | 'emerald' | 'amber' | 'violet' | 'coral' | 'graphite'
export type FullTheme = 'none' | 'ocean' | 'night' | 'deck'
export type FontKind = 'inter' | 'system' | 'digits'
export type SizeKind = 'sm' | 'md' | 'lg'
export type DensKind = 'compact' | 'normal' | 'roomy'
export type Channel = { email: boolean; cabinet: boolean }

export const NOTIFY_EVENTS = [
  { id: 'application', label: 'Новый отклик на вакансию' },
  { id: 'invitation', label: 'Моряк ответил на приглашение' },
  { id: 'message', label: 'Новое сообщение в диалоге' },
  { id: 'form', label: 'Моряк заполнил анкету' },
  { id: 'billing', label: 'Счета и срок тарифа' },
] as const
export type NotifyId = (typeof NOTIFY_EVENTS)[number]['id']

export type Prefs = {
  accent: Accent
  full: FullTheme
  font: FontKind
  size: SizeKind
  density: DensKind
  lang: 'ru' | 'uk' | 'en'
  tz: string
  dateFmt: 'dmy' | 'iso' | 'long' | 'mdy'
  start: string
  rows: string
  notify: Record<NotifyId, Channel>
}

export const DEFAULT_PREFS: Prefs = {
  accent: 'blue',
  full: 'none',
  font: 'inter',
  size: 'md',
  density: 'normal',
  lang: 'ru',
  tz: 'auto',
  dateFmt: 'dmy',
  start: 'r-search',
  rows: '20',
  notify: {
    application: { email: true, cabinet: true },
    invitation: { email: false, cabinet: true },
    message: { email: true, cabinet: true },
    form: { email: false, cabinet: true },
    billing: { email: true, cabinet: false },
  },
}

const KEY = 'rweb.prefs'

export function usePrefs() {
  const { bag, setBag } = useProto()
  const saved = bag<Partial<Prefs>>(KEY, {})
  const prefs: Prefs = { ...DEFAULT_PREFS, ...saved, notify: { ...DEFAULT_PREFS.notify, ...saved.notify } }
  return {
    prefs,
    set: (patch: Partial<Prefs>) => setBag(KEY, { ...saved, ...patch }),
    reset: () => setBag(KEY, null),
  }
}

/** data-атрибуты оформления; акцент не ставим, когда выбрана готовая тема целиком */
export function themeAttrs(p: Prefs): Record<string, string> {
  const a: Record<string, string> = {}
  if (p.full !== 'none') a['data-rweb-full'] = p.full
  else if (p.accent !== 'blue') a['data-rweb-acc'] = p.accent
  if (p.font !== 'inter') a['data-rweb-font'] = p.font
  if (p.size !== 'md') a['data-rweb-size'] = p.size
  if (p.density !== 'normal') a['data-rweb-dens'] = p.density
  return a
}
