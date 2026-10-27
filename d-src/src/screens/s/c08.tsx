import { Status } from '@/components/app/status'
import { Footer, Wordmark } from '@/components/app/chrome'
import { STEPS, useSteps } from '@/components/app/stepper'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'

// c08 — «Продолжить регистрацию» (C: screenStep('c08')): моряк вернувся, не закінчивши.
// Основні розділи зі статусом; «Продолжить» — з першого незробленого кроку (nextOpen у C),
// «Позже» — у профіль (q09). Кнопки «Назад» немає, тому зверху знак Seafolio.
export function C08Resume({ go }: ScreenProps) {
  const { done, stepState } = useSteps()
  const next = STEPS.find((s) => !done[s.n]) ?? STEPS[STEPS.length - 1]
  const extraCount = STEPS.filter((s) => s.k === 'extra').length

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center px-6">
        <Wordmark />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">С возвращением!</h1>
        <p className="mt-3 text-base text-muted-foreground">Вы остановились на разделе «{next.t}».</p>

        <ul className="mt-7 overflow-hidden rounded-xl border border-border bg-surface">
          {STEPS.filter((s) => s.k !== 'extra').map((s) => {
            const st = stepState(s.n)
            const cur = s.n === next.n
            return (
              <li key={s.n} className="flex min-h-13 items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
                <span className={cn('flex-1 text-[15px]', cur && 'font-semibold')}>{s.t}</span>
                {st === 'done' ? (
                  <Status kind="ok">готово</Status>
                ) : st === 'skip' ? (
                  <Status kind="warn">пропущено</Status>
                ) : cur ? (
                  <Status kind="current">дальше</Status>
                ) : s.req ? (
                  <Status>обязательно</Status>
                ) : null}
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          И ещё <span className="font-mono">{extraCount}</span> дополнительных разделов — по желанию.
        </p>
      </div>
      <Footer>
        <Button size="lg" onClick={() => go('s' + next.n)}>
          Продолжить
        </Button>
        <Button size="lg" variant="ghost" className="text-primary" onClick={() => go('q09')}>
          Позже
        </Button>
      </Footer>
    </div>
  )
}
