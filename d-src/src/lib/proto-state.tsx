import { createContext, useContext, useState, type ReactNode } from 'react'

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
}

type Ctx = {
  state: ProtoState
  set: (patch: Partial<ProtoState>) => void
  bag: <T>(key: string, fallback: T) => T
  setBag: (key: string, value: unknown) => void
}

const ProtoContext = createContext<Ctx | null>(null)

export function ProtoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProtoState>({ job: 0, feedFilter: 'all', scenario: 'ok', docType: 'sid', bag: {} })
  const set = (patch: Partial<ProtoState>) => setState((s) => ({ ...s, ...patch }))
  // null у bag означає «скинуто» — тоді повертаємо значення за замовчуванням
  const bag = <T,>(key: string, fallback: T) => (state.bag[key] == null ? fallback : (state.bag[key] as T))
  const setBag = (key: string, value: unknown) => setState((s) => ({ ...s, bag: { ...s.bag, [key]: value } }))
  return <ProtoContext.Provider value={{ state, set, bag, setBag }}>{children}</ProtoContext.Provider>
}

export function useProto() {
  const ctx = useContext(ProtoContext)
  if (!ctx) throw new Error('useProto outside ProtoProvider')
  return ctx
}
