import { useRef, useState, type ReactNode } from 'react'
import { ArrowUpDown, BadgeCheck, BellRing, Briefcase, Check, ChevronRight, Compass, Crown, Lock, MessageSquare, Plus, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { EmptyState, useView, ViewState } from '@/components/app/states'
import { TabBar } from '@/components/app/tab-bar'
import { MonoNums } from '@/components/app/mono-nums'
import { Button } from '@/components/ui/button'
import { ApplicationStatusDot } from '@/components/web/status-badge'
import {
  FILTER_DEFAULT,
  FILTER_EMPTY,
  FJ_JOBS,
  isClosed,
  JOB_VIEWS,
  MY_APPLICATIONS_DEFAULT,
  SEARCH_LIMIT,
  SEARCH_LIMIT_PREMIUM,
  SEARCHES_DEFAULT,
  type JobFilter,
  type SavedSearch,
  type SortId,
} from '@/lib/data-feed-jobs'
import { RECOMMENDED } from '@/lib/data-premium'
import type { ApplicationStatus } from '@/lib/data-web'
import { cn } from '@/lib/utils'
import { Dateish, JobTags } from '../g02-guest-jobs'
import { AppSheet, OfflineBanner, plural, SaveButton, TabHead, useApp, useOffline, useSavedJobs } from './_app-parts'
import { Segmented, useAppCounts, useChats } from '../m/_parts'
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

/* ---------- мої відгуки (відповідь 98: Отправлено / Ожидание / Метч / Отклонено — як у рекрутера) ---------- */

export type MyApplication = { job: number; status: ApplicationStatus; date: string }

// Відгуки моряка: ті, що вже були (чати ns і mc), і нові з екрана вакансії (bag job.applied) — «Отправлено».
export function useMyApplications() {
  const { bag } = useApp()
  const applied = bag<number[]>('job.applied', [])
  const fresh: MyApplication[] = applied
    .filter((k) => !MY_APPLICATIONS_DEFAULT.some((a) => a.job === k))
    .reverse()
    .map((k) => ({ job: k, status: 'sent', date: '02.11.2026' }))
  const list = [...fresh, ...MY_APPLICATIONS_DEFAULT]
  return { list, statusOf: (k: number) => list.find((a) => a.job === k)?.status ?? null }
}

// Перемикач під заголовком «Вакансии»: міняє лише вміст під ним на тому самому екрані p05.
// id pr-recommend і p23 у реєстрі відкривають p05 одразу на «Рекомендации» / «Отклики».
export type JobsTab = 'all' | 'rec' | 'mine'

export function JobsTabs({ active, onChange }: { active: JobsTab; onChange: (t: JobsTab) => void }) {
  const { list } = useMyApplications()
  // стан «Пусто» — лічильник відгуків теж порожній
  const none = useView() === 'empty'
  return (
    <div className="px-6 pt-3">
      <Segmented<JobsTab>
        label="Вакансии"
        value={active}
        onChange={onChange}
        items={[
          { id: 'all', label: 'Все' },
          { id: 'rec', label: 'Рекомендации', n: RECOMMENDED.length },
          { id: 'mine', label: 'Отклики', n: none ? undefined : list.length },
        ]}
      />
    </div>
  )
}

export function PicksButton({ go }: { go: Go }) {
  const { searches } = useSearches()
  const fresh = searches.reduce((n, s) => n + s.fresh, 0)
  return (
    <button type="button" onClick={() => go('p17')} className="relative flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-sm font-medium">
      <BellRing className="size-4 text-primary" />
      Подборки
      {fresh > 0 && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-primary" aria-label="Есть новые вакансии" />}
    </button>
  )
}

// Куди повертає сповіщення «Назад» і вакансія: екран-псевдонім відкриває p05 на потрібній вкладці.
const HERE: Record<JobsTab, string> = { all: 'p05', rec: 'pr-recommend', mine: 'p23' }

export function JobsScreen({ go, filtersOpen = false, initialTab = 'all' }: { go: Go; filtersOpen?: boolean; initialTab?: JobsTab }) {
  const { bag, setBag, set, showToast } = useApp()
  const { isSaved, toggle } = useSavedJobs()
  const { searches, setSearches } = useSearches()
  const counts = useAppCounts()
  const offline = useOffline()
  const f = bag<JobFilter>('jobs.filter', FILTER_DEFAULT)
  const sort = bag<SortId>('jobs.sort', 'new')
  const [q, setQ] = useState('')
  const [sheet, setSheet] = useState(filtersOpen)
  const [sortOpen, setSortOpen] = useState(false)
  const [limit, setLimit] = useState(false)
  const [tab, setTab] = useState<JobsTab>(initialTab)

  const view = useView()
  const list = jobList(f, sort, q)
  // у станах «Пусто» і «Загрузка» лічильник не показує вакансії, яких на екрані немає
  const shown = view === 'empty' ? 0 : list.length
  const chips = filterChips(f)
  const setF = (next: JobFilter) => setBag('jobs.filter', next)
  const savedHere = searches.some((s) => sameFilter(s.f, f))

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

  // Без мережі (стан «Ошибка») — той самий збережений список і плашка вгорі (відповідь 21).
  const results =
    list.length ? (
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
    )

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <TabHead
          title="Вакансии"
          onMenu={() => go('p04')}
          go={go}
          here={HERE[tab]}
          action={<PicksButton go={go} />}
        />
        <JobsTabs active={tab} onChange={setTab} />
        {tab === 'all' && (
        <>
        <div className="flex flex-col gap-3 px-6 pt-4">
          {offline && <OfflineBanner />}
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
              {view === 'loading' ? (
                'Загружаем…'
              ) : (
                <>
                  <span className="font-mono">{shown}</span> {plural(shown, 'вакансия', 'вакансии', 'вакансий')}
                </>
              )}
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
          error={results}
        >
          {results}
        </ViewState>
        </>
        )}
        {tab === 'rec' && <RecommendedTab go={go} />}
        {tab === 'mine' && <ApplicationsTab go={go} />}
      </div>
      <TabBar active="vac" go={go} counts={{ msg: counts.messages }} />
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
            <Button
              size="lg"
              variant="ghost"
              className="text-primary"
              onClick={() => {
                setBag('back.pr-lock-searches', 'p05')
                go('pr-lock-searches')
              }}
            >
              <Crown /> Больше подборок с Премиум
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
  const { statusOf } = useMyApplications()
  const status = statusOf(k)
  const chats = useChats()
  const jobView = useView()
  // відповідь 126: підписка на компанію — нові вакансії агентства приходять у «Рабочие»
  const subs = bag<string[]>('company.subs', [])
  const subscribed = subs.includes(j.co)

  // відповідь 101: лічильник переглядів вакансії
  const facts: [string, string][] = [
    ['Тип судна', j.ship],
    ['Посадка', j.board],
    ['Контракт', j.dur],
    ['Просмотры', String(JOB_VIEWS[k] ?? 0)],
  ]

  const toggleSub = () => {
    setBag('company.subs', subscribed ? subs.filter((x) => x !== j.co) : [...subs, j.co])
    showToast(subscribed ? `Вы отписались от ${j.co}` : `Вы подписались на ${j.co}`)
  }
  // чат з рекрутером цієї вакансії: уже є (пропозиція, давній відгук) або з'явиться після відгуку
  const openChat = () => {
    setBag('chat.sel', chats.forJob(k)?.id ?? `job-${k}`)
    go('m-chat')
  }

  const closeSheet = () => {
    setSheet(false)
    if (applyOpen) go('p08')
  }
  // Відповідь 97 і правка №22: одне торкання + підтвердження → чат з рекрутером із заглушкою «Вы откликнулись на вакансию».
  const send = () => {
    setBag('job.applied', [...applied, k])
    const existing = chats.forJob(k)
    // з цим рекрутером чат уже є — заглушка «Вы откликнулись на вакансию» додається в нього ж
    if (existing) chats.send(existing.id, { kind: 'event', event: 'applied' })
    setBag('chat.sel', existing?.id ?? `job-${k}`)
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
        <ViewState
          loading={{ kind: 'cards', rows: 3, className: 'px-0' }}
          error={{ title: 'Не удалось загрузить вакансию', className: 'px-0' }}
          empty={{ icon: SearchX, title: 'Вакансия удалена', className: 'px-0', text: 'Агентство сняло её с публикации. Посмотрите другие.', action: (
            <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => go('p05')}>
              Смотреть вакансии
            </Button>
          ) }}
        >
        <>
        {(closed || j.tags.length > 0 || status) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            {closed ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Lock className="size-4" /> Вакансия закрыта
              </span>
            ) : (
              <JobTags tags={j.tags} />
            )}
            {status && (
              <button type="button" onClick={() => go('p23')} className="flex items-center gap-2 text-sm text-muted-foreground">
                Ваш отклик: <ApplicationStatusDot s={status} />
              </button>
            )}
          </div>
        )}
        <h1 className={cn('mt-3 text-[32px] leading-tight font-semibold tracking-tight', closed && 'text-muted-foreground')}>{j.t}</h1>
        <p className={cn('mt-1 text-[22px] font-semibold', closed ? 'text-muted-foreground' : 'text-primary')}>{j.sal}</p>

        <div className="mt-4 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-card font-mono text-sm font-medium text-primary">{j.lg}</span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] font-semibold">{j.co}</span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <BadgeCheck className="size-4 shrink-0 text-success" />
              Агентство проверено, {j.ago}
            </span>
            <button
              type="button"
              aria-pressed={subscribed}
              onClick={toggleSub}
              className={cn('mt-1 flex h-8 items-center gap-1 self-start text-sm font-medium', subscribed ? 'text-muted-foreground' : 'text-primary')}
            >
              {subscribed ? <Check className="size-4 text-success" strokeWidth={2.5} /> : <Plus className="size-4" />}
              {subscribed ? 'Вы подписаны на компанию' : 'Подписаться на компанию'}
            </button>
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
        </>
        </ViewState>
      </div>
      {jobView === 'normal' && (
      <Footer className="flex-row border-t border-border bg-background">
        <SaveButton on={isSaved(k)} onClick={() => toggle(k)} className="size-12 border border-border" />
        {closed ? (
          <Button size="lg" variant="outline" className="flex-1 text-muted-foreground" disabled>
            Отклик закрыт
          </Button>
        ) : status ? (
          <Button size="lg" variant="outline" className="flex-1 text-primary" onClick={openChat}>
            <MessageSquare className="size-5" />
            Открыть чат с рекрутером
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={() => setSheet(true)}>
            Откликнуться
          </Button>
        )}
      </Footer>
      )}
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

