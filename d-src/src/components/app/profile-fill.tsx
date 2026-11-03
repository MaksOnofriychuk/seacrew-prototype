import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Правка №21 (і №27): картка «Профиль заполнен на N %» — профіль, q09, бокове меню, «Вы почти у цели».

// Колір за заповненням — та сама шкала, що й сила пароля: мало — помаранчевий, середньо — жовтий,
// майже все — жовто-зелений, усе — зелений.
export function fillTone(pct: number) {
  if (pct >= 100) return { bar: 'bg-success', text: 'text-success' }
  if (pct >= 70) return { bar: 'bg-[color-mix(in_oklab,var(--warning),var(--success))]', text: 'text-[color-mix(in_oklab,var(--warning),var(--success))]' }
  if (pct >= 40) return { bar: 'bg-warning', text: 'text-warning' }
  return { bar: 'bg-signal', text: 'text-signal' }
}

export function FillBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-border', className)} role="progressbar" aria-label="Профиль заполнен" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <div className={cn('h-full rounded-full transition-[width,background-color] duration-200', fillTone(value).bar)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

// «Профиль заполнен на 80 %» (моноширинне лише число) — заголовок, смуга; під ними — пояснення й дія (children).
export function ProfileFillCard({ pct, children, className }: { pct: number; children?: ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-3 rounded-xl border border-border bg-card p-5', className)}>
      <h2 className="text-lg font-semibold">
        Профиль заполнен на <span className={cn('whitespace-nowrap', fillTone(pct).text)}>
          <span className="font-mono font-medium">{pct}</span>{'\u00a0'}%
        </span>
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
        Профиль заполнен на <span className={cn('whitespace-nowrap', fillTone(pct).text)}>
          <span className="font-mono">{pct}</span>{'\u00a0'}%
        </span>
      </span>
      <FillBar value={pct} />
    </button>
  )
}
