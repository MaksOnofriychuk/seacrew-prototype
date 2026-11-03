import { useState } from 'react'
import { EyeOff, Users, Wallet } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { moneyText, NumberWheel } from '@/components/app/pickers'
import { NavBar } from '@/components/app/chrome'
import { EmptyState, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { FEW_PEOPLE, MY_SALARY, RATING_MIN, SALARY_BINS, SALARY_STEP, type SalaryInfo } from '@/lib/data-premium'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { Bar, Note } from '../q/_parts'
import { SettingsGroup, SettingsRow } from '../m/_parts'
import { money, useBack, useGoFrom, usePr } from './_parts'

// pr-salary — «Моя зарплата и рейтинг» (бриф S46; відповіді 134–135).
// У рейтинг іде поточна зарплата; бажану бачать лише рекрутери (і ми). Рейтинг — лише від 50 людей у групі
// (посада + тип судна); pr-salary-few — стан «Недостаточно данных». Порожній стан з панелі — зарплату ще не вказано.

export function PrSalary({ go }: ScreenProps) {
  return <SalaryScreen go={go} id="pr-salary" />
}

export function PrSalaryFew({ go }: ScreenProps) {
  return <SalaryScreen go={go} id="pr-salary-few" few />
}

const total = SALARY_BINS.reduce((s, b) => s + b.n, 0)

/** Яка частка групи отримує менше за мене, %. */
function percentile(v: number) {
  let below = 0
  for (const b of SALARY_BINS) {
    if (b.from + SALARY_STEP <= v) below += b.n
    else if (b.from <= v) below += (b.n * (v - b.from)) / SALARY_STEP
  }
  return Math.round((below / total) * 100)
}

function SalaryScreen({ go, id, few }: ScreenProps & { id: string; few?: boolean }) {
  const { bag, setBag, showToast } = usePr()
  const back = useBack(id, 'p04')
  const goFrom = useGoFrom(go, id)
  const s = bag<SalaryInfo>('pr.salary', MY_SALARY)
  const [edit, setEdit] = useState<'current' | 'desired' | null>(null)

  const save = (field: 'current' | 'desired', v: number) => {
    setBag('pr.salary', { ...s, [field]: v })
    setEdit(null)
    showToast('Сохранено')
  }

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Моя зарплата" onBack={() => go(back)} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-8">
        <ViewState
          loading={{ kind: 'cards', rows: 2 }}
          empty={
            <EmptyState
              icon={Wallet}
              title="Укажите текущую зарплату"
              text="Покажем, сколько получают другие моряки на вашей должности и типе судна. Анонимно."
              action={
                <Button className="h-11 text-[15px]" onClick={() => setEdit('current')}>
                  Указать зарплату
                </Button>
              }
            />
          }
        >
          <section className="rounded-xl border border-border bg-surface px-5 pt-5 pb-5">
            <p className="text-sm text-muted-foreground">
              {s.rank}, {s.ship}
            </p>
            {few ? <FewData go={goFrom} /> : <Rating current={s.current} />}
          </section>

          <SettingsGroup title="Моя зарплата" className="mt-8">
            <SettingsRow
              title="Текущая"
              sub="Идёт в рейтинг, анонимно"
              value={<span className="font-mono text-foreground">{money(s.current)}</span>}
              onClick={() => setEdit('current')}
            />
            <SettingsRow
              title="Желаемая"
              sub={
                <span className="flex items-center gap-1.5">
                  <EyeOff className="size-3.5" /> Видят только рекрутеры
                </span>
              }
              value={<span className="font-mono text-foreground">{money(s.desired)}</span>}
              onClick={() => setEdit('desired')}
            />
          </SettingsGroup>
          <p className="mt-2 px-1 text-sm text-muted-foreground">
            В месяц, в долларах. Должность и тип судна — из{' '}
            <button type="button" className="font-medium text-primary" onClick={() => go('p14')}>
              профиля
            </button>
            .
          </p>
        </ViewState>
      </div>

      <EditSheet
        key={edit ?? 'none'}
        open={edit !== null}
        title={edit === 'desired' ? 'Желаемая зарплата' : 'Текущая зарплата'}
        hint={edit === 'desired' ? 'Её увидят только рекрутеры — в рейтинг она не идёт.' : 'Сколько вы получаете на последнем контракте. В рейтинге — без имени.'}
        value={edit === 'desired' ? s.desired : s.current}
        onClose={() => setEdit(null)}
        onSave={(v) => edit && save(edit, v)}
      />
    </div>
  )
}

