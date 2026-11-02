import { isValidElement, useEffect, useRef, type ComponentType, type ReactNode } from 'react'
import { AlertTriangle, Inbox, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFrameKind } from '@/lib/frame'
import { useProto, type View } from '@/lib/proto-state'
import { cn } from '@/lib/utils'

// Спільні стани екрана для мобілки й вебу: порожньо, завантаження, помилка.
// Стан вибирають у панелі прототипу («Состояние экрана») → useView().
// Розміри підлаштовуються під рамку (телефон / браузер) самі.

/** Поточний стан екрана з панелі: 'normal' | 'empty' | 'loading' | 'error'. */
export function useView(): View {
  return useProto().state.view
}

/** «Повторить»: коротке завантаження і назад до звичайного стану. */
export function useRetry() {
  const { set } = useProto()
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return () => {
    set({ view: 'loading' })
    timer.current = window.setTimeout(() => set({ view: 'normal' }), 900)
  }
}

type Icon = ComponentType<{ className?: string }>

export type EmptyProps = {
  icon?: Icon
  title: string
  text?: ReactNode
  /** дія, напр. <Button>…</Button> */
  action?: ReactNode
  className?: string
}

// Порожньо: що тут буде і що зробити, щоб з'явилося. Тихо, без рамок-карток.
export function EmptyState({ icon: I = Inbox, title, text, action, className }: EmptyProps) {
  const web = useFrameKind() === 'web'
  return (
    <div className={cn('flex flex-col items-start gap-3', web ? 'mx-auto max-w-[420px] items-center py-16 text-center' : 'px-6 py-10', className)}>
      <span className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-primary">
        <I className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {text && <p className="text-[15px] text-muted-foreground">{text}</p>}
      </div>
      {action}
    </div>
  )
}

export type ErrorProps = {
  title?: string
  text?: ReactNode
  /** свій обробник «Повторить»; за замовчуванням — завантаження і звичайний стан */
  onRetry?: () => void
  className?: string
}

// Помилка завантаження з повтором. Колір помилки — signal.
export function ErrorState({ title = 'Не удалось загрузить', text = 'Проверьте подключение и попробуйте ещё раз.', onRetry, className }: ErrorProps) {
  const web = useFrameKind() === 'web'
  const retry = useRetry()
  return (
    <div role="alert" className={cn('flex flex-col items-start gap-3', web ? 'mx-auto max-w-[420px] items-center py-16 text-center' : 'px-6 py-10', className)}>
      <span className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-signal">
        <AlertTriangle className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-[15px] text-muted-foreground">{text}</p>
      </div>
      <Button variant="outline" size={web ? 'default' : 'lg'} className={cn('text-primary', !web && 'w-auto')} onClick={onRetry ?? retry}>
        <RotateCw /> Повторить
      </Button>
    </div>
  )
}

export type LoadingProps = {
  /** list — рядки списку (мобілка); cards — блоки; table — рядки таблиці (веб) */
  kind?: 'list' | 'cards' | 'table'
  rows?: number
  className?: string
}

// Завантаження: статична заглушка-скелет (як у q09), без мерехтіння.
export function LoadingState({ kind, rows, className }: LoadingProps) {
  const web = useFrameKind() === 'web'
  const k = kind ?? (web ? 'table' : 'list')
  const n = rows ?? (k === 'cards' ? 3 : 6)
  const bar = 'block rounded-full border border-border bg-surface'
  return (
    <div aria-busy="true" aria-label="Загрузка" className={cn('flex flex-col', !web && 'px-6 py-4', className)}>
      {k === 'cards' && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className="block h-28 rounded-xl border border-border bg-surface" />
          ))}
        </div>
      )}
      {k === 'list' && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="flex items-center gap-3 border-t border-border px-5 py-4 first:border-t-0">
              <span className="size-10 shrink-0 rounded-full bg-muted" />
              <span className="flex flex-1 flex-col gap-2">
                <span className={cn(bar, 'h-3.5 bg-muted', i % 2 ? 'w-1/2' : 'w-3/5')} />
                <span className={cn(bar, 'h-3 w-2/5 bg-muted')} />
              </span>
            </div>
          ))}
        </div>
      )}
      {k === 'table' && (
        <div className="flex flex-col">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="flex items-center gap-6 border-t border-border px-4 py-3.5 first:border-t-0">
              <span className="size-8 shrink-0 rounded-full bg-muted" />
              <span className={cn(bar, 'h-3 bg-muted', i % 2 ? 'w-40' : 'w-52')} />
              <span className={cn(bar, 'h-3 w-28 bg-muted')} />
              <span className={cn(bar, 'h-3 w-20 bg-muted')} />
              <span className={cn(bar, 'ml-auto h-3 w-16 bg-muted')} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const isEmptyProps = (x: unknown): x is EmptyProps => !!x && typeof x === 'object' && !isValidElement(x) && 'title' in x

// Обгортка: показує вміст у звичайному стані, а в інших — відповідну заглушку.
// empty / error / loading — пропси заглушки або свій вузол. Без empty — «Пока пусто».
export function ViewState({
  empty,
  error,
  loading,
  children,
}: {
  empty?: EmptyProps | ReactNode
  error?: ErrorProps | ReactNode
  loading?: LoadingProps | ReactNode
  children: ReactNode
}) {
  const view = useView()
  if (view === 'loading') return isValidElement(loading) ? loading : <LoadingState {...((loading as LoadingProps) ?? {})} />
  if (view === 'error') return isValidElement(error) ? error : <ErrorState {...((error as ErrorProps) ?? {})} />
  if (view === 'empty') {
    if (isEmptyProps(empty)) return <EmptyState {...empty} />
    return empty !== undefined ? <>{empty}</> : <EmptyState title="Пока пусто" />
  }
  return <>{children}</>
}
