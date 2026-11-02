import type { ReactNode } from 'react'
import { X, type LucideIcon } from 'lucide-react'
import { Footer, NavBar, Wordmark } from '@/components/app/chrome'
import { Button } from '@/components/ui/button'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { SCREENS } from '../registry'

// Спільний каркас екранів помилок e01–e09 (як qError у C):
// невеликий знак ліворуч, заголовок-проблема, пояснення, блок «що робити», дії внизу.
// Без великого значка в колі по центру — сильний елемент тут заголовок.

export type Tone = 'signal' | 'warning' | 'primary' | 'muted'

const TONE: Record<Tone, string> = {
  signal: 'text-signal',
  warning: 'text-warning',
  primary: 'text-primary',
  muted: 'text-muted-foreground',
}

export function ErrorLayout({
  icon: Icon,
  tone,
  title,
  text,
  onBack,
  onClose,
  children,
  actions,
  low = false,
  brand = false,
}: {
  icon: LucideIcon
  tone: Tone
  title: string
  text: ReactNode
  /** «Назад» — до завантаження документа (e01, e02, e03, e06) */
  onBack?: () => void
  /** хрестик — вихід з реєстрації (e04, e05) */
  onClose?: () => void
  children?: ReactNode
  actions: ReactNode
  /** короткий екран без блоку (e04–e06): більший знак, текст опущено ближче до кнопок — без порожнечі посередині */
  low?: boolean
  /** без «Назад» і хрестика — «Seafolio» вгорі (e09: з екрана нікуди не піти, лише оновитись) */
  brand?: boolean
}) {
  return (
    <div className="flex h-full flex-col">
      {brand ? (
        <div className="flex h-12 shrink-0 items-center px-6">
          <Wordmark />
        </div>
      ) : (
        <NavBar
          onBack={onBack}
          right={
            onClose && (
              <button type="button" onClick={onClose} aria-label="Закрыть" className="flex size-11 items-center justify-center rounded-md text-muted-foreground active:scale-95">
                <X className="size-6" />
              </button>
            )
          }
        />
      )}
      <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-3 pb-4', low && 'justify-end pb-8')}>
        <Icon className={cn('shrink-0', low ? 'size-14' : 'size-7', TONE[tone])} strokeWidth={low ? 1.5 : 1.75} aria-hidden="true" />
        <h1 className="mt-4 text-[32px] leading-[1.1] font-semibold tracking-tight text-balance">{title}</h1>
        <p className="mt-3 text-base text-muted-foreground">{text}</p>
        {children}
      </div>
      <Footer>
        {actions}
      </Footer>
    </div>
  )
}

// Тихий заголовок блоку «что делать» всередині екрана.
export function BlockTitle({ children }: { children: ReactNode }) {
  return <h2 className="mt-8 text-base font-semibold">{children}</h2>
}

// «Написать в поддержку» (e04, e05, e06, e08): екран підтримки m-support робить інший етап.
// Поки його немає в реєстрі — коротке повідомлення внизу, щоб кнопка не була мертвою.
export function useSupport(go: (id: string) => void) {
  const { showToast } = useProto()
  return () => (SCREENS.some((s) => s.id === 'm-support') ? go('m-support') : showToast('Открываем чат с поддержкой'))
}

// Три виходи, коли документ не підійшов (e01, e02) — поведінка C: retake, upload-file, c:e07.
// keepScenario: сценарій лишається — наступне читання знову з помилкою: e02 (правка №12) → блокування e08,
// e01 (відповідь 78) → лише «Ввести вручную». Без нього повторна спроба вдається, як у C.
export function RetryActions({ go, keepScenario = false }: { go: (id: string) => void; keepScenario?: boolean }) {
  const { set, setBag } = useProto()
  const back = (sheet: 'doc' | null) => {
    if (!keepScenario) set({ scenario: 'ok' })
    setBag('q03.sheet', sheet)
    // q03 показує документ як ще не завантажений (як retake у C)
    setBag('q03.retake', true)
    go('q03')
  }
  return (
    <>
      <Button size="lg" onClick={() => back(null)}>
        Сфотографировать ещё раз
      </Button>
      <Button size="lg" variant="outline" onClick={() => back('doc')}>
        Загрузить файл
      </Button>
      <Button size="lg" variant="ghost" className="text-primary" onClick={() => go('e07')}>
        Ввести вручную
      </Button>
    </>
  )
}

// Як fmtCd у C: 872 → «14:32».
export function fmtCd(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}
