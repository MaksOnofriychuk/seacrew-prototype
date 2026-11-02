import { useState } from 'react'
import { Columns2, Plus, X } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { NavBar } from '@/components/app/chrome'
import { MonoNums } from '@/components/app/mono-nums'
import { EmptyState, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { FJ_JOBS, isClosed } from '@/lib/data-feed-jobs'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { salaryPerMonth } from '../p/_jobs-parts'
import { PremiumMark, useBack, usePr } from './_parts'

// pr-compare — «Сравнение вакансий» (премиум; відповідь 96 «возможно, на будущее в премиум»).
// До трьох вакансій стовпцями; назва ряду — над значеннями, щоб на вузькому екрані все влізло.
// Найвища зарплата (у перерахунку на місяць) — жирним кольором primary з підписом. Відповідність вимогам не показуємо (99).

const MAX = 3
const vessel = (k: number, key: string) => FJ_JOBS[k].vessel.find((v) => v[0] === key)?.[1] ?? '—'

const ROWS: { label: string; get: (k: number) => string }[] = [
  { label: 'Тип судна', get: (k) => FJ_JOBS[k].ship },
  { label: 'Контракт', get: (k) => FJ_JOBS[k].dur },
  { label: 'Посадка', get: (k) => FJ_JOBS[k].board },
  { label: 'Флаг', get: (k) => vessel(k, 'Флаг') },
  { label: 'Построено', get: (k) => vessel(k, 'Построено') },
]

export function PrCompare({ go }: ScreenProps) {
  const { bag, setBag, set } = usePr()
  const back = useBack('pr-compare', 'p09')
  const picked = bag<number[]>('pr.compare', [0, 4, 6])
  const [add, setAdd] = useState(false)
  const setPicked = (next: number[]) => setBag('pr.compare', next)

  const perMonth = picked.map((k) => salaryPerMonth(FJ_JOBS[k].sal) ?? 0)
  const best = Math.max(...perMonth)
  const cols = { gridTemplateColumns: `repeat(${picked.length}, minmax(0, 1fr))` }
  const open = (k: number) => {
    set({ job: k })
    setBag('job.back', 'pr-compare')
    go('p08')
  }
  const candidates = FJ_JOBS.map((_, k) => k).filter((k) => !isClosed(k) && !picked.includes(k))

  const empty = (
    <EmptyState
      icon={Columns2}
      title="Выберите хотя бы две вакансии"
      text="Добавьте вакансии из сохранённых — зарплата, судно и сроки встанут рядом."
      action={
        <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => setAdd(true)}>
          <Plus /> Добавить вакансию
        </Button>
      }
    />
  )

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Сравнение вакансий" onBack={() => go(back)} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <ViewState loading={{ kind: 'cards', rows: 2 }} empty={empty}>
          {picked.length < 2 ? (
            empty
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 px-6 pt-1 pb-3">
                <PremiumMark />
                {picked.length < MAX && (
                  <button type="button" onClick={() => setAdd(true)} className="flex h-9 items-center gap-1.5 text-sm font-medium text-primary">
                    <Plus className="size-4" /> Добавить
                  </button>
                )}
              </div>

              <div className="mx-4 overflow-hidden rounded-xl border border-border bg-surface">
                {/* шапка: посада й агентство, прибрати стовпець */}
                <div className="grid divide-x divide-border border-b border-border" style={cols}>
                  {picked.map((k) => (
                    <div key={k} className="relative flex min-w-0 flex-col gap-0.5 px-3 pt-3 pb-3">
                      <button type="button" onClick={() => open(k)} className="flex min-w-0 flex-col gap-0.5 pr-5 text-left">
                        <span className="text-[15px] leading-snug font-semibold">{FJ_JOBS[k].t}</span>
                        <span className="line-clamp-2 text-sm text-muted-foreground">{FJ_JOBS[k].co}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Убрать ${FJ_JOBS[k].t}, ${FJ_JOBS[k].co}`}
                        onClick={() => setPicked(picked.filter((x) => x !== k))}
                        className="absolute top-1.5 right-1 flex size-8 items-center justify-center rounded-md text-muted-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* зарплата — головний ряд */}
                <div className="px-3 pt-3 text-sm text-muted-foreground">Зарплата</div>
                <div className="grid divide-x divide-border pb-4" style={cols}>
                  {picked.map((k, i) => {
                    const top = perMonth[i] === best && best > 0
                    return (
                      <div key={k} className="flex min-w-0 flex-col gap-0.5 px-3 pt-1">
                        <span className={cn('text-[15px] leading-snug font-semibold', top ? 'text-primary' : 'text-foreground')}>
                          <MonoNums text={FJ_JOBS[k].sal} />
                        </span>
                        {perMonth[i] > 0 && /день/.test(FJ_JOBS[k].sal) && (
                          <span className="text-sm text-muted-foreground">
                            ≈ <MonoNums text={`$${perMonth[i].toLocaleString('ru-RU').replace(/ /g, ' ')}`} /> / мес
                          </span>
                        )}
                        {top && <span className="text-sm font-medium text-primary">больше всех</span>}
                      </div>
                    )
                  })}
                </div>

                {ROWS.map((r) => (
                  <div key={r.label} className="border-t border-border">
                    <div className="px-3 pt-3 text-sm text-muted-foreground">{r.label}</div>
                    <div className="grid divide-x divide-border pb-3" style={cols}>
                      {picked.map((k) => (
                        <span key={k} className="min-w-0 px-3 pt-1 text-[15px] break-words">
                          <MonoNums text={r.get(k)} />
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-3 px-6 text-sm text-muted-foreground">Нажмите на должность, чтобы открыть вакансию и откликнуться.</p>
            </>
          )}
        </ViewState>
      </div>

      <BottomSheet open={add} onClose={() => setAdd(false)} title="Добавить вакансию" description={`Можно сравнить до ${MAX} вакансий.`}>
        <ul className="overflow-hidden rounded-xl border border-border bg-surface">
          {candidates.map((k) => {
            const j = FJ_JOBS[k]
            const full = picked.length >= MAX
            return (
              <li key={k} className="border-t border-border first:border-t-0">
                <button
                  type="button"
                  disabled={full}
                  onClick={() => {
                    setPicked([...picked, k])
                    setAdd(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-50"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">{j.t}</span>
                    <span className="text-sm text-muted-foreground">
                      {j.ship}, {j.co}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-primary">
                    <MonoNums text={j.sal} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </BottomSheet>
    </div>
  )
}
