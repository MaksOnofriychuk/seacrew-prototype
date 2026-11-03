import { useEffect } from 'react'
import { Status } from '@/components/app/status'
import { ChevronRight } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { PASS, stepId, STEPS, useSteps } from './_stepper'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from '../registry'
import { ReadinessBlock } from '../q/_parts'
import { ProgressState, STEP_ICON, useS } from './_core-parts'
import { DEMO_PASS } from './s3p'

// sx — «Вы почти у цели» (правка №27; coreDone у C): «Профиль заполнен на N %» і пропозиція
// заповнити додаткові розділи — або завершити. У списку «Дополнительно» — новий рядок
// «Характеристики, промоушены (Promotions / appraisals)». У C є «Назад» (на s6), тому знака Seafolio немає.

export function SxCoreDone({ go }: ScreenProps) {
  const { done, readiness, setDone } = useSteps()
  const { bag, setBag } = useS()

  // Відкрили екран напряму: основне пройдено, медичні пропущено — профіль заповнений на 83 %.
  useEffect(() => {
    if (Object.keys(done).length > 0) return
    setDone({ 1: true, 2: true, 3: true, [PASS]: true, 4: true, 6: true, skip5: true })
    if (!bag('s3p.pass', null)) setBag('s3p.pass', DEMO_PASS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const r = readiness()
  const left = r.items.filter(([, ok]) => !ok).map(([t]) => t)
  const extra = STEPS.filter((s) => s.k === 'extra')

  return (
    <div className="flex h-full flex-col">
      <NavBar onBack={() => go('s6')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-1 pb-6">
        <h1 className="text-[30px] leading-[1.1] font-semibold tracking-tight">Вы почти у цели</h1>
        <p className="mt-2 text-base text-muted-foreground">При достижении 100% у вас появятся больше шансов получить match с HR агентом.</p>

        <ProgressState loading={{ kind: 'cards', rows: 2, className: 'mt-6' }} error={{ className: 'mt-4' }}>
          <div className="mt-6">
            <ReadinessBlock pct={r.pct}>{left.length > 0 && <p className="text-sm text-muted-foreground">Осталось: {left.join(', ').toLowerCase()}</p>}</ReadinessBlock>
          </div>

          <h2 className="mt-7 mb-2 px-1 text-sm font-medium text-muted-foreground">Дополнительно, по желанию</h2>
          <ul className="overflow-hidden rounded-xl border border-border bg-surface">
            {extra.map((s) => {
              const Icon = STEP_ICON[s.n]
              return (
                <li key={s.n} className="border-t border-border first:border-t-0">
                  <button type="button" onClick={() => go(stepId(s))} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <Icon className="size-5 shrink-0 text-primary" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[15px]">{s.long ?? s.t}</span>
                      {s.sub && <span className="text-sm text-muted-foreground">{s.sub}</span>}
                    </span>
                    {done[s.n] ? (
                      <Status kind="ok">готово</Status>
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
        </ProgressState>
      </div>
      <Footer className="border-t border-border bg-background">
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
