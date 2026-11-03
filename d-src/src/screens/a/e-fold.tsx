import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Раздел страницы деталей, который сворачивается (правка №53): заголовок, краткое значение справа, независимо от соседей. */
export function Fold({ title, summary, defaultOpen = true, flush = false, children, className }: { title: string; summary?: ReactNode; defaultOpen?: boolean; flush?: boolean; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  const hasSummary = summary != null && summary !== false && summary !== ''
  return (
    <section className={cn('overflow-hidden rounded-xl border border-border bg-surface', className)}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-12 w-full items-center gap-3 px-5 text-left hover:bg-muted">
        <h2 className="text-base font-semibold">{title}</h2>
        {hasSummary && <span className="min-w-0 flex-1 truncate text-right text-sm text-muted-foreground">{summary}</span>}
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none', !hasSummary && 'ml-auto', open && 'rotate-180')} />
      </button>
      {open && <div className={cn('border-t border-border', flush ? '' : 'px-5 py-4')}>{children}</div>}
    </section>
  )
}
