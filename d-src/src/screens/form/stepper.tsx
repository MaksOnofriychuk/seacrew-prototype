import { useState, type ReactNode } from 'react'
import { ChevronRight, MapIcon } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { Status } from '@/components/app/status'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

// Степер анкети — той самий вигляд, що й у покроковій реєстрації (components/app/stepper.tsx,
// screens/s/_stepper.tsx): «Назад», назва, «Позже»; «Разделы, N из M» з картою розділів; рядок прогресу
// з рисок; великий заголовок і пояснення; вміст; низ з головною дією. Спільний StepShell прив'язаний
// до кроків реєстрації (STEPS, useSteps), тому тут — та сама розмітка з кроками-розділами бланка
// (seafarer-registration-v2: «степер спільний для реєстрації й форми рекрутера»).

export type FStepState = 'done' | 'skip' | 'todo'
export type FStep = { key: string; t: string; state: FStepState; /** скільки полів треба виправити */ issues: number }

type Props = {
  /** назва в рядку навігації */
  nav: string
  steps: FStep[]
  /** індекс розділу; steps.length — «Проверка» */
  cur: number
  title: string
  sub: ReactNode
  /** «Анкета 64 %» праворуч */
  pct: number
  onBack: () => void
  onJump: (i: number) => void
  onLater: () => void
  children: ReactNode
  footer: ReactNode
}

export function FormStepShell({ nav, steps, cur, title, sub, pct, onBack, onJump, onLater, children, footer }: Props) {
  const [sheet, setSheet] = useState<'route' | 'later' | null>(null)
  const final = cur >= steps.length
  return (
    <div className="flex h-full flex-col">
      <NavBar
        title={nav}
        onBack={onBack}
        right={
          <button type="button" onClick={() => setSheet('later')} className="px-2 text-[15px] font-semibold text-primary">
            Позже
          </button>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-6 pt-1">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setSheet('route')} className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <MapIcon className="size-4" />
              <span>
                {final ? 'Финиш' : 'Разделы'}
                {!final && (
                  <span className="text-muted-foreground">
                    , <span className="font-mono">{cur + 1}</span> из <span className="font-mono">{steps.length}</span>
                  </span>
                )}
              </span>
              <ChevronRight className="size-4" />
            </button>
            <span className="text-sm text-muted-foreground">
              Анкета <span className="font-mono font-medium text-foreground">{pct} %</span>
            </span>
          </div>
          {!final && (
            <div className="mt-3 flex gap-1.5" role="progressbar" aria-label="Разделы анкеты" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={cur + 1}>
              {steps.map((s, i) => {
                const st = i === cur ? 'cur' : s.state
                return <span key={s.key} className={cn('h-1 flex-1 rounded-full', st === 'done' || st === 'cur' ? 'bg-primary' : st === 'skip' ? 'bg-muted-foreground/40' : 'bg-border')} />
              })}
            </div>
          )}
          <h1 className="mt-5 text-[30px] leading-[1.1] font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-base text-muted-foreground">{sub}</p>
        </div>
        <div className="flex flex-col gap-5 px-6 pt-5 pb-6">{children}</div>
      </div>

      {footer}

      <Sheet open={sheet !== null} onOpenChange={(o) => !o && setSheet(null)}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[85%] gap-0 overflow-y-auto px-6 pt-6 pb-8">
          {sheet === 'route' && (
            <>
              <SheetTitle className="text-2xl font-semibold tracking-tight">Разделы анкеты</SheetTitle>
              <SheetDescription className="mt-2 text-base">Переходите в любой раздел — ответы сохраняются в черновике.</SheetDescription>
              {[
                ['Как в бланке агентства', steps.map((s, i) => ({ ...s, i }))],
                ['Финиш', [{ key: 'review', t: 'Проверка', state: 'todo' as FStepState, issues: 0, i: steps.length }]],
              ].map(([label, list]) => (
                <section key={label as string} className="mt-5">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">{label as string}</h3>
                  <ul className="overflow-hidden rounded-xl border border-border">
                    {(list as (FStep & { i: number })[]).map((s) => (
                      <li key={s.key} className="border-t border-border first:border-t-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSheet(null)
                            onJump(s.i)
                          }}
                          className={cn('flex w-full items-center gap-3 px-4 py-3 text-left text-[15px]', s.i === cur && 'font-semibold')}
                        >
                          <span className="flex-1">{s.t}</span>
                          {s.i === cur ? (
                            <Status kind="current">сейчас</Status>
                          ) : s.state === 'done' && !s.issues ? (
                            <Status kind="ok">готово</Status>
                          ) : s.state !== 'todo' && s.issues ? (
                            <Status kind="warn">
                              <span className="font-mono">{s.issues}</span> не заполнено
                            </Status>
                          ) : s.state === 'skip' ? (
                            <Status kind="warn">пропущено</Status>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </>
          )}
          {sheet === 'later' && (
            <>
              <SheetTitle className="text-2xl font-semibold tracking-tight">Продолжить позже?</SheetTitle>
              <SheetDescription className="mt-2 text-base">
                Ответы сохранены в черновике. Продолжить можно с этого раздела в любой момент и с любого устройства.
              </SheetDescription>
              <div className="mt-6 flex flex-col gap-3">
                <Button size="lg" onClick={onLater}>
                  Выйти и продолжить позже
                </Button>
                <Button size="lg" variant="outline" onClick={() => setSheet(null)}>
                  Остаться
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
