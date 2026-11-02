import { useEffect, useRef, useState } from 'react'
import { ScanText, X } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { Button } from '@/components/ui/button'
import type { Scenario } from '@/lib/proto-state'
import type { ScreenProps } from '../registry'
import { Bar, QSheet, useTimers, useQ } from './_parts'

// q04 — завантажувач, поки читаємо CV і документи (правка №13: окремого кроку з кнопкою більше немає).
// Смуга доходить до кінця — і моряк сам потрапляє на «Проверьте данные» (q05). Куди саме — залежить від
// сценарію в панелі (як startReading у C). Правка №12: другий поспіль «не той документ» → e08.
// Відповідь 78: друге поспіль нечитабельне фото → e01 лише з «Ввести вручную».
const TARGET: Partial<Record<Scenario, string>> = { blur: 'e01', notSeafarer: 'e02', offline: 'e03', rate: 'e04', ban: 'e05', docTaken: 'e06' }
// На якому відсотку читання обривається у сценаріях з помилкою.
const STOP_AT: Partial<Record<Scenario, number>> = { blur: 45, notSeafarer: 45, offline: 30, rate: 10, ban: 85, docTaken: 85 }

const TICK = 140

export function Q04Reading({ go }: ScreenProps) {
  const { state, bag, setBag } = useQ()
  const [p, setP] = useState(0)
  const [stop, setStop] = useState(false)
  // Поки відкрите вікно «Остановить чтение?», смуга стоїть.
  const paused = useRef(false)
  paused.current = stop
  const { later, clear } = useTimers()
  const sc = state.scenario

  useEffect(() => {
    // Відкрили екран напряму — файли вважаємо завантаженими (prefillAll у C).
    if (bag('q.cv', { st: 'none' }).st !== 'done') setBag('q.cv', { st: 'done', p: 100 })
    const d = bag('q.doc', { st: 'none', p: 0, pages: 0 })
    if (d.st !== 'done' || !d.pages) setBag('q.doc', { st: 'done', p: 100, pages: d.pages || 1 })
    // Нове читання — нові дані: попередня перевірка і ручне введення більше не діють.
    setBag('q.form', null)
    setBag('q.manual', null)

    const target = sc === 'notSeafarer' && bag<number>('q.wrongDocs', 0) >= 1 ? 'e08' : (TARGET[sc] ?? 'q05')
    const end = STOP_AT[sc] ?? 100

    clear()
    setP(0)
    let cur = 0
    const finish = (): void =>
      later(() => {
        if (paused.current) return finish()
        if (target === 'q05') {
          setBag('q.wrongDocs', null)
          setBag('q.blurTries', null)
        }
        // Відповідь замовника 78: друге поспіль нечитабельне фото — e01 пропонує лише ручне введення.
        if (target === 'e01') setBag('q.blurTries', bag<number>('q.blurTries', 0) + 1)
        go(target)
      }, 350)
    const tick = (): void =>
      later(() => {
        if (paused.current) return tick()
        cur = Math.min(end, cur + 6 + Math.round(Math.random() * 6))
        setP(cur)
        if (cur < end) tick()
        else finish()
      }, TICK)
    tick()
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sc])

  return (
    <div className="relative flex h-full flex-col">
      <NavBar
        right={
          <button type="button" aria-label="Остановить чтение" onClick={() => setStop(true)} className="flex size-11 items-center justify-center rounded-md text-muted-foreground active:scale-95">
            <X className="size-6" />
          </button>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col justify-end px-6 pb-12" aria-busy="true">
        <ScanText className="size-14 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-4 text-[32px] leading-[1.1] font-semibold tracking-tight text-balance">Читаем CV и документы</h1>
        <p className="mt-3 text-base text-muted-foreground">Обычно это 10–20 секунд. Потом останется только проверить данные.</p>
        <Bar value={p} className="mt-8" />
        <span className="mt-2 text-right font-mono text-sm text-muted-foreground tabular-nums">{p}%</span>
      </div>

      <QSheet open={stop} onClose={() => setStop(false)} title="Остановить чтение?" description="Файлы останутся — вы сможете заменить документ или начать заново.">
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            variant="outline"
            className="border-signal text-signal hover:text-signal"
            onClick={() => {
              clear()
              go('q03')
            }}
          >
            Остановить
          </Button>
          <Button size="lg" variant="ghost" className="text-primary" onClick={() => setStop(false)}>
            Продолжить ждать
          </Button>
        </div>
      </QSheet>
    </div>
  )
}
