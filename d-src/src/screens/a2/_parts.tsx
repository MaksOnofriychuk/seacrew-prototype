import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Спільне для екранів адмінки, частина 2. Каркас, Facts, SideSheet тощо — з ../a/_parts (лише імпорт).

/**
 * Тиха позначка «пример»: значення — заглушка, бо замовник ще не відповів.
 * q — номер питання з анкети, щоб було видно, на що чекаємо.
 */
export function Sample({ q, className }: { q?: string; className?: string }) {
  return (
    <span
      title={q ? `Ответа заказчика нет (вопрос ${q}). Значение для примера.` : 'Значение для примера'}
      className={cn('inline-flex h-5 shrink-0 items-center rounded-full border border-dashed border-muted-foreground/50 px-2 align-middle text-xs font-normal text-muted-foreground', className)}
    >
      пример{q && <span className="ml-1 font-mono">{q}</span>}
    </span>
  )
}

/** Тонка смужка заповнення: використано з ліміту. */
export function UsageBar({ used, limit, className }: { used: number; limit: number | null; className?: string }) {
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0
  return (
    <span className={cn('block h-1.5 overflow-hidden rounded-full bg-muted', className)} aria-hidden="true">
      {limit !== null && <span className={cn('block h-full rounded-full', pct >= 100 ? 'bg-muted-foreground/60' : pct > 85 ? 'bg-warning' : 'bg-primary')} style={{ width: `${pct}%` }} />}
    </span>
  )
}

/** Рядок-підсумок над таблицею: звичайний текст із цифрами моноширинним. */
export function SummaryLine({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('mb-4 text-[15px]', className)}>{children}</p>
}
