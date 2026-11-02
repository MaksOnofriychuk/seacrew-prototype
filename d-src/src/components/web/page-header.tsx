import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// Заголовок сторінки вебу: «назад» до списку (необов'язково), заголовок ліворуч, пояснення, дії праворуч.
export function PageHeader({
  title,
  description,
  back,
  actions,
  meta,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  /** посилання над заголовком: { label: 'Кандидаты', onClick } */
  back?: { label: string; onClick: () => void }
  /** кнопки праворуч (головна — остання) */
  actions?: ReactNode
  /** тихий рядок під заголовком (напр. статус і дата) */
  meta?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-2', className)}>
      {back && (
        <button type="button" onClick={back.onClick} className="-ml-1 flex items-center gap-1 self-start text-sm font-medium text-primary">
          <ChevronLeft className="size-4" />
          {back.label}
        </button>
      )}
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{title}</h1>
          {description && <p className="max-w-[720px] text-[15px] text-muted-foreground">{description}</p>}
          {meta && <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

// Вкладки під заголовком сторінки: підкреслення primary, лічильник моноширинним.
export function PageTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: string; count?: number }[]
  value: T
  onChange: (id: T) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn('mb-6 flex gap-6 border-b border-border', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === value}
          onClick={() => onChange(t.id)}
          className={cn(
            '-mb-px flex h-10 items-center gap-2 border-b-2 text-sm font-medium transition-colors',
            t.id === value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="font-mono text-xs text-muted-foreground">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

// Білий блок сторінки з необов'язковим заголовком (для форм і карток профілю).
export function WebCard({ title, aside, children, className }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-xl border border-border bg-surface', className)}>
      {(title || aside) && (
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {aside}
        </div>
      )}
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}
