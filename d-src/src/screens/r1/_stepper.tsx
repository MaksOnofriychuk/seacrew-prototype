import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Прогрес кроків реєстрації: «Вы — Компания — Подтверждение». Пройдені кроки клікабельні.
export function RegSteps({ steps, current, onGo }: { steps: string[]; current: number; onGo: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Шаги регистрации">
      {steps.map((s, i) => {
        const done = i < current
        const on = i === current
        return (
          <li key={s} className="flex flex-1 items-center gap-2 last:flex-none">
            <button
              type="button"
              disabled={!done}
              onClick={() => onGo(i)}
              aria-current={on ? 'step' : undefined}
              className={cn('flex items-center gap-2 text-sm', done && 'cursor-pointer', !done && 'cursor-default')}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums',
                  on && 'border-primary bg-primary text-primary-foreground',
                  done && 'border-primary bg-primary/10 text-primary',
                  !on && !done && 'border-border text-muted-foreground',
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn(on ? 'font-medium text-foreground' : 'text-muted-foreground')}>{s}</span>
            </button>
            {i < steps.length - 1 && <span className={cn('h-px flex-1', done ? 'bg-primary' : 'bg-border')} />}
          </li>
        )
      })}
    </ol>
  )
}
