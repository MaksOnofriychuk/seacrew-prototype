import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Правка №53 (агент F): маленькие помощники очередей модерации. Лежат рядом с экранами, общих не трогают.

/** Кнопки действий прямо в строке: клик по ним не открывает запись. */
export function RowActions({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {children}
    </span>
  )
}

export function IconAction({ label, onClick, tone = 'default', children }: { label: string; onClick: () => void; tone?: 'default' | 'danger' | 'ok'; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex size-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-surface',
        tone === 'danger' && 'hover:text-signal',
        tone === 'ok' && 'hover:text-success',
        tone === 'default' && 'hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

/** «3 из 12 в очереди ‹ ›» над содержимым боковой панели. */
export function QueueNav({ index, total, onPrev, onNext, noun = 'в очереди' }: { index: number; total: number; onPrev: () => void; onNext: () => void; noun?: string }) {
  if (total < 2 || index < 0) return null
  return (
    <div className="-mt-1 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        <span className="font-mono">{index + 1}</span> из <span className="font-mono">{total}</span> {noun}
      </span>
      <span className="flex items-center gap-1">
        <button type="button" aria-label="Предыдущая запись" disabled={index === 0} onClick={onPrev} className="flex size-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent">
          <ChevronLeft className="size-4" />
        </button>
        <button type="button" aria-label="Следующая запись" disabled={index === total - 1} onClick={onNext} className="flex size-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent">
          <ChevronRight className="size-4" />
        </button>
      </span>
    </div>
  )
}
