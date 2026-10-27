import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Поле форми: підпис, мітка джерела («из документа», «из CV»), поле, підказка або помилка.
export function FormField({
  id,
  label,
  source,
  note,
  error,
  children,
  className,
}: {
  id?: string
  label: string
  source?: string
  note?: ReactNode
  error?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {source && <Badge variant="outline" className="font-normal text-muted-foreground">{source}</Badge>}
      </div>
      {children}
      {error ? <p className="text-sm text-signal">{error}</p> : note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
    </div>
  )
}

// Прогрес потоку зверху (як у Wise): сегменти кольору primary / border.
export function StepProgress({ step, total, label }: { step: number; total: number; label?: string }) {
  return (
    <div className="flex flex-col gap-2 px-6">
      <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label={label ?? 'Шаг'}>
        {Array.from({ length: total }, (_, n) => (
          <span key={n} className={cn('h-1 flex-1 rounded-full', n < step ? 'bg-primary' : 'bg-border')} />
        ))}
      </div>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  )
}
