import { useState } from 'react'
import { EyeOff, Wallet } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { ViewState } from '@/components/app/states'
import { FOUND_WEEKS, JOBS_BY_SALARY, JOBS_BY_SHIP, MY_SALARY } from '@/lib/data-premium'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { SettingsGroup, SettingsRow } from '../m/_parts'
import { money, Section, useBack, useGoFrom, usePr } from './_parts'

// pr-analytics — «Аналитика» (бриф S47; відповідь 136; у боковому меню — «статистика», відповідь 125).
// Головне — скільки разів профіль потрапив у пошук рекрутерів: +1 за кожен показ у результатах, без назв компаній.
// Нижче — відкриті вакансії за моєю посадою: за зарплатою і за типом судна. Порожній стан — профіль ще ніхто не знаходив.

export function PrAnalytics({ go }: ScreenProps) {
  const { setBag } = usePr()
  const back = useBack('pr-analytics', 'p04')
  const goFrom = useGoFrom(go, 'pr-analytics')
  const toJobs = () => {
    setBag('jobs.filter', null)
    go('p05')
  }
  const jobsTotal = JOBS_BY_SALARY.reduce((s, b) => s + b.n, 0)

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Аналитика" onBack={() => go(back)} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-8">
        <ViewState
          loading={{ kind: 'cards', rows: 3 }}
          empty={{
            icon: EyeOff,
            title: 'Рекрутеры вас пока не находили',
            text: 'Заполните профиль и укажите, когда готовы к контракту, — так профиль чаще попадает в поиск.',
          }}
        >
          <FoundBlock />

          <Section
            title={`Вакансии для ${MY_SALARY.rank}`}
            aside={
              <button type="button" onClick={toJobs} className="text-sm font-medium text-primary">
                <span className="font-mono">{jobsTotal}</span> открыто
              </button>
            }
          >
            <div className="rounded-xl border border-border bg-surface px-5 py-4">
              <h3 className="text-sm text-muted-foreground">По зарплате, в месяц</h3>
              <HBars rows={JOBS_BY_SALARY} onPick={toJobs} />
              <p className="mt-3 text-sm text-muted-foreground">
                Выделена вилка с вашей текущей зарплатой — <span className="font-mono text-foreground">{money(MY_SALARY.current)}</span>.
              </p>
            </div>
            <div className="mt-3 rounded-xl border border-border bg-surface px-5 py-4">
              <h3 className="text-sm text-muted-foreground">По типу судна</h3>
              <HBars rows={JOBS_BY_SHIP} onPick={toJobs} />
            </div>
          </Section>

          <SettingsGroup className="mt-8">
            <SettingsRow icon={Wallet} title="Моя зарплата и рейтинг" sub="Где вы среди моряков той же должности" onClick={() => goFrom('pr-salary')} />
          </SettingsGroup>
        </ViewState>
      </div>
    </div>
  )
}

/* ---------- скільки разів знайшли (відповідь 136) ---------- */

function FoundBlock() {
  const last = FOUND_WEEKS.length - 1
  const [sel, setSel] = useState(last)
  const max = Math.max(...FOUND_WEEKS.map((w) => w.n))
  const now = FOUND_WEEKS[last].n
  const diff = now - FOUND_WEEKS[last - 1].n
  const w = FOUND_WEEKS[sel]

  return (
    <section className="rounded-xl border border-border bg-surface px-5 pt-5 pb-4">
      <h1 className="text-base font-semibold">Сколько раз вас нашли рекрутеры</h1>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="font-mono text-[56px] leading-none font-semibold tracking-tight text-primary">{now}</span>
        <span className="flex flex-col text-[15px] text-muted-foreground">
          <span>за эту неделю</span>
          <span>
            <span className="font-mono">{diff > 0 ? `+${diff}` : diff}</span> к прошлой
          </span>
        </span>
      </div>

      <div className="mt-5 flex h-20 items-end gap-[2px]" role="group" aria-label="По неделям">
        {FOUND_WEEKS.map((x, i) => (
          <button key={x.week} type="button" onClick={() => setSel(i)} aria-pressed={sel === i} aria-label={`Неделя с ${x.week}: ${x.n}`} className="flex h-full flex-1 items-end px-[3px]">
            <span
              className={cn('block w-full rounded-t-[4px] transition-colors duration-150', i === sel ? 'bg-primary' : 'bg-primary/20 dark:bg-primary/30')}
              style={{ height: `${Math.max(6, (x.n / max) * 100)}%` }}
            />
          </button>
        ))}
      </div>
      <div className="flex justify-between border-t border-border pt-1.5 font-mono text-xs text-muted-foreground">
        <span>{FOUND_WEEKS[0].week}</span>
        <span>{FOUND_WEEKS[last].week}</span>
      </div>
      <p className="mt-2 text-sm" aria-live="polite">
        Неделя с <span className="font-mono">{w.week}</span>: <span className="font-mono font-medium">{w.n}</span>
      </p>

      <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
        Плюс один — каждый раз, когда ваш профиль попадает в результаты поиска рекрутера. Кто искал, не показываем.
      </p>
    </section>
  )
}

/* ---------- горизонтальні смуги ---------- */

function HBars({ rows, onPick }: { rows: { label: string; n: number; mine?: boolean }[]; onPick: () => void }) {
  const max = Math.max(...rows.map((r) => r.n))
  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <button type="button" onClick={onPick} className="flex w-full flex-col gap-1 text-left">
            <span className="flex items-baseline justify-between gap-3 text-[15px]">
              <span className={cn(r.mine && 'font-medium text-primary')}>
                {r.label.split(/(\$[\d\s–]+)/).map((p, i) => (i % 2 ? <span key={i} className="font-mono">{p}</span> : p))}
              </span>
              <span className="font-mono text-muted-foreground">{r.n}</span>
            </span>
            <span className="block h-2 w-full overflow-hidden rounded-full bg-muted">
              <span className={cn('block h-full rounded-full', r.mine ? 'bg-primary' : 'bg-primary/35 dark:bg-primary/45')} style={{ width: `${(r.n / max) * 100}%` }} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
