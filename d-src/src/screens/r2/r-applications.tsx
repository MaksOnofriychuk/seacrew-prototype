import { useState, type ReactNode } from 'react'
import { Inbox, MessageSquare, SearchX, UserRound } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { useView } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { usePrefs } from '@/components/web/web-prefs'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { ApplicationStatusDot, AvailabilityDot, WebAvatar } from '@/components/web/status-badge'
import { APPLICATION_STATUS_LABEL, seafarerById, type Application, type ApplicationStatus } from '@/lib/data-web'
import type { ScreenProps } from '../registry'
import { expForFilter, monthsText } from '@/lib/data-recruiter-1'
import { useProto } from '@/lib/proto-state'
import { ConfirmDialog, ruDate, useR2 } from './_parts'

type Tab = ApplicationStatus | 'all'
const TABS: ApplicationStatus[] = ['sent', 'waiting', 'match', 'rejected']

// Що бачить моряк у застосунку при кожному статусі (відп. 98).
const SEAFARER_SEES: Record<ApplicationStatus, string> = {
  sent: 'Моряк видит «Отправлено». Решите: метч, ожидание или отказ.',
  waiting: 'Моряк видит «Ожидание» — вы рассматриваете отклик.',
  match: 'Моряк видит «Метч». Договоритесь о деталях в разговоре.',
  rejected: 'Моряк видит «Отклонено». Разговор остаётся в истории.',
}

