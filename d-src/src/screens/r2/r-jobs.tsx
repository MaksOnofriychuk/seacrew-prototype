import { useState } from 'react'
import { Briefcase, Plus, SearchX } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { WebMultiSelect } from '@/components/web/web-pickers'
import { JobStatusDot } from '@/components/web/status-badge'
import { departmentsFor, FLEETS, positionsFor } from '@/lib/data'
import { ME_RECRUITER, RECRUITERS, salaryText, type JobStatus, type WebJob } from '@/lib/data-web'
import { JOB_EXTRA } from '@/lib/data-recruiter-2'
import type { ScreenProps } from '../registry'
import { ConfirmDialog, plural, ruDate, useR2 } from './_parts'

type Tab = JobStatus | 'all'

// r-jobs — вакансії агентства. Закриває вакансію рекрутер (відп. 27), лічильник переглядів (відп. 101).
export function RJobs({ go }: ScreenProps) {
  const r = useR2()
  const [tab, setTab] = useState<Tab>('open')
  const [q, setQ] = useState('')
  const [fleet, setFleet] = useState<string[]>([])
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState<string[]>([])
  const [owner, setOwner] = useState('')
  const [closing, setClosing] = useState<WebJob | null>(null)

  const count = (s: Tab) => r.jobs.filter((j) => s === 'all' || j.status === s).length
  const needle = q.trim().toLowerCase()
  const rows = r.jobs
    .filter((j) => tab === 'all' || j.status === tab)
    .filter((j) => !needle || [j.position, j.vesselName, j.vesselType].some((s) => s.toLowerCase().includes(needle)))
    .filter((j) => !fleet.length || fleet.includes(j.fleet))
    .filter((j) => !department || j.department === department)
    .filter((j) => !position.length || position.includes(j.position))
    .filter((j) => !owner || j.recruiterId === owner)
  const filtered = !!(needle || fleet.length || department || position.length || owner)
  // Флот → департамент → должность (№2, №25): кожен наступний список — лише під вибране в попередньому.
  const fleets = fleet.length ? fleet : FLEETS
  const departments = departmentsFor(fleets)
  const positions = positionsFor(fleets, department || null)

  const newApps = (id: string) => r.apps.filter((a) => a.jobId === id && a.status === 'sent').length
  const allApps = (id: string) => r.apps.filter((a) => a.jobId === id).length

  const open = (j: WebJob) => {
    r.openJob(j.id)
    go('r-job')
  }

  const columns: Column<WebJob>[] = [
    {
      key: 'position',
      header: 'Вакансия',
      width: '22%',
      sortValue: (j) => j.position,
      cell: (j) => (
        <span className="flex flex-col">
          <span className="truncate font-medium">{j.position || 'Без должности'}</span>
          <span className="truncate text-[13px] text-muted-foreground">
            {j.vesselType}
            {j.vesselName && `, ${j.vesselName}`}
          </span>
        </span>
      ),
    },
    { key: 'fleet', header: 'Флот', width: '10%', sortValue: (j) => j.fleet, cell: (j) => j.fleet },
    { key: 'salary', header: 'Зарплата', width: '16%', cell: (j) => (j.salary.amount ? <MonoNums text={salaryText(j)} /> : '—') },
    { key: 'board', header: 'Посадка', width: '11%', mono: true, sortValue: (j) => j.board, cell: (j) => ruDate(j.board) || '—' },
    {
      key: 'apps',
      header: 'Отклики',
      width: '11%',
      sortValue: (j) => allApps(j.id),
      cell: (j) => (
        <span className="flex items-baseline gap-2">
          <span className="font-mono">{allApps(j.id)}</span>
          {newApps(j.id) > 0 && (
            <span className="text-[13px] text-primary">
              +<span className="font-mono">{newApps(j.id)}</span> {plural(newApps(j.id), 'новый', 'новых', 'новых')}
            </span>
          )}
        </span>
      ),
    },
    { key: 'views', header: 'Просмотры', width: '9%', align: 'right', mono: true, sortValue: (j) => JOB_EXTRA[j.id]?.views ?? 0, cell: (j) => JOB_EXTRA[j.id]?.views ?? 0 },
    { key: 'status', header: 'Статус', width: '10%', cell: (j) => <JobStatusDot s={j.status} /> },
    {
      key: 'action',
      header: <span className="sr-only">Действия</span>,
      width: '11%',
      align: 'right',
      cell: (j) =>
        j.status === 'open' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setClosing(j)
            }}
            className="text-sm font-medium text-muted-foreground hover:text-signal"
          >
            Закрыть
          </button>
        ) : null,
    },
  ]

  return (
    <WebShell variant="recruiter" active="r-jobs" go={go}>
      <PageHeader
        title="Вакансии"
        description="Открытые вакансии моряки видят в приложении и откликаются в одно касание."
        actions={
          <Button
            onClick={() => {
              r.setEdit('new')
              go('r-job-edit')
            }}
          >
            <Plus /> Новая вакансия
          </Button>
        }
      />
      <PageTabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'open', label: 'Открытые', count: count('open') },
          { id: 'draft', label: 'Черновики', count: count('draft') },
          { id: 'closed', label: 'Закрытые', count: count('closed') },
          { id: 'all', label: 'Все', count: count('all') },
        ]}
      />
      <FilterBar
        className="items-start"
        search={{ value: q, onChange: setQ, placeholder: 'Должность или судно' }}
        onReset={
          filtered
            ? () => {
                setQ('')
                setFleet([])
                setDepartment('')
                setPosition([])
                setOwner('')
              }
            : undefined
        }
        count={rows.length}
      >
        <WebMultiSelect
          label="Флот"
          className="w-[320px]"
          values={fleet}
          options={[...FLEETS]}
          onChange={(v) => {
            setFleet(v)
            const fl = v.length ? v : FLEETS
            const dep = departmentsFor(fl).includes(department) ? department : ''
            if (dep !== department) setDepartment('')
            const allowed = dep ? positionsFor(fl, dep) : []
            setPosition((p) => p.filter((x) => allowed.includes(x)))
          }}
        />
        <FilterSelect
          className="data-[size=default]:h-10"
          label="Департамент"
          value={department}
          onChange={(v) => {
            setDepartment(v)
            setPosition([])
          }}
          options={departments}
        />
        <WebMultiSelect label="Должность" className="w-[290px]" values={position} options={positions} searchPlaceholder="Найти должность" disabled={!department} disabledHint="Сначала выберите департамент" onChange={setPosition} />
        <FilterSelect className="data-[size=default]:h-10" label="Рекрутер" value={owner} onChange={setOwner} options={RECRUITERS.map((x) => ({ value: x.id, label: x.id === ME_RECRUITER.id ? 'Мои' : x.name }))} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(j) => j.id}
        onRowClick={open}
        initialSort={{ key: 'board', dir: 'asc' }}
        empty={
          filtered
            ? { icon: SearchX, title: 'Ничего не нашлось', text: 'Измените поиск или сбросьте фильтры.' }
            : {
                icon: Briefcase,
                title: tab === 'closed' ? 'Закрытых вакансий нет' : tab === 'draft' ? 'Черновиков нет' : 'Вакансий пока нет',
                text: 'Опубликуйте вакансию — моряки увидят её в приложении.',
                action: (
                  <Button
                    onClick={() => {
                      r.setEdit('new')
                      go('r-job-edit')
                    }}
                  >
                    <Plus /> Новая вакансия
                  </Button>
                ),
              }
        }
      />
      <ConfirmDialog
        open={!!closing}
        onOpenChange={(v) => !v && setClosing(null)}
        title="Закрыть вакансию?"
        text={closing && `${closing.position}, ${closing.vesselName}. Вакансия пропадёт из поиска в приложении. Отклики и переписка останутся.`}
        confirm="Закрыть вакансию"
        danger
        onConfirm={() => {
          if (!closing) return
          r.setJobStatus(closing.id, 'closed')
          r.showToast('Вакансия закрыта')
        }}
      />
    </WebShell>
  )
}
