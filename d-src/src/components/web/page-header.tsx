import { useContext, type ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DescriptionAsTip, InfoTip } from './info-tip'

// Заголовок сторінки вебу: «назад» до списку (необов'язково), заголовок ліворуч, пояснення, дії праворуч.
export function PageHeader({
  title,
  description,
  back,
  actions,
  meta,
  plainDescription,
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
  /** в кабинете рекрутера description по умолчанию уходит в подсказку «i»; true — оставить строкой (если это данные, а не пояснение) */
  plainDescription?: boolean
  className?: string
}) {
  const asTip = useContext(DescriptionAsTip) && !plainDescription && !!description
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
          {asTip ? (
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{title}</h1>
              <InfoTip text={description} />
            </div>
          ) : (
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{title}</h1>
          )}
          {description && !asTip && <p className="max-w-[720px] text-[15px] text-muted-foreground">{description}</p>}
          {meta && <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

// Вкладки під заголовком сторінки: підкреслення primary, лічильник — кругла плашка (понад 99 — «99+»); ширина за вмістом.
// Вкладка перемикає вміст тієї ж сторінки, а не веде на іншу.
export function PageTabs<T extends string>({
  tabs,
  value,
  onChange,
  trailing,
  className,
}: {
  tabs: { id: T; label: string; count?: number }[]
  value: T
  onChange: (id: T) => void
  /** справа от вкладок, вне прокрутки (напр. значок «i» с подсказкой) */
  trailing?: ReactNode
  className?: string
}) {
  const list = (cls: string) => (
    <div role="tablist" className={cls}>
      {tabs.map((t) => {
        const on = t.id === value
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              '-mb-px flex h-10 shrink-0 items-center gap-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors',
              on ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-xs leading-none',
                  on ? 'bg-primary text-primary-foreground' : 'bg-border text-foreground/70',
                )}
                aria-label={`Всего: ${t.count}`}
              >
                {t.count > 99 ? '99+' : t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
  if (!trailing) return list(cn('mb-6 flex gap-6 overflow-x-auto border-b border-border', className))
  return (
    <div className={cn('mb-6 flex items-stretch', className)}>
      {list('flex min-w-0 flex-1 gap-6 overflow-x-auto border-b border-border')}
      <div className="flex shrink-0 items-center border-b border-border pl-4">{trailing}</div>
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