// r-applications — відгуки на вакансії: статуси отправлено / ожидание / метч / отклонено (відп. 98),
// дії рекрутера і перехід у розмову (правка №22). Таблиця ліворуч, вибраний відгук — праворуч.
export function RApplications({ go }: ScreenProps) {
  const { prefs } = usePrefs()
  const r = useR2()
  const view = useView()
  const { setBag } = useProto()
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [job, setJob] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const needle = q.trim().toLowerCase()
  const jobOf = (a: Application) => r.jobs.find((j) => j.id === a.jobId)!
  const rows = r.apps
    .filter((a) => tab === 'all' || a.status === tab)
    .filter((a) => !job || a.jobId === job)
    .filter((a) => !needle || [seafarerById(a.seafarerId)!.name, seafarerById(a.seafarerId)!.position].some((s) => s.toLowerCase().includes(needle)))
  const filtered = !!(needle || job)
  const sel = r.apps.find((a) => a.id === r.appId) ?? r.apps[0]

  const set = (s: ApplicationStatus) => {
    r.setAppStatus(sel.id, s)
    r.showToast(`Статус: «${APPLICATION_STATUS_LABEL[s]}». Моряк увидит его в приложении.`)
  }
  const openChat = () => {
    r.openChat(sel.id)
    go('r-chat')
  }

  const columns: Column<Application>[] = [
    {
      key: 'who',
      header: 'Моряк',
      width: '33%',
      sortValue: (a) => seafarerById(a.seafarerId)!.name,
      cell: (a) => {
        const s = seafarerById(a.seafarerId)!
        return (
          <span className="flex items-center gap-3">
            <WebAvatar initials={s.initials} size="sm" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{s.name}</span>
              <span className="truncate text-[13px] text-muted-foreground">
                {s.experienceMonths !== null && (
                  <>
                    <MonoNums text={monthsText(s.experienceMonths)} /> ·{' '}
                  </>
                )}
                {s.position}
              </span>
            </span>
          </span>
        )
      },
    },
    {
      key: 'job',
      header: 'Вакансия',
      width: '23%',
      sortValue: (a) => jobOf(a).position,
      cell: (a) => (
        <span className="flex flex-col">
          <span className="truncate">{jobOf(a).position}</span>
          <span className="truncate text-[13px] text-muted-foreground">{jobOf(a).vesselName}</span>
        </span>
      ),
    },
    {
      key: 'exp',
      header: 'Опыт',
      hidden: true,
      width: '0',
      sortValue: (a) => expForFilter(seafarerById(a.seafarerId)!),
      cell: (a) => {
        const m = seafarerById(a.seafarerId)!.experienceMonths
        return m === null ? <span className="text-muted-foreground">по контрактам</span> : <MonoNums text={monthsText(m)} />
      },
    },
    { key: 'date', header: 'Отклик', width: '21%', mono: true, sortValue: (a) => a.date, cell: (a) => ruDate(a.date) },
    { key: 'status', header: 'Статус', width: '23%', sortValue: (a) => TABS.indexOf(a.status), cell: (a) => <ApplicationStatusDot s={a.status} /> },
  ]

  const s = seafarerById(sel.seafarerId)!
  const sj = jobOf(sel)

  return (
    <WebShell variant="recruiter" active="r-applications" go={go}>
      <PageHeader title="Отклики" description="Моряк откликается из приложения — у вас сразу появляется разговор с ним." />
      <PageTabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[{ id: 'all', label: 'Все', count: r.apps.length }, ...TABS.map((t) => ({ id: t, label: APPLICATION_STATUS_LABEL[t], count: r.apps.filter((a) => a.status === t).length }))]}
      />
      <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-6">
        <div className="min-w-0">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: 'Имя или должность' }}
            onReset={
              filtered
                ? () => {
                    setQ('')
                    setJob('')
                  }
                : undefined
            }
            count={rows.length}
          >
            <FilterSelect label="Вакансия" value={job} onChange={setJob} options={r.jobs.filter((j) => r.apps.some((a) => a.jobId === j.id)).map((j) => ({ value: j.id, label: `${j.position}, ${j.vesselName}` }))} className="max-w-[300px] data-[size=default]:h-10" />
          </FilterBar>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(a) => a.id}
            onRowClick={(a) => r.selectApp(a.id)}
            selectedKey={sel.id}
            initialSort={{ key: 'date', dir: 'desc' }}
            pageSizes={[10, 20, 50]}
            pageSize={Number(prefs.rows)}
            sortOptions={[
              { key: 'date', dir: 'desc', label: 'Дата: сначала новые' },
              { key: 'date', dir: 'asc', label: 'Дата: сначала старые' },
              { key: 'exp', dir: 'desc', label: 'Опыт: сначала больше' },
              { key: 'exp', dir: 'asc', label: 'Опыт: сначала меньше' },
              { key: 'who', dir: 'asc', label: 'Имя: А — Я' },
              { key: 'status', dir: 'asc', label: 'Статус: новые отклики первыми' },
            ]}
            empty={
              filtered
                ? { icon: SearchX, title: 'Ничего не нашлось', text: 'Измените поиск или сбросьте фильтры.' }
                : { icon: Inbox, title: 'Откликов пока нет', text: 'Когда моряк откликнется на вашу вакансию, отклик появится здесь.' }
            }
          />
        </div>

        {view === 'normal' && (
          <aside className="sticky top-0 flex flex-col rounded-xl border border-border bg-surface">
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-3">
                <WebAvatar initials={s.initials} size="lg" className="size-12 text-base" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-lg font-semibold">{s.name}</span>
                  <span className="truncate text-sm text-muted-foreground">{s.position}</span>
                </div>
              </div>
              <dl className="flex flex-col gap-2 text-sm">
                <Row l="Готовность">
                  <AvailabilityDot a={s.availability} short />
                </Row>
                <Row l="Опыт">{s.experienceMonths === null ? <span className="text-muted-foreground">по контрактам</span> : <MonoNums text={monthsText(s.experienceMonths)} />}</Row>
                <Row l="Национальность">{s.nationality}</Row>
                <Row l="Ближайший аэропорт">{s.airport}</Row>
              </dl>
              <button
                type="button"
                onClick={() => {
                  setBag('r1.seafarer', s.id)
                  go('r-seafarer')
                }}
                className="flex items-center gap-2 self-start text-sm font-medium text-primary"
              >
                <UserRound className="size-4" /> Профиль моряка
              </button>
            </div>

            <div className="flex flex-col gap-3 border-t border-border p-5">
              <span className="text-sm text-muted-foreground">
                Откликнулся <span className="font-mono">{ruDate(sel.date)}</span> на вакансию
              </span>
              <button
                type="button"
                onClick={() => {
                  r.openJob(sj.id)
                  go('r-job')
                }}
                className="flex flex-col items-start text-left"
              >
                <span className="font-medium text-primary">{sj.position}</span>
                <span className="text-sm text-muted-foreground">
                  {sj.vesselType}, {sj.vesselName}
                </span>
              </button>
            </div>

            <div className="flex flex-col gap-3 border-t border-border p-5">
              <ApplicationStatusDot s={sel.status} />
              <p className="text-sm text-muted-foreground">{SEAFARER_SEES[sel.status]}</p>
              {(sel.status === 'sent' || sel.status === 'waiting') && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => set('match')}>Метч</Button>
                  {sel.status === 'sent' && (
                    <Button variant="outline" onClick={() => set('waiting')}>
                      В ожидание
                    </Button>
                  )}
                  <Button variant="outline" className="text-signal" onClick={() => setRejecting(true)}>
                    Отклонить
                  </Button>
                </div>
              )}
              {sel.status === 'rejected' && (
                <Button variant="outline" className="self-start" onClick={() => set('waiting')}>
                  Вернуть в ожидание
                </Button>
              )}
            </div>

            <div className="border-t border-border p-5">
              <Button variant={sel.status === 'match' ? 'default' : 'outline'} className="w-full" onClick={openChat}>
                <MessageSquare /> Открыть разговор
              </Button>
            </div>
          </aside>
        )}
      </div>
      <ConfirmDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title="Отклонить отклик?"
        text={`${s.name} увидит статус «Отклонено» у вакансии ${sj.position}.`}
        confirm="Отклонить"
        danger
        onConfirm={() => set('rejected')}
      />
    </WebShell>
  )
}

function Row({ l, children }: { l: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{l}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}