/* ================= вкладки «Рекомендации» (раніше pr-recommend) і «Отклики» (раніше p23) ================= */

// Під кожною вакансією — чому ми її радимо (посада, тип судна, зарплата, перегляди); відповідність вимогам
// не показуємо (відповідь 99). Порожньо — мало даних у профілі: ведемо заповнити досвід роботи.
function RecommendedTab({ go }: { go: Go }) {
  const { set, setBag } = useApp()
  const { isSaved, toggle } = useSavedJobs()
  const open = (k: number) => {
    set({ job: k })
    setBag('job.back', 'pr-recommend')
    go('p08')
  }
  return (
    <>
      <p className="px-6 pt-4 text-sm text-muted-foreground">Подобраны по вашему профилю и тому, что вы смотрели. Обновляются каждый день.</p>
      <ViewState
        loading={{ kind: 'list', rows: 4 }}
        empty={{
          icon: Compass,
          title: 'Пока нечего рекомендовать',
          text: 'Добавьте опыт работы — подберём вакансии под вашу должность и тип судна.',
          action: (
            <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => go('p22')}>
              Добавить опыт
            </Button>
          ),
        }}
      >
        <ul className="mx-4 mt-3 mb-4 overflow-hidden rounded-xl border border-border bg-surface">
          {RECOMMENDED.map(({ k, why }) => {
            const j = FJ_JOBS[k]
            return (
              <li key={k} className="flex gap-3 border-t border-border py-4 pr-3 pl-5 first:border-t-0">
                <button type="button" onClick={() => open(k)} className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                  <span className="text-sm text-muted-foreground">{why}</span>
                  <span className="text-[17px] font-semibold">{j.t}</span>
                  <span className="text-[15px] font-semibold text-primary"><MonoNums text={j.sal} /></span>
                  <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                    <span>{j.ship}</span>
                    <span>
                      контракт <Dateish v={j.dur} />
                    </span>
                    <span>
                      посадка <Dateish v={j.board} />
                    </span>
                  </span>
                </button>
                <SaveButton on={isSaved(k)} onClick={() => toggle(k)} className="self-start" />
              </li>
            )
          })}
        </ul>
      </ViewState>
    </>
  )
}