/* ---------- рейтинг: гістограма зарплат групи ---------- */

function Rating({ current }: { current: number }) {
  const pct = percentile(current)
  const mine = SALARY_BINS.findIndex((b) => current >= b.from && current < b.from + SALARY_STEP)
  const [sel, setSel] = useState(mine)
  const max = Math.max(...SALARY_BINS.map((b) => b.n))
  const b = SALARY_BINS[sel] ?? SALARY_BINS[0]

  return (
    <>
      <h1 className="mt-1 text-[26px] leading-tight font-semibold tracking-tight">
        Вы получаете больше, чем <span className="font-mono">{pct}%</span> моряков
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        По данным <span className="font-mono">{total}</span> человек
      </p>

      <div className="mt-6 flex h-28 items-end gap-[2px]" role="group" aria-label="Распределение зарплат">
        {SALARY_BINS.map((x, i) => (
          <button
            key={x.from}
            type="button"
            onClick={() => setSel(i)}
            aria-label={`${money(x.from)}–${money(x.from + SALARY_STEP)}: ${x.n} чел.${i === mine ? ', вы здесь' : ''}`}
            aria-pressed={sel === i}
            className="group flex h-full flex-1 items-end"
          >
            <span
              className={cn('block w-full rounded-t-[4px] transition-colors duration-150', i === mine ? 'bg-primary' : 'bg-primary/20 dark:bg-primary/30', sel === i && i !== mine && 'bg-primary/45 dark:bg-primary/55')}
              style={{ height: `${Math.max(6, (x.n / max) * 100)}%` }}
            />
          </button>
        ))}
      </div>
      <div className="flex justify-between border-t border-border pt-1.5 font-mono text-xs text-muted-foreground">
        <span>{money(SALARY_BINS[0].from)}</span>
        <span>{money(SALARY_BINS.at(-1)!.from + SALARY_STEP)}</span>
      </div>
      <p className="mt-3 text-[15px]" aria-live="polite">
        <span className="font-mono">
          {money(b.from)}–{money(b.from + SALARY_STEP)}
        </span>
        : <span className="font-mono">{b.n}</span> чел.
        {sel === mine && <span className="font-medium text-primary"> Вы здесь</span>}
      </p>
    </>
  )
}

/* ---------- стан «Недостаточно данных» (відповідь 135) ---------- */

function FewData({ go }: { go: (id: string) => void }) {
  return (
    <>
      <h1 className="mt-1 text-[26px] leading-tight font-semibold tracking-tight">Недостаточно данных</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Рейтинг появится, когда зарплату укажут <span className="font-mono">{RATING_MIN}</span> человек. Сейчас — <span className="font-mono">{FEW_PEOPLE}</span>.
      </p>
      <Bar value={(FEW_PEOPLE / RATING_MIN) * 100} className="mt-4 h-2" />
      <div className="mt-1.5 flex justify-between font-mono text-xs text-muted-foreground">
        <span>{FEW_PEOPLE}</span>
        <span>{RATING_MIN}</span>
      </div>
      <Note icon={Users} className="mt-5 bg-transparent px-0 py-0">
        Позовите коллег той же должности — рейтинг заработает быстрее.{' '}
        <button type="button" onClick={() => go('pr-invite')} className="font-medium text-primary">
          Пригласить
        </button>
      </Note>
    </>
  )
}

/* ---------- вікно «изменить зарплату» ---------- */

function EditSheet({ open, title, hint, value, onClose, onSave }: { open: boolean; title: string; hint: string; value: number; onClose: () => void; onSave: (v: number) => void }) {
  const [n, setN] = useState(value || 4000)
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      description={hint}
      footer={
        <Button size="lg" disabled={!n} onClick={() => onSave(n)}>
          Сохранить
        </Button>
      }
    >
      <NumberWheel label="$ в месяц" value={n} onChange={setN} min={500} max={30000} step={100} format={moneyText} />
    </BottomSheet>
  )
}
