import { useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { STEPS, useSteps } from '@/components/app/stepper'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from '../registry'
import { ReadinessBlock } from '../q/_parts'
import { STEP_ICON } from './_core-parts'

// sx — «Основное заполнено» (coreDone у C): готовність до анкет і пропозиція заповнити
// додаткові розділи — або завершити. Кільце з відсотком і салют з C прибрано: лише смуга
// готовності. У C є «Назад» (на s6), тому знака Seafolio немає.

export function SxCoreDone({ go }: ScreenProps) {
  const { done, readiness, setDone } = useSteps()

  // C: demoSteps — відкрили екран напряму: кроки 1 і 3 пройдені, 2 пропущено.
  useEffect(() => {
    if (Object.keys(done).length === 0) setDone({ 1: true, 3: true, skip2: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const r = readiness()
  const left = r.items.filter(([, ok]) => !ok).map(([t]) => t)
  const extra = STEPS.filter((s) => s.k === 'extra')

  return (
    <div className="flex h-full flex-col">
      <NavBar onBack={() => go('s6')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-1 pb-6">
        <h1 className="text-[30px] leading-[1.1] font-semibold tracking-tight">Основное заполнено</h1>
        <p className="mt-2 text-base text-muted-foreground">Профиль готов для анкет агентств. Дополнительные разделы — по желанию, но агентства часто о них спрашивают.</p>

        <div className="mt-6">
          <ReadinessBlock pct={r.pct}>{left.length > 0 && <p className="text-sm text-muted-foreground">Осталось: {left.join(', ').toLowerCase()}</p>}</ReadinessBlock>
        </div>

        <h2 className="mt-7 mb-2 px-1 text-sm font-medium text-muted-foreground">Дополнительно, по желанию</h2>
        <ul className="overflow-hidden rounded-xl border border-border bg-surface">
          {extra.map((s) => {
            const Icon = STEP_ICON[s.n]
            return (
              <li key={s.n} className="border-t border-border first:border-t-0">
                <button type="button" onClick={() => go('s' + s.n)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <Icon className="size-5 shrink-0 text-primary" />
                  <span className="flex-1 text-[15px]">{s.t}</span>
                  {done[s.n] ? (
                    <Badge variant="success">готово</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      ≈ <span className="font-mono">1</span> мин
                    </span>
                  )}
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <Footer className="border-t border-border bg-surface">
        <Button size="lg" onClick={() => go('s8')}>
          Заполнить дополнительное
        </Button>
        <Button size="lg" variant="ghost" className="text-primary" onClick={() => go('s7')}>
          Завершить
        </Button>
      </Footer>
    </div>
  )
}
