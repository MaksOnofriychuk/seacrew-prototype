import { useEffect } from 'react'
import { Status } from '@/components/app/status'
import { Footer, Wordmark } from '@/components/app/chrome'
import { plural, stepId, STEPS, useSteps } from './_stepper'
import { ProgressState } from './_core-parts'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'

// c08 — «Продолжить регистрацию» (C: screenStep('c08')): моряк вернувся, не закінчивши.
// Основні розділи зі статусом; «Продолжить» — з першого незробленого кроку (nextOpen у C),
// «Позже» — у профіль (q09). Кнопки «Назад» немає, тому зверху знак Seafolio.
// Відкрили напряму (нічого не пройдено) — аккаунт, особисті дані й документ моряка вже є, далі паспорт.
// Стани панелі: «Загрузка» і «Ошибка» — поки підтягуємо збережений прогрес; «Пусто» тут не буває.
export function C08Resume({ go }: ScreenProps) {
  const { done, stepState, setDone } = useSteps()
  useEffect(() => {
    if (Object.keys(done).length === 0) setDone({ 1: true, 2: true, 3: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const next = STEPS.find((s) => !done[s.n]) ?? STEPS[STEPS.length - 1]
  const extraLeft = STEPS.filter((s) => s.k === 'extra' && !done[s.n]).length

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center px-6">
        <Wordmark />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">С возвращением!</h1>
        <p className="mt-3 text-base text-muted-foreground">Вы остановились на разделе «{next.t}».</p>

        <ProgressState loading={{ className: 'mt-7' }} error={{ className: 'mt-4' }}>
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
          {extraLeft > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              И ещё <span className="font-mono">{extraLeft}</span> {plural(extraLeft, 'дополнительный раздел', 'дополнительных раздела', 'дополнительных разделов')} — по желанию.
            </p>
          )}
        </ProgressState>
      </div>
      <Footer className="border-t border-border bg-surface">
        <Button size="lg" onClick={() => go(stepId(next))}>
          Продолжить
        </Button>
        <Button size="lg" variant="ghost" className="text-primary" onClick={() => go('q09')}>
          Позже
        </Button>
      </Footer>
    </div>
  )
}
