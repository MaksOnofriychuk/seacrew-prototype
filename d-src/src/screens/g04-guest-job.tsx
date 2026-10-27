import { BadgeCheck, Bookmark } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { useGate } from '@/components/app/gate-sheet'
import { Button } from '@/components/ui/button'
import { JOBS } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import { Dateish, JobTags } from './g02-guest-jobs'
import type { ScreenProps } from './registry'

// g04 — вакансія для гостя: без порівняння з профілем і без «Написать».
// Сильний елемент — шапка з посадою і зарплатою; решта — тихі розділи.
export function G04GuestJob({ go }: ScreenProps) {
  const { state } = useProto()
  const { gate, sheet } = useGate(go)
  const k = state.job
  const j = JOBS[k]

  const facts: [string, string][] = [
    ['Тип судна', j.ship],
    ['Посадка', j.board],
    ['Контракт', j.dur],
    ['Агентство', j.co],
  ]

  return (
    <div className="flex h-full flex-col">
      <NavBar title="Вакансия" onBack={() => go('g02')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        {j.tags.length > 0 && (
          <div className="mt-2 flex gap-2">
            <JobTags tags={j.tags} />
          </div>
        )}
        <h1 className="mt-3 text-[32px] leading-tight font-semibold tracking-tight">{j.t}</h1>
        <p className="mt-1 text-[22px] font-semibold text-primary">{j.sal}</p>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-card text-sm font-semibold">{j.lg}</span>
          <span className="flex flex-col">
            <span className="text-[15px] font-semibold">{j.co}</span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <BadgeCheck className="size-4 text-success" />
              <span className="text-success">Агентство проверено</span>
              <span>, {j.ago}</span>
            </span>
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-4 rounded-xl bg-surface px-4">
          {facts.map(([l, v]) => (
            <div key={l} className="flex flex-col gap-0.5 border-b border-border py-3 [&:nth-last-child(-n+2)]:border-b-0">
              <dt className="text-sm text-muted-foreground">{l}</dt>
              <dd className="text-[15px] font-medium">
                <Dateish v={v} />
              </dd>
            </div>
          ))}
        </dl>

        <Section title="Требования">
          <ul>
            {j.req.map(([r]) => (
              <li key={r} className="border-t border-border py-2.5 text-[15px] first:border-t-0">
                {r}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Судно">
          <dl>
            {j.vessel.map(([l, v]) => (
              <div key={l} className="flex justify-between gap-4 border-t border-border py-2.5 first:border-t-0">
                <dt className="text-[15px] text-muted-foreground">{l}</dt>
                <dd className={/^[\d\s]+$/.test(v) ? 'font-mono text-[15px]' : 'text-[15px] font-medium'}>{v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Описание">
          <p className="py-2 text-[15px] leading-relaxed">{j.desc}</p>
        </Section>

        <Section title="Похожие вакансии" flush>
          <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1">
            {JOBS.map((x, i) =>
              i === k ? null : (
                <div
                  key={i}
                  className="flex w-44 shrink-0 flex-col gap-1 rounded-xl bg-surface p-4 text-left"
                >
                  <span className="text-[15px] font-semibold">{x.t}</span>
                  <span className="text-sm text-muted-foreground">{x.ship}</span>
                  <span className="text-sm font-semibold text-primary">{x.sal}</span>
                </div>
              ),
            )}
          </div>
        </Section>
      </div>
      <Footer className="flex-row border-t border-border bg-surface">
        <Button variant="outline" aria-label="Сохранить" className="size-12 shrink-0" onClick={() => gate('save')}>
          <Bookmark className="size-5" />
        </Button>
        <Button size="lg" className="flex-1" onClick={() => gate('apply')}>
          Откликнуться
        </Button>
      </Footer>
      {sheet}
    </div>
  )
}

function Section({ title, children, flush = false }: { title: string; children: React.ReactNode; flush?: boolean }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {flush ? children : <div className="rounded-xl bg-surface px-4 py-1.5">{children}</div>}
    </section>
  )
}
