import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Правка №21 (і №27): картка «Профиль заполнен на N %» — профіль, q09, бокове меню, «Вы почти у цели».

export function FillBar({ value, className }: { value: number; className?: string }) {
  const full = value >= 100
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-border', className)} role="progressbar" aria-label="Профиль заполнен" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <div className={cn('h-full rounded-full transition-[width] duration-200', full ? 'bg-success' : 'bg-primary')} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

// «Профиль заполнен на 80 %» — заголовок, смуга; під ними — пояснення й дія (children).
export function ProfileFillCard({ pct, children, className }: { pct: number; children?: ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-3 rounded-xl border border-border bg-card p-5', className)}>
      <h2 className="text-lg font-semibold">
        Профиль заполнен на <span className={cn('font-mono font-medium', pct >= 100 ? 'text-success' : 'text-primary')}>{pct} %</span>
      </h2>
      <FillBar value={pct} />
      {children}
    </section>
  )
}

// Компактний рядок для меню й списків: «Профиль заполнен на 80 %» і смуга під ним.
export function ProfileFillLine({ pct, onClick, className }: { pct: number; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex flex-col gap-2 text-left', className)}>
      <span className="text-[15px] font-medium">
        Профиль заполнен на <span className={cn('font-mono', pct >= 100 ? 'text-success' : 'text-primary')}>{pct} %</span>
      </span>
      <FillBar value={pct} />
    </button>
  )
}