// Статуси — как бачить рекрутер (APPLICATIONS у data-web): Отправлено → Ожидание → Метч / Отклонено (відповідь 98).
// Тап — вакансія; там же «Открыть чат с рекрутером».
function ApplicationsTab({ go }: { go: Go }) {
  const { set, setBag } = useApp()
  const { list } = useMyApplications()
  const open = (k: number) => {
    set({ job: k })
    setBag('job.back', 'p23')
    go('p08')
  }
  return (
    <ViewState
      loading={{ kind: 'list', rows: 3 }}
      empty={{
        icon: Briefcase,
        title: 'Откликов пока нет',
        text: 'Откликнитесь на вакансию — здесь будет видно, что с откликом, а ответ рекрутера придёт в «Сообщения».',
        action: (
          <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => go('p05')}>
            Смотреть вакансии
          </Button>
        ),
      }}
    >
      <ul className="mx-4 mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        {list.map((a) => {
          const j = FJ_JOBS[a.job]
          const dim = a.status === 'rejected'
          return (
            <li key={a.job} className="border-t border-border first:border-t-0">
              <button type="button" onClick={() => open(a.job)} className="flex w-full items-center gap-3 px-5 py-4 text-left active:bg-muted">
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className={cn('text-[17px] font-semibold', dim && 'text-muted-foreground')}>{j.t}</span>
                  <span className={cn('text-[15px] font-semibold', dim ? 'text-muted-foreground' : 'text-primary')}>{j.sal}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {j.co}, {j.ship}
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-3">
                    <ApplicationStatusDot s={a.status} />
                    <span className="text-sm text-muted-foreground">
                      отклик <span className="font-mono">{a.date}</span>
                    </span>
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 mb-6 px-6 text-sm text-muted-foreground">Статус меняет рекрутер. Ответ придёт в «Сообщения».</p>
    </ViewState>
  )
}
