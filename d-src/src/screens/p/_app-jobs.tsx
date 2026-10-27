import { useRef, useState, type ReactNode } from 'react'
import { ArrowUpDown, BadgeCheck, Check, FileText, Search, SearchX, SlidersHorizontal, TriangleAlert, X } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { Paper } from '@/components/app/paper'
import { TabBar } from '@/components/app/tab-bar'
import { Button } from '@/components/ui/button'
import { JOBS } from '@/lib/data'
import { cn } from '@/lib/utils'
import { Dateish, JobTags } from '../g02-guest-jobs'
import { FORM_DEFAULTS, Note, durText, readiness, type QForm } from '../q/_parts'
import { VOYAGES, vMonths, type Voyage } from '../s/_core-voyage'
import { AppSheet, Empty, JobRow, matchOf, MonoNums, plural, SaveButton, TAB_TO, TabHead, useApp, useSavedJobs } from './_app-parts'

type Go = (id: string) => void

/* ================= p05 / p13 — список вакансій і фільтри ================= */

// Фільтри (C: S.fch). За замовчуванням — з профілю моряка: 3rd Engineer, танкери, від $4 000, посадка в наступному місяці.
type Opt = [string, string]
const F_GROUPS: { title: string; single?: boolean; chip?: boolean; mono?: boolean; opts: Opt[] }[] = [
  { title: 'Должность', chip: true, opts: [['r2', '2nd Engineer'], ['r3', '3rd Engineer'], ['r4', '4th Engineer']] },
  { title: 'Тип судна', chip: true, opts: [['tank', 'Танкеры'], ['cont', 'Контейнеровозы'], ['bulk', 'Балкеры'], ['gas', 'Газовозы']] },
  { title: 'Зарплата от', single: true, mono: true, opts: [['s3', '$3 000'], ['s4', '$4 000'], ['s5', '$5 000']] },
  { title: 'Посадка', single: true, opts: [['now', 'В этом месяце'], ['next', 'В следующем'], ['any', 'Любая']] },
]
const F_DEFAULT: Record<string, boolean> = { r3: true, tank: true, s4: true, next: true }
const F_LABEL = Object.fromEntries(F_GROUPS.flatMap((g) => g.opts))
const CHIP_KEYS = F_GROUPS.filter((g) => g.chip).flatMap((g) => g.opts.map((o) => o[0]))

const salaryOf = (s: string) => Number((s.match(/[\d\s]+/)?.[0] ?? '').replace(/\s/g, '')) || 0

export function JobsScreen({ go, filtersOpen = false }: { go: Go; filtersOpen?: boolean }) {
  const { bag, setBag, set, showToast } = useApp()
  const { isSaved, toggle } = useSavedJobs()
  const f = bag<Record<string, boolean>>('jobs.f', F_DEFAULT)
  const sortSal = bag<boolean>('jobs.sortSal', false)
  const [q, setQ] = useState('')
  const [sheet, setSheet] = useState(filtersOpen)

  const needle = q.trim().toLowerCase()
  const list = JOBS.map((_, k) => k)
    .filter((k) => !needle || [JOBS[k].t, JOBS[k].ship, JOBS[k].co].some((s) => s.toLowerCase().includes(needle)))
    .sort((a, b) => (sortSal ? salaryOf(JOBS[b].sal) - salaryOf(JOBS[a].sal) : a - b))
  const chips = CHIP_KEYS.filter((k) => f[k])

  const openSheet = () => setSheet(true)
  const closeSheet = () => {
    setSheet(false)
    if (filtersOpen) go('p05')
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <TabHead title="Вакансии" onMenu={() => go('p04')} />
        <div className="flex flex-col gap-4 px-6 pt-4">
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
            <button type="button" aria-label="Фильтры" onClick={openSheet} className="flex size-12 items-center justify-center rounded-md border border-border bg-surface text-foreground">
              <SlidersHorizontal className="size-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {chips.map((k) => (
              <span key={k} className="flex h-9 items-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                <button type="button" onClick={openSheet} className="h-full pl-4">
                  {F_LABEL[k]}
                </button>
                <button type="button" aria-label={`Убрать фильтр ${F_LABEL[k]}`} onClick={() => setBag('jobs.f', { ...f, [k]: false })} className="flex h-full items-center pr-3 pl-1.5">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setBag('jobs.sortSal', !sortSal)}
              className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-medium"
            >
              <ArrowUpDown className="size-3.5 text-muted-foreground" />
              {sortSal ? 'Сначала с большей зарплатой' : 'Новые сначала'}
            </button>
          </div>
          {list.length > 0 && (
            <div className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
              <span>
                <span className="font-mono">{list.length}</span> {plural(list.length, 'вакансия', 'вакансии', 'вакансий')} под ваш профиль
              </span>
              <button type="button" className="font-medium text-primary" onClick={() => showToast('Поиск сохранён. Пришлём уведомление о новых вакансиях')}>
                Сохранить поиск
              </button>
            </div>
          )}
        </div>
        {list.length ? (
          <ul className="mx-4 mt-3 mb-4 overflow-hidden rounded-xl border border-border bg-surface">
            {list.map((k) => (
              <JobRow
                key={k}
                k={k}
                saved={isSaved(k)}
                onSave={() => toggle(k)}
                onOpen={() => {
                  set({ job: k })
                  go('p08')
                }}
              />
            ))}
          </ul>
        ) : (
          <div className="mx-4 mt-3 mb-4">
            <Empty
              icon={SearchX}
              title="Ничего не нашли"
              text="Проверьте написание или ищите по должности, типу судна или названию агентства."
              action={
                <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => setQ('')}>
                  Очистить поиск
                </Button>
              }
            />
          </div>
        )}
      </div>
      <TabBar active="vac" onTab={(t) => (t === 'vac' ? undefined : go(TAB_TO[t]))} />
      <FiltersSheet open={sheet} f={f} onChange={(next) => setBag('jobs.f', next)} onClose={closeSheet} total={JOBS.length} />
    </div>
  )
}

