import { AlertTriangle, ChevronRight } from 'lucide-react'
import { StepShell, STEPS, useSteps, type StepKind } from '@/components/app/stepper'
import { Badge } from '@/components/ui/badge'
import type { ScreenProps } from '../registry'
import { Note } from '../q/_parts'
import { ScrollAnchor, STEP_ICON } from './_core-parts'

// s7 — «Проверка». Розділи групами «Основное» / «Дополнительно»; у пропущених — які поля.
// Тап — перехід у розділ. «Готово» активна, коли заповнені «Аккаунт» і «Документ моряка»;
// після неї — профіль (q09).

export function S7Review({ go }: ScreenProps) {
  const { done, stepState, missingList } = useSteps()
  const miss = missingList()
  const reqOk = !!(done[1] && done[3])

  const group = (k: StepKind, title: string) => (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-medium text-muted-foreground">{title}</h2>
      <ul className="overflow-hidden rounded-xl border border-border bg-surface">
        {STEPS.filter((s) => s.k === k).map((s) => {
          const st = stepState(s.n)
          const m = miss.filter((x) => x.n === s.n)
          const Icon = STEP_ICON[s.n]
          return (
            <li key={s.n} className="border-t border-border first:border-t-0">
              <button type="button" onClick={() => go('s' + s.n)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <Icon className="size-5 shrink-0 text-primary" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px]">{s.t}</span>
                  {m.length > 0 && <span className="text-sm text-muted-foreground">{m.map((x) => x.t).join(', ')}</span>}
                </span>
                {st === 'done' ? (
                  <Badge variant="success">готово</Badge>
                ) : s.req ? (
                  <Badge variant="warning">обязательно</Badge>
                ) : st === 'skip' ? (
                  <Badge variant="warning">
                    <span className="font-mono">{m.length}</span> пропущено
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">не заполнено</span>
                )}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )

  return (
    <StepShell step={7} go={go} canNext={reqOk}>
      <ScrollAnchor />
      {group('core', 'Основное')}
      {group('extra', 'Дополнительно')}
      {reqOk ? (
        <p className="px-1 text-sm text-muted-foreground">Пропущенное можно заполнить позже из профиля.</p>
      ) : (
        <Note icon={AlertTriangle} tone="warning">
          Чтобы закончить, заполните «Аккаунт» и «Документ моряка».
        </Note>
      )}
    </StepShell>
  )
}
