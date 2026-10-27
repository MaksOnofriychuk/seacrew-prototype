import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Звичайний білий блок зі списком або формою (не документ — без шапки primary). Заголовок — над блоком.
export function Group({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-2', className)}>
      {title && <h2 className="text-base font-semibold">{title}</h2>}
      <div className="rounded-xl border border-border bg-surface px-5 py-4">{children}</div>
    </section>
  )
}
