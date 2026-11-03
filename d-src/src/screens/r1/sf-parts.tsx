import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Свёртываемые блоки профиля, анкет и файлов в карточке кандидата (правка №52, п. 1–5).
// Вид как у строк на мобилке: заголовок со сводкой справа и шевроном, содержимое раскрывается под ним.

export function Fold({
  title,
  aside,
  open,
  defaultOpen = true,
  onToggle,
  children,
  className,
  flush = false,
  level = 1,
}: {
  title: ReactNode
  /** сводка справа: число, статус */
  aside?: ReactNode
  /** управляемое состояние (иначе — своё) */
  open?: boolean
  defaultOpen?: boolean
  onToggle?: (v: boolean) => void
  children: ReactNode
  className?: string
  /** без внутренних отступов у содержимого */
  flush?: boolean
  /** 1 — блок-карточка, 2 — строка внутри блока */
  level?: 1 | 2
}) {
  const [own, setOwn] = useState(defaultOpen)
  const isOpen = open ?? own
  const toggle = () => {
    onToggle?.(!isOpen)
    if (open === undefined) setOwn(!isOpen)
  }
  const head = (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={isOpen}
      className={cn('flex w-full items-center gap-3 text-left transition-colors hover:bg-muted', level === 1 ? 'h-12 px-5' : 'min-h-11 px-5 py-2')}
    >
      <span className={cn('min-w-0 flex-1 truncate', level === 1 ? 'text-[15px] font-semibold' : 'text-sm font-medium')}>{title}</span>
      {aside && <span className="shrink-0 text-sm text-muted-foreground">{aside}</span>}
      <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none', isOpen && 'rotate-180')} />
    </button>
  )
  const body = isOpen && <div className={cn(level === 1 ? 'border-t border-border' : '', !flush && (level === 1 ? 'px-5 py-3' : 'px-5 pb-3'))}>{children}</div>
  if (level === 2)
    return (
      <div className={cn('border-t border-border first:border-t-0', className)}>
        {head}
        {body}
      </div>
    )
  return (
    <section className={cn('overflow-hidden rounded-xl border border-border bg-surface', className)}>
      {head}
      {body}
    </section>
  )
}

/** Строка «название — значение», компактная. */
export function KV({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-[150px_minmax(0,1fr)] items-baseline gap-4 border-t border-border py-2 text-sm first:border-t-0', className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

export const isPhotoName = (name: string) => /\.(jpe?g|png|heic)$/i.test(name)
