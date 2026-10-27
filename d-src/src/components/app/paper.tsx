import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Документ або анкета як справжній папір: смужка-шапка кольору primary з назвою.
export function Paper({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-surface', className)}>
      <div className="bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">{title}</div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}
