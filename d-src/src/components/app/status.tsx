import type { ReactNode } from 'react'
import { AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Статус у списку — без пігулки: значок і сірий текст.
// ok — зелена галочка; warn — жовтий знак уваги; current — текст кольору primary; muted — лише текст.
export function Status({ kind = 'muted', children, className }: { kind?: 'ok' | 'warn' | 'current' | 'muted'; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 text-sm whitespace-nowrap', kind === 'current' ? 'font-medium text-primary' : 'text-muted-foreground', className)}>
      {kind === 'ok' && <Check className="size-4 text-success" strokeWidth={2.25} />}
      {kind === 'warn' && <AlertCircle className="size-4 text-warning" />}
      {children}
    </span>
  )
}