function FiltersSheet({ open, f, onChange, onClose, total }: { open: boolean; f: Record<string, boolean>; onChange: (f: Record<string, boolean>) => void; onClose: () => void; total: number }) {
  const pick = (g: (typeof F_GROUPS)[number], k: string) => {
    if (!g.single) return onChange({ ...f, [k]: !f[k] })
    const next = { ...f }
    g.opts.forEach(([o]) => (next[o] = o === k ? !f[k] : false))
    onChange(next)
  }
  return (
    <AppSheet
      open={open}
      onClose={onClose}
      title="Фильтры"
      description="По умолчанию подставлены из вашего профиля."
      aside={
        <button type="button" className="text-[15px] font-medium text-primary" onClick={() => onChange({})}>
          Сбросить
        </button>
      }
      footer={
        <Button size="lg" onClick={onClose}>
          Показать <span className="font-mono">{total}</span> {plural(total, 'вакансию', 'вакансии', 'вакансий')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {F_GROUPS.map((g) => (
          <fieldset key={g.title}>
            <legend className="mb-2.5 text-[15px] font-medium">{g.title}</legend>
            <div className="flex flex-wrap gap-2">
              {g.opts.map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={!!f[k]}
                  onClick={() => pick(g, k)}
                  className={cn(
                    'flex h-10 items-center gap-1.5 rounded-full px-4 text-[15px] transition-colors',
                    f[k] ? 'bg-primary font-medium text-primary-foreground' : 'border border-border bg-surface text-foreground',
                  )}
                >
                  {f[k] && <Check className="size-4" strokeWidth={2.5} />}
                  <span className={g.mono ? 'font-mono' : undefined}>{label}</span>
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </AppSheet>
  )
}

/* ================= p08 / p12 — вакансія і відгук ================= */

export function JobScreen({ go, applyOpen = false }: { go: Go; applyOpen?: boolean }) {
  const { state, set, bag, setBag, showToast } = useApp()
  const { isSaved, toggle } = useSavedJobs()
  const [sheet, setSheet] = useState(applyOpen)
  const scroller = useRef<HTMLDivElement>(null)
  const k = state.job
  const j = JOBS[k]
  const applied = bag<number[]>('job.applied', [])
  const isApplied = applied.includes(k)
  const ok = matchOf(j)

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
  const send = () => {
    setBag('job.applied', [...applied, k])
    closeSheet()
    showToast('Отклик отправлен. Статус — во «Входящих»')
  }
  const openJob = (i: number) => {
    set({ job: i })
    scroller.current?.scrollTo({ top: 0 })
  }

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Вакансия" onBack={() => go('p05')} />
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        {(j.tags.length > 0 || isApplied) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <JobTags tags={j.tags} />
            {isApplied && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Check className="size-4 text-success" strokeWidth={2.5} />
                Вы откликнулись
              </span>
            )}
          </div>
        )}
        <h1 className="mt-3 text-[32px] leading-tight font-semibold tracking-tight">{j.t}</h1>
        <p className="mt-1 text-[22px] font-semibold text-primary">{j.sal}</p>

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

        <Section
          title="Требования"
          aside={
            <span className="text-sm text-muted-foreground">
              Подходит: <span className="font-mono">{ok}</span> из <span className="font-mono">{j.req.length}</span>
            </span>
          }
        >
          <ul>
            {j.req.map(([r, has]) => (
              <li key={r} className="flex items-start gap-3 border-t border-border py-2.5 first:border-t-0">
                {has ? <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.5} /> : <X className="mt-0.5 size-4 shrink-0 text-warning" strokeWidth={2.5} />}
                <span className="flex-1 text-[15px]">{r}</span>
                {!has && <span className="shrink-0 text-sm text-muted-foreground">нет в профиле</span>}
              </li>
            ))}
          </ul>
        </Section>
        <p className="mt-2 px-1 text-sm text-muted-foreground">Сравниваем с данными вашего профиля и документов.</p>

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
            {JOBS.map((x, i) =>
              i === k ? null : (
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
        {isApplied ? (
          <Button size="lg" variant="outline" className="flex-1 text-muted-foreground" disabled>
            <Check className="size-5" />
            Отклик отправлен
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

// Відгук (C: sheet 'apply'): агентство отримує анкету, заповнену з профілю. Якщо профіль не на 100 % —
// чесно пишемо, чого бракує, але відправити можна.
function ApplySheet({ open, k, onClose, onSend }: { open: boolean; k: number; onClose: () => void; onSend: () => void }) {
  const { bag } = useApp()
  const j = JOBS[k]
  const form = bag<{ v: QForm } | null>('q.form', null)?.v ?? FORM_DEFAULTS
  const med = bag<unknown[]>('s5.docs', []).length > 0
  const r = readiness(med)
  const miss = r.items.filter((x) => !x[1]).map((x) => x[0].toLowerCase())
  const sea = durText(bag<Voyage[]>('s6.voyages', VOYAGES).reduce((s, v) => s + vMonths(v), 0))
  const first = String(form.first || '')
  const last = String(form.last || '')
  const file = `${last || 'Seafarer'}_${first || 'Profile'}_3rdEng.pdf`
  const docNum = String(form.docNum || '')

  const rows: [string, ReactNode][] = [
    ['Имя и фамилия', `${first} ${last}`.trim() || 'Без имени'],
    ['Должность', String(form.dipRank || '3rd Engineer')],
    ['Документ моряка', <span className="font-mono">{docNum.slice(0, 2)} •••{docNum.slice(-3)}</span>],
    [
      'Диплом',
      <>
        <span className="font-mono">{String(form.dipStcw || 'III/1')}</span>, до <span className="font-mono">{String(form.dipExp)}</span>
      </>,
    ],
    ['Морской стаж', <MonoNums text={sea} />],
    ['Медицинские', med ? 'есть' : <span className="text-warning">нет в профиле</span>],
  ]

  return (
    <AppSheet
      open={open}
      onClose={onClose}
      title={`Отклик на ${j.t}`}
      description={`${j.co} получит анкету, заполненную из вашего профиля и документов.`}
      footer={
        <>
          <Button size="lg" onClick={onSend}>
            Отправить отклик
          </Button>
          <Button size="lg" variant="ghost" className="text-primary" onClick={onClose}>
            Отмена
          </Button>
        </>
      }
    >
      <Paper title={`Анкета для ${j.co}`}>
        <dl className="-my-1">
          {rows.map(([l, v]) => (
            <div key={l} className="flex justify-between gap-4 border-t border-border py-2 first:border-t-0">
              <dt className="text-sm text-muted-foreground">{l}</dt>
              <dd className="text-right text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
            <FileText className="size-4.5" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{file}</span>
            <span className="text-xs text-muted-foreground">PDF, заполнено из профиля</span>
          </span>
        </div>
      </Paper>
      {r.pct < 100 && (
        <Note icon={TriangleAlert} tone="warning" className="mt-4 bg-muted">
          <span className="font-medium">
            Профиль готов на <span className="font-mono">{r.pct} %</span>.
          </span>{' '}
          Не хватает: {miss.join(', ')}. Отклик можно отправить и так.
        </Note>
      )}
      <label className="mt-4 flex flex-col gap-2">
        <span className="text-[15px] font-medium">
          Сопроводительное письмо <span className="font-normal text-muted-foreground">(необязательно)</span>
        </span>
        <textarea
          rows={3}
          placeholder="Например, когда готовы выйти в рейс"
          className="resize-none rounded-md border border-input bg-surface px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
    </AppSheet>
  )
}

