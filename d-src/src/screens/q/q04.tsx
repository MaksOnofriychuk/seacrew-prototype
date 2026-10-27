import { useEffect, useState } from 'react'
import { Check, Circle, LoaderCircle, UserRound, X } from 'lucide-react'
import { Paper } from '@/components/app/paper'
import { Button } from '@/components/ui/button'
import type { Scenario } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { DOC_TYPES, FlowScreen, Footer, QSheet, Title, useTimers, type DocTypeId, useQ } from './_parts'

// q04 — ИИ читає CV і документи. Етапи йдуть самі; результат залежить від сценарію в панелі (як startReading у C).
// У прототипі далі — по кнопці.
const STEPS = ['Файлы загружены и зашифрованы', 'Читаем CV и документы целиком', 'Собираем данные: личные, документы, диплом, стаж', 'Проверяем безопасность']

const STOP_AT: Partial<Record<Scenario, number>> = { blur: 1, notSeafarer: 1, offline: 1, rate: 0, ban: 3, docTaken: 3 }
const TARGET: Partial<Record<Scenario, string>> = { blur: 'e01', notSeafarer: 'e02', offline: 'e03', rate: 'e04', ban: 'e05', docTaken: 'e06' }

export function Q04Reading({ go }: ScreenProps) {
  const { state, bag, setBag } = useQ()
  const type = state.docType as DocTypeId
  const [phase, setPhase] = useState(1)
  const [done, setDone] = useState(false)
  const [stop, setStop] = useState(false)
  const { later, clear } = useTimers()
  const sc = state.scenario
  const target = TARGET[sc] ?? 'q05'

  useEffect(() => {
    // Відкрили екран напряму — файли вважаємо завантаженими (prefillAll у C).
    if (bag('q.cv', { st: 'none' }).st !== 'done') setBag('q.cv', { st: 'done', p: 100 })
    const d = bag('q.doc', { st: 'none', p: 0, pages: 0 })
    if (d.st !== 'done' || !d.pages) setBag('q.doc', { st: 'done', p: 100, pages: d.pages || 1 })
    // Нове читання — нові дані: попередня перевірка і ручне введення більше не діють.
    setBag('q.form', null)
    setBag('q.manual', null)

    clear()
    setPhase(1)
    setDone(false)
    const stopAt = STOP_AT[sc]
    const step = (ph: number) =>
      later(() => {
        setPhase(ph)
        if ((stopAt !== undefined && ph > stopAt) || ph === 4) {
          setDone(true)
          return
        }
        step(ph + 1)
      }, 1200)
    step(2)
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sc])

  // Значення з'являються, коли ИИ їх прочитав; у сценаріях з помилкою — ні.
  const ok = !TARGET[sc]
  const nameShown = ok && sc !== 'noName' && phase >= 2
  const numShown = ok && phase >= 3

  return (
    <FlowScreen
      step={3}
      right={
        <button type="button" aria-label="Закрыть" onClick={() => setStop(true)} className="flex size-11 items-center justify-center rounded-md text-primary">
          <X className="size-6" />
        </button>
      }
      footer={
        <Footer>
          <Button size="lg" disabled={!done} aria-busy={!done} onClick={() => go(target)}>
            {done ? (
              target === 'q05' ? 'Продолжить' : 'Дальше'
            ) : (
              <>
                <LoaderCircle className="size-5 animate-spin" /> Читаем…
              </>
            )}
          </Button>
        </Footer>
      }
      overlay={
        <QSheet open={stop} onClose={() => setStop(false)} title="Остановить чтение?" description="Файлы останутся — вы сможете заменить документ или начать заново.">
          <div className="flex flex-col gap-3">
            <Button size="lg" variant="outline" className="border-signal text-signal hover:text-signal" onClick={() => go('q03')}>
              Остановить
            </Button>
            <Button size="lg" variant="ghost" className="text-primary" onClick={() => setStop(false)}>
              Продолжить ждать
            </Button>
          </div>
        </QSheet>
      }
    >
      <Paper title={DOC_TYPES[type].n}>
        <div className="flex gap-4">
          <div className="flex h-[76px] w-[60px] shrink-0 items-center justify-center rounded-md bg-muted">
            <UserRound className="size-10 text-muted-foreground" strokeWidth={1.25} />
          </div>
          <div className={cn('-m-1.5 flex flex-1 flex-col gap-2.5 rounded-md border p-1.5', phase === 1 && !done ? 'border-primary' : 'border-transparent')}>
            <Val label="Фамилия" value="Koval" shown={nameShown} />
            <Val label="Имя" value="Andrii" shown={nameShown} />
          </div>
        </div>
        <div className={cn('-mx-1.5 mt-3 grid grid-cols-2 gap-4 rounded-md border p-1.5', phase === 2 && !done ? 'border-primary' : 'border-transparent')}>
          <Val label="Номер" value="AB 123456" shown={numShown} mono />
          <Val label="Дата рождения" value="14.03.1991" shown={numShown} mono />
        </div>
      </Paper>

      <div className="mt-6">
        <Title sub="Обычно это занимает 10–20 секунд">Читаем CV и документы</Title>
      </div>

      <ol className="mt-4 flex flex-col">
        {STEPS.map((t, i) => {
          const st = phase > i ? 'done' : phase === i ? 'run' : 'wait'
          return (
            <li key={t} className={cn('flex items-start gap-3 py-1.5 text-[15px]', st === 'wait' ? 'text-muted-foreground' : 'text-foreground')}>
              {st === 'done' ? (
                <Check className="mt-0.5 size-5 shrink-0 text-success" />
              ) : st === 'run' && !done ? (
                <LoaderCircle className="mt-0.5 size-5 shrink-0 animate-spin text-primary" />
              ) : (
                <Circle className="mt-0.5 size-5 shrink-0 text-border" />
              )}
              <span>{t}</span>
            </li>
          )
        })}
      </ol>

      <p className="mt-4 text-sm text-muted-foreground">Вводить заново ничего не придётся — вы только проверите результат.</p>
    </FlowScreen>
  )
}

function Val({ label, value, shown, mono }: { label: string; value: string; shown: boolean; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {shown ? <span className={mono ? 'font-mono text-[15px]' : 'text-[15px] font-medium'}>{value}</span> : <span className="my-1.5 h-2.5 w-20 rounded-full bg-muted" />}
    </div>
  )
}
