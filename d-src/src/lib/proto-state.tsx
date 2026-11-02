import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useFrameKind } from './frame'
import type { View } from './route'

export type { View } from './route'

// Сценарії — ті самі, що в панелі вкладки C.
export const SCENARIOS = [
  ['ok', 'Всё хорошо'],
  ['blur', 'ИИ не прочитал документ'],
  ['notSeafarer', 'Это не документ моряка'],
  ['offline', 'Нет интернета'],
  ['rate', 'Слишком много попыток'],
  ['ban', 'Документ в бан-листе'],
  ['docTaken', 'Документ уже зарегистрирован'],
  ['noName', 'Имя не прочитано'],
  ['emailTaken', 'Email уже занят'],
] as const

export type Scenario = (typeof SCENARIOS)[number][0]

// Стан прототипу, спільний для кількох екранів (як S у вкладці C).
// bag — вільне сховище для станів окремих потоків (ключі з префіксом екрана, напр. 'q03.cv').
type ProtoState = {
  job: number
  feedFilter: 'all' | 'people' | 'news'
  scenario: Scenario
  docType: 'sid' | 'diploma'
  bag: Record<string, unknown>
  /** стан екрана з панелі: звичайний, порожньо, завантаження, помилка (живе в адресі: v=) */
  view: View
  /** коротке повідомлення внизу телефона; живе й після переходу на інший екран */
  toast: { text: string; id: number } | null
}

type Ctx = {
  state: ProtoState
  set: (patch: Partial<ProtoState>) => void
  bag: <T>(key: string, fallback: T) => T
  setBag: (key: string, value: unknown) => void
  showToast: (text: string) => void
}

const ProtoContext = createContext<Ctx | null>(null)

type Inner = Omit<ProtoState, 'view'>

// view не зберігається тут: його джерело — адреса (App передає view і onView).
export function ProtoProvider({ children, view = 'normal', onView }: { children: ReactNode; view?: View; onView?: (v: View) => void }) {
  const [inner, setState] = useState<Inner>({ job: 0, feedFilter: 'all', scenario: 'ok', docType: 'sid', bag: {}, toast: null })
  const state: ProtoState = { ...inner, view }
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const showToast = (text: string) => {
    window.clearTimeout(timer.current)
    setState((s) => ({ ...s, toast: { text, id: Date.now() } }))
    timer.current = window.setTimeout(() => setState((s) => ({ ...s, toast: null })), 4000)
  }
  const set = ({ view: nextView, ...patch }: Partial<ProtoState>) => {
    if (nextView !== undefined) onView?.(nextView)
    if (Object.keys(patch).length) setState((s) => ({ ...s, ...patch }))
  }
  // null у bag означає «скинуто» — тоді повертаємо значення за замовчуванням
  const bag = <T,>(key: string, fallback: T) => (state.bag[key] == null ? fallback : (state.bag[key] as T))
  const setBag = (key: string, value: unknown) => setState((s) => ({ ...s, bag: { ...s.bag, [key]: value } }))
  return <ProtoContext.Provider value={{ state, set, bag, setBag, showToast }}>{children}</ProtoContext.Provider>
}

export function useProto() {
  const ctx = useContext(ProtoContext)
  if (!ctx) throw new Error('useProto outside ProtoProvider')
  return ctx
}

// Тост для showToast: у телефоні — над нижньою дією, у браузері — у правому нижньому куті.
export function ToastHost() {
  const { state } = useProto()
  const web = useFrameKind() === 'web'
  if (!state.toast) return null
  return (
    <div
      key={state.toast.id}
      role="status"
      className={
        web
          ? 'screen-in absolute right-6 bottom-6 z-40 w-[360px] rounded-md bg-foreground px-4 py-3 text-sm text-surface'
          : 'screen-in absolute inset-x-6 bottom-28 z-40 rounded-md bg-foreground px-4 py-3 text-sm text-surface'
      }
    >
      {state.toast.text}
    </div>
  )
}
