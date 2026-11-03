import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Рядок під полем: помилка, підтвердження, підказка, примітка. Висота завжди 20 px (min-h-5),
// щоб поява й зникнення тексту не зсували нічого нижче. Порожній — невидимий, але місце займає.
export function FieldMsg({ error, note, tone, className, id }: { error?: ReactNode; note?: ReactNode; tone?: 'signal' | 'success' | 'muted'; className?: string; id?: string }) {
  const t = tone ?? (error ? 'signal' : 'muted')
  return (
    <p id={id} className={cn('min-h-5 text-sm', t === 'signal' ? 'text-signal' : t === 'success' ? 'text-success' : 'text-muted-foreground', className)}>
      {error || note || null}
    </p>
  )
}
