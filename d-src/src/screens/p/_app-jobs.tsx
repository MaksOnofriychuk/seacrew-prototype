import { useRef, useState, type ReactNode } from 'react'
import { ArrowUpDown, BadgeCheck, BellRing, Check, Lock, MessageSquare, Plus, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { EmptyState, ViewState } from '@/components/app/states'
import { TabBar } from '@/components/app/tab-bar'
import { Button } from '@/components/ui/button'
import {
  FILTER_DEFAULT,
  FILTER_EMPTY,
  FJ_JOBS,
  isClosed,
  SEARCH_LIMIT,
  SEARCH_LIMIT_PREMIUM,
  SEARCHES_DEFAULT,
  type JobFilter,
  type SavedSearch,
  type SortId,
} from '@/lib/data-feed-jobs'
import { cn } from '@/lib/utils'
import { Dateish, JobTags } from '../g02-guest-jobs'
import { AppSheet, plural, SaveButton, TabHead, useApp, useSavedJobs } from './_app-parts'
import { filterChips, FiltersSheet, JobCard, jobList, sameFilter, SortSheet, sortLabel } from './_jobs-parts'

type Go = (id: string) => void

// Ключі bag: jobs.filter (JobFilter), jobs.sort, jobs.searches (збережені підборки, p17), saved.jobs (індекси FJ_JOBS),
// job.applied (індекси вакансій з відгуком — для чату з рекрутером), job.back (куди «Назад» з вакансії).

/* ================= p05 / p13 — список вакансій і фільтри ================= */

export function useSearches() {
  const { bag, setBag } = useApp()
  const searches = bag<SavedSearch[]>('jobs.searches', SEARCHES_DEFAULT)
  return { searches, setSearches: (next: SavedSearch[]) => setBag('jobs.searches', next) }
}

export function JobsScreen({ go, filtersOpen = false }: { go: Go; filtersOpen?: boolean }) {
  const { bag, setBag, set, showToast } = useApp()
  const { isSaved, toggle } = useSavedJobs()
  const { searches, setSearches } = useSearches()
  const f = bag<JobFilter>('jobs.filter', FILTER_DEFAULT)
  const sort = bag<SortId>('jobs.sort', 'new')
  const [q, setQ] = useState('')
  const [sheet, setSheet] = useState(filtersOpen)
  const [sortOpen, setSortOpen] = useState(false)
  const [limit, setLimit] = useState(false)

  const list = jobList(f, sort, q)
  const chips = filterChips(f)
  const setF = (next: JobFilter) => setBag('jobs.filter', next)
  const savedHere = searches.some((s) => sameFilter(s.f, f))
  const fresh = searches.reduce((n, s) => n + s.fresh, 0)

  const closeSheet = () => {
    setSheet(false)
    if (filtersOpen) go('p05')
  }
  const saveSearch = () => {
    if (savedHere) return go('p17')
    if (searches.length >= SEARCH_LIMIT) return setLimit(true)
    setSearches([...searches, { id: 'ss' + Date.now(), f, notify: 'update', fresh: 0 }])
    showToast('Подборка сохранена. Сообщим о новых вакансиях')
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <TabHead
          title="Вакансии"
          onMenu={() => go('p04')}
          go={go}
          action={
            <button type="button" onClick={() => go('p17')} className="relative flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-sm font-medium">
              <BellRing className="size-4 text-primary" />
              Подборки
              {fresh > 0 && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-primary" aria-label="Есть новые вакансии" />}
            </button>
          }
        />
        <div className="flex flex-col gap-3 px-6 pt-4">
          <div className="flex gap-2">
            <label className="flex h-12 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-muted-foreground focus-within:border-primary">
              <Search className="size-5" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="Должность, судно, компания"
                aria-label="Поиск вакансий"
              />
            </label>
            <button
              type="button"
              aria-label={chips.length ? `Фильтры, выбрано: ${chips.length}` : 'Фильтры'}
              onClick={() => setSheet(true)}
              className="relative flex size-12 items-center justify-center rounded-md border border-border bg-surface text-foreground"
            >
              <SlidersHorizontal className="size-5" />
              {chips.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary font-mono text-[11px] font-medium text-primary-foreground">{chips.length}</span>
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <span key={c.key} className="flex h-9 items-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                <button type="button" onClick={() => setSheet(true)} className="h-full pl-4">
                  {c.label}
                </button>
                <button type="button" aria-label={`Убрать фильтр ${c.label}`} onClick={() => setF(c.off())} className="flex h-full items-center pr-3 pl-1.5">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={saveSearch}
              className={cn('flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium', savedHere ? 'border-transparent text-muted-foreground' : 'border-border bg-surface text-primary')}
            >
              {savedHere ? <Check className="size-4 text-success" strokeWidth={2.5} /> : <Plus className="size-4" />}
              {savedHere ? 'Поиск сохранён' : 'Сохранить поиск'}
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              <span className="font-mono">{list.length}</span> {plural(list.length, 'вакансия', 'вакансии', 'вакансий')}
            </span>
            <button type="button" onClick={() => setSortOpen(true)} className="-mr-1 flex h-9 items-center gap-1.5 px-1 font-medium text-foreground">
              <ArrowUpDown className="size-4 text-muted-foreground" />
              {sortLabel(sort)}
            </button>
          </div>
        </div>
        <ViewState
          loading={{ kind: 'list', rows: 4 }}
          empty={{ icon: SearchX, title: 'Пока нет вакансий', text: 'Новые вакансии появляются каждый день. Сохраните поиск — пришлём уведомление.' }}
        >
          {list.length ? (
            <ul className="mx-4 mt-2 mb-4 overflow-hidden rounded-xl border border-border bg-surface">
              {list.map((k) => (
                <JobCard
                  key={k}
                  k={k}
                  saved={isSaved(k)}
                  onSave={() => toggle(k)}
                  onOpen={() => {
                    set({ job: k })
                    setBag('job.back', 'p05')
                    go('p08')
                  }}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={SearchX}
              title="Ничего не нашли"
              text={q ? 'Проверьте написание или ищите по должности, типу судна, агентству.' : 'Уберите часть фильтров — вакансии найдутся.'}
              action={
                <Button
                  variant="outline"
                  className="h-11 text-[15px] text-primary"
                  onClick={() => {
                    setQ('')
                    if (!q) setF(FILTER_EMPTY)
                  }}
                >
                  {q ? 'Очистить поиск' : 'Сбросить фильтры'}
                </Button>
              }
            />
          )}
        </ViewState>
      </div>
      <TabBar active="vac" go={go} />
      <FiltersSheet open={sheet} f={f} onChange={setF} onClose={closeSheet} />
      <SortSheet open={sortOpen} value={sort} onChange={(s) => setBag('jobs.sort', s)} onClose={() => setSortOpen(false)} />
      <AppSheet
        open={limit}
        onClose={() => setLimit(false)}
        title={`Уже ${SEARCH_LIMIT} подборки`}
        description={`Бесплатно можно хранить ${SEARCH_LIMIT} подборки. Удалите одну, чтобы сохранить эту. С премиумом — до ${SEARCH_LIMIT_PREMIUM}.`}
        footer={
          <>
            <Button size="lg" onClick={() => go('p17')}>
              Открыть подборки
            </Button>
            <Button size="lg" variant="ghost" className="text-primary" onClick={() => setLimit(false)}>
              Понятно
            </Button>
          </>
        }
      >
        <span />
      </AppSheet>
    </div>
  )
}

/* ================= p08 / p12 — вакансія і відгук ================= */

export function JobScreen({ go, applyOpen = false }: { go: Go; applyOpen?: boolean }) {
  const { state, set, bag, setBag, showToast } = useApp()
  const { isSaved, toggle } = useSavedJobs()
  const [sheet, setSheet] = useState(applyOpen)
  const scroller = useRef<HTMLDivElement>(null)
  const k = FJ_JOBS[state.job] ? state.job : 0
  const j = FJ_JOBS[k]
  const closed = isClosed(k)
  const back = bag<string>('job.back', 'p05')
  const applied = bag<number[]>('job.applied', [])
  const isApplied = applied.includes(k)

  const facts: [string, string][] = [
    ['Тип судна', j.ship],
    ['Посадка', j.board],
    ['Контракт', j.dur],
    ['Агентство', j.co],
  ]

  const closeSheet = () => {
    setSheet(false)
    if (applyOpen) go('p08')
  }
  // Відповідь 97 і правка №22: одне торкання + підтвердження → чат з рекрутером із заглушкою «Вы откликнулись на вакансию».
  const send = () => {
    setBag('job.applied', [...applied, k])
    setSheet(false)
    showToast('Отклик отправлен')
    go('m-chat')
  }
  const openJob = (i: number) => {
    set({ job: i })
    scroller.current?.scrollTo({ top: 0 })
  }

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Вакансия" onBack={() => go(back)} />
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        {closed ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Lock className="size-4" /> Вакансия закрыта
          </p>
        ) : (
          (j.tags.length > 0 || isApplied) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <JobTags tags={j.tags} />
              {isApplied && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Check className="size-4 text-success" strokeWidth={2.5} />
                  Вы откликнулись
                </span>
              )}
            </div>
          )
        )}
        <h1 className={cn('mt-3 text-[32px] leading-tight font-semibold tracking-tight', closed && 'text-muted-foreground')}>{j.t}</h1>
        <p className={cn('mt-1 text-[22px] font-semibold', closed ? 'text-muted-foreground' : 'text-primary')}>{j.sal}</p>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-card font-mono text-sm font-medium text-primary">{j.lg}</span>
          <span className="flex flex-col">
            <span className="text-[15px] font-semibold">{j.co}</span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <BadgeCheck className="size-4 text-success" />
              Агентство проверено, {j.ago}
            </span>
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-4 rounded-xl border border-border bg-surface px-4">
          {facts.map(([l, v]) => (
            <div key={l} className="flex flex-col gap-0.5 border-b border-border py-3 [&:nth-last-child(-n+2)]:border-b-0">
              <dt className="text-sm text-muted-foreground">{l}</dt>
              <dd className="text-[15px] font-medium">
                <Dateish v={v} />
              </dd>
            </div>
          ))}
        </dl>

        {/* відповідь 99: відповідність вимогам моряку не показуємо — лише список */}
        <Section title="Требования">
          <ul>
            {j.req.map(([r]) => (
              <li key={r} className="flex items-start gap-3 border-t border-border py-2.5 first:border-t-0">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="flex-1 text-[15px]">{r}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Судно">
          <dl>
            {j.vessel.map(([l, v]) => (
              <div key={l} className="flex justify-between gap-4 border-t border-border py-2.5 first:border-t-0">
                <dt className="text-[15px] text-muted-foreground">{l}</dt>
                <dd className={/^[\d\s]+$/.test(v) ? 'font-mono text-[15px]' : 'text-right text-[15px] font-medium'}>{v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Описание">
          <p className="py-2 text-[15px] leading-relaxed">{j.desc}</p>
        </Section>

        <Section title="Похожие вакансии" flush>
          <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1">
            {FJ_JOBS.map((x, i) =>
              i === k || isClosed(i) ? null : (
                <button key={i} type="button" onClick={() => openJob(i)} className="flex w-44 shrink-0 flex-col gap-1 rounded-xl border border-border bg-surface p-4 text-left">
                  <span className="text-[15px] font-semibold">{x.t}</span>
                  <span className="text-sm text-muted-foreground">{x.ship}</span>
                  <span className="text-sm font-semibold text-primary">{x.sal}</span>
                </button>
              ),
            )}
          </div>
        </Section>
      </div>
      <Footer className="flex-row border-t border-border bg-surface">
        <SaveButton on={isSaved(k)} onClick={() => toggle(k)} className="size-12 border border-border" />
        {closed ? (
          <Button size="lg" variant="outline" className="flex-1 text-muted-foreground" disabled>
            Отклик закрыт
          </Button>
        ) : isApplied ? (
          <Button size="lg" variant="outline" className="flex-1 text-primary" onClick={() => go('m-chat')}>
            <MessageSquare className="size-5" />
            Открыть чат с рекрутером
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={() => setSheet(true)}>
            Откликнуться
          </Button>
        )}
      </Footer>
      <ApplySheet open={sheet} k={k} onClose={closeSheet} onSend={send} />
    </div>
  )
}

function Section({ title, aside, children, flush = false }: { title: string; aside?: ReactNode; children: ReactNode; flush?: boolean }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {aside}
      </div>
      {flush ? children : <div className="rounded-xl border border-border bg-surface px-4 py-1.5">{children}</div>}
    </section>
  )
}

// Відгук (відповідь 97): одне торкання + підтвердження від випадкового натиску. Без анкети й супровідного листа.
function ApplySheet({ open, k, onClose, onSend }: { open: boolean; k: number; onClose: () => void; onSend: () => void }) {
  const j = FJ_JOBS[k]
  return (
    <AppSheet
      open={open}
      onClose={onClose}
      title="Откликнуться?"
      description={`${j.co} увидит ваш профиль и документы. Ответ рекрутера придёт в «Сообщения».`}
      footer={
        <>
          <Button size="lg" onClick={onSend}>
            Откликнуться
          </Button>
          <Button size="lg" variant="ghost" className="text-primary" onClick={onClose}>
            Отмена
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1 rounded-xl bg-muted px-4 py-3.5">
        <span className="text-[17px] font-semibold">{j.t}</span>
        <span className="text-[15px] font-semibold text-primary">{j.sal}</span>
        <span className="text-sm text-muted-foreground">
          {j.ship}, посадка <Dateish v={j.board} />
        </span>
      </div>
    </AppSheet>
  )
}
