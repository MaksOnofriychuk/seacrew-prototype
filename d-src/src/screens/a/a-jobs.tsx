import { useState } from 'react'
import { WebDatePick } from '@/components/web/web-pickers'
import { BOUNDS, isoToRu, ruToIso } from '@/lib/dates'

import { Briefcase, Check, Plus, X } from 'lucide-react'
import { WebDialog } from '@/components/web/dialog'
import { MonoNums } from '@/components/app/mono-nums'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebInput, WebSelect, WebTextarea } from '@/components/web/fields'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader } from '@/components/web/page-header'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { FLEETS, departmentsFor, positionsFor } from '@/lib/data'
import { ADMIN_ORGS } from '@/lib/data-web'
import { AJOB_STATE_LABEL, A_JOBS, VESSEL_TYPES, type AJob, type AJobState } from '@/lib/data-admin'
import '@/lib/data-admin-53-f'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { AdminPage, AdminTabs, CancelButton, ExpandRows, Facts, Mono, WebMultiSelect, Note, PeriodFilter, SideSheet, dt, inPeriod, useBagState } from './_parts'
import { IconAction, QueueNav, RowActions } from './f53-parts'

const TONE: Record<AJobState, Tone> = { review: 'warning', published: 'success', rejected: 'muted', hidden: 'muted' }
type Tab = 'review' | 'published' | 'off' | 'all'

/** вакансію від імені Seafolio показуємо як «Команда Seafolio»; від імені агентства — назвою агентства */
const byLabel = (j: AJob) => (j.byTeam && j.org === 'Seafolio' ? 'Команда Seafolio' : j.org)

const DURATIONS = ['1 мес.', '2 мес.', '3 мес.', '4 мес.', '5 мес.', '6 мес.', '8 мес.', '9 мес.', '12 мес.']
const mask = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

const EMPTY_FORM = { org: 'Seafolio', fleet: '', department: '', position: '', vessel: '', amount: '', currency: '$', period: 'месяц', region: '', board: '', duration: '', text: '' }

export function AJobs({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [jobs, setJobs] = useBagState<AJob[]>('a.jobs', A_JOBS)
  const [tab, setTab] = useState<Tab>('review')
  const [q, setQ] = useState('')
  const [fleets, setFleets] = useState<string[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [who, setWho] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [ask, setAsk] = useState<{ id: string; to: 'rejected' | 'hidden' } | null>(null)
  const [f, setF] = useState(EMPTY_FORM)
  const open = jobs.find((j) => j.id === openId)

  const inTab = (j: AJob) => (tab === 'review' ? j.state === 'review' : tab === 'published' ? j.state === 'published' : tab === 'off' ? j.state === 'rejected' || j.state === 'hidden' : true)
  const rows = jobs
    .filter(inTab)
    .filter((j) => !fleets.length || fleets.includes(j.fleet))
    .filter((j) => inPeriod(j.created, from, to))
    .filter((j) => !who || (who === 'team' ? j.byTeam : !j.byTeam))
    .filter((j) => !q || (j.position + j.org + j.vesselType).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.created.localeCompare(a.created))
  const idx = rows.findIndex((j) => j.id === openId)

  const setState = (id: string, state: AJobState, toast: string) => {
    setJobs(jobs.map((j) => (j.id === id ? { ...j, state } : j)))
    showToast(toast)
    // очередь: открываем следующую запись; на вкладке «Все» запись остаётся в списке
    const next = tab === 'all' ? undefined : (rows[idx + 1] ?? rows[idx - 1])
    setOpenId(openId === id ? (next?.id ?? null) : openId)
    setAsk(null)
  }

  const add = () => {
    const job: AJob = {
      id: 'aj' + Date.now(),
      position: f.position,
      fleet: f.fleet,
      department: f.department,
      vesselType: f.vessel || '—',
      org: f.org,
      byTeam: true,
      salary: f.amount ? `${f.currency}${f.amount} / ${f.period}` : 'не указана',
      region: f.region || '—',
      board: f.board || '2026-12-01',
      duration: f.duration || '—',
      state: 'published',
      complaints: 0,
      created: '2026-11-02',
    }
    setJobs([job, ...jobs])
    setAdding(false)
    setF(EMPTY_FORM)
    setTab('published')
    showToast('Вакансия опубликована')
  }

  const allColumns: Column<AJob>[] = [
    {
      key: 'pos',
      header: 'Должность',
      width: '24%',
      sortValue: (j) => j.position,
      cell: (j) => (
        <span className="flex flex-col leading-tight">
          <span className="truncate font-medium" title={j.position}>{j.position}</span>
          <span className="truncate text-sm text-muted-foreground" title={`${j.fleet}, ${j.vesselType}`}>
            {j.fleet}, {j.vesselType}
          </span>
        </span>
      ),
    },
    {
      key: 'org',
      header: 'Кто разместил',
      width: '18%',
      sortValue: (j) => j.org,
      cell: (j) => (
        <span className="flex flex-col leading-tight">
          <span className="truncate">{byLabel(j)}</span>
          {(j.note || (j.byTeam && j.org !== 'Seafolio')) && <span className="truncate text-sm text-muted-foreground" title={j.note}>{j.note ?? 'добавила команда'}</span>}
        </span>
      ),
    },
    { key: 'salary', header: 'Зарплата', width: '14%', cell: (j) => <MonoNums text={j.salary} /> },
    { key: 'created', header: 'Размещена', hidden: true, sortValue: (j) => j.created, cell: (j) => dt(j.created) },
    { key: 'board', header: 'Посадка', width: '12%', mono: true, sortValue: (j) => j.board, cell: (j) => dt(j.board) },
    { key: 'cmp', header: 'Жалобы', width: '8%', align: 'right', sortValue: (j) => j.complaints, cell: (j) => <Mono className={j.complaints ? 'text-signal' : 'text-muted-foreground'}>{j.complaints}</Mono> },
    { key: 'state', header: 'Статус', width: '14%', sortValue: (j) => j.state, cell: (j) => <StatusDot tone={TONE[j.state]}>{AJOB_STATE_LABEL[j.state]}</StatusDot> },
    {
      key: 'act',
      header: <span className="sr-only">Действия</span>,
      width: '88px',
      cell: (j) =>
        j.state === 'review' ? (
          <RowActions>
            <IconAction label="Опубликовать" tone="ok" onClick={() => setState(j.id, 'published', 'Вакансия опубликована')}>
              <Check className="size-4" />
            </IconAction>
            <IconAction label="Отклонить…" tone="danger" onClick={() => setAsk({ id: j.id, to: 'rejected' })}>
              <X className="size-4" />
            </IconAction>
          </RowActions>
        ) : null,
    },
  ]

  const columns = allColumns.filter((c) => c.key !== 'act' || tab === 'review' || tab === 'all')

  const depts = f.fleet ? departmentsFor([f.fleet]) : []
  const positions = f.fleet && f.department ? positionsFor([f.fleet], f.department) : []
  const vessels = VESSEL_TYPES.filter((v) => !f.fleet || v.fleet === f.fleet).map((v) => v.name)

  return (
    <AdminPage active="a-jobs" go={go}>
      <PageHeader
        title="Вакансии"
        description="Агентства публикуют вакансии сами. Новые от непроверенных организаций и вакансии с жалобами ждут вашего решения. Пока агентств мало, команда добавляет вакансии от имени Seafolio."
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus /> Добавить вакансию
          </Button>
        }
      />
      <AdminTabs<Tab>
        tabs={[
          { id: 'review', label: 'На проверке', count: jobs.filter((j) => j.state === 'review').length },
          { id: 'published', label: 'Опубликованные', count: jobs.filter((j) => j.state === 'published').length },
          { id: 'off', label: 'Снятые и отклонённые', count: jobs.filter((j) => j.state === 'rejected' || j.state === 'hidden').length },
          { id: 'all', label: 'Все', count: jobs.length },
        ]}
        value={tab}
        onChange={setTab}
      />
      <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Должность, судно, компания' }} onReset={fleets.length || who || from || to || q ? () => (setFleets([]), setWho(''), setFrom(''), setTo(''), setQ('')) : undefined} count={rows.length}>
        <WebMultiSelect label="Флот" className="w-[260px]" values={fleets} onChange={setFleets} options={[...FLEETS]} />
        <FilterSelect label="Кто" value={who} onChange={setWho} options={[{ value: 'team', label: 'Команда Seafolio' }, { value: 'orgs', label: 'Агентства' }]} />
        <PeriodFilter label="Размещена" from={from} to={to} onChange={(a, b) => (setFrom(a), setTo(b))} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(j) => j.id}
        onRowClick={(j) => setOpenId(j.id)}
        selectedKey={openId ?? undefined}
        initialSort={{ key: 'created', dir: 'desc' }}
        pageSizes={[10, 20, 50]}
        sortOptions={[
          { key: 'created', dir: 'desc', label: 'Размещена: сначала новые' },
          { key: 'created', dir: 'asc', label: 'Размещена: сначала старые' },
          { key: 'board', dir: 'asc', label: 'Посадка: ближайшая' },
          { key: 'cmp', dir: 'desc', label: 'Жалобы: сначала больше' },
          { key: 'pos', dir: 'asc', label: 'Должность: А — Я' },
          { key: 'org', dir: 'asc', label: 'Кто разместил: А — Я' },
        ]}
        empty={tab === 'review' && !q && !fleets.length && !who && !from && !to ? { icon: Briefcase, title: 'Проверять нечего', text: 'Новые вакансии от непроверенных агентств и вакансии с жалобами появятся здесь.' } : { icon: Briefcase, title: 'Вакансий не нашлось', text: 'Сбросьте фильтры или откройте вкладку «Все».' }}
      />

      <SideSheet
        open={!!open}
        onOpenChange={(v) => !v && setOpenId(null)}
        title={open?.position}
        description={open ? byLabel(open) : undefined}
        footer={
          open && (
            <>
              {open.state === 'review' && (
                <>
                  <Button variant="outline" onClick={() => setAsk({ id: open.id, to: 'rejected' })}>
                    Отклонить
                  </Button>
                  <Button onClick={() => setState(open.id, 'published', 'Вакансия опубликована')}>Опубликовать</Button>
                </>
              )}
              {open.state === 'published' && (
                <Button variant="outline" className="text-signal" onClick={() => setAsk({ id: open.id, to: 'hidden' })}>
                  Снять с публикации
                </Button>
              )}
              {(open.state === 'hidden' || open.state === 'rejected') && (
                <Button variant="outline" onClick={() => setState(open.id, 'review', 'Вакансия вернулась на проверку')}>
                  Вернуть на проверку
                </Button>
              )}
            </>
          )
        }
      >
        {open && (
          <>
            <QueueNav index={idx} total={rows.length} onPrev={() => setOpenId(rows[idx - 1].id)} onNext={() => setOpenId(rows[idx + 1].id)} noun={tab === 'all' ? 'в списке' : 'в очереди'} />
            {open.note && <Note tone={open.complaints ? 'error' : 'warning'}>{open.note}</Note>}
            <Facts
              items={[
                ['Флот', open.fleet],
                ['Департамент', open.department],
                ['Тип судна', open.vesselType],
                ['Регион', open.region],
                ['Зарплата', <MonoNums key="s" text={open.salary} />],
                ['Контракт', open.duration],
                ['Посадка', <Mono key="b">{dt(open.board)}</Mono>],
                ['Размещена', <Mono key="c">{dt(open.created)}</Mono>],
              ]}
            />
            <div className="flex items-center justify-between border-t border-border pt-4 text-[15px]">
              <span className="text-muted-foreground">Жалобы моряков</span>
              <Mono className={open.complaints ? 'text-signal' : ''}>{open.complaints}</Mono>
            </div>
          </>
        )}
      </SideSheet>

      <WebDialog
        open={!!ask}
        onClose={() => setAsk(null)}
        title={ask?.to === 'rejected' ? 'Отклонить вакансию?' : 'Снять вакансию с публикации?'}
        description={jobs.find((j) => j.id === ask?.id)?.position}
        footer={
          <>
            <CancelButton onClick={() => setAsk(null)} />
            <Button variant="destructive" onClick={() => ask && setState(ask.id, ask.to, ask.to === 'rejected' ? 'Вакансия отклонена' : 'Вакансия снята с публикации')}>
              {ask?.to === 'rejected' ? 'Отклонить' : 'Снять'}
            </Button>
          </>
        }
      >
        <p className="text-[15px] text-muted-foreground">{ask?.to === 'rejected' ? 'Моряки её не увидят. Агентство получит уведомление и сможет вернуть вакансию на проверку.' : 'Вакансия пропадёт из ленты и поиска. Отклики останутся у рекрутера.'}</p>
      </WebDialog>

      <SideSheet
        open={adding}
        onOpenChange={setAdding}
        title="Новая вакансия"
        description="Опубликуется сразу, без проверки. Моряки увидят её в ленте вакансий."
        footer={
          <>
            <CancelButton onClick={() => setAdding(false)} />
            <Button disabled={!f.position} onClick={add}>
              Опубликовать
            </Button>
          </>
        }
      >
        <ExpandRows
          rows={[
            {
              id: 'who',
              title: 'Кто и какая должность',
              summary: f.position ? `${f.position}, ${f.fleet}` : 'не заполнено',
              body: (
                <>
                  <WebField id="nj-org" label="От имени">
                    <WebSelect id="nj-org" value={f.org} onChange={(v) => setF({ ...f, org: v })} options={['Seafolio', ...ADMIN_ORGS.filter((o) => o.status === 'verified').map((o) => o.name)]} />
                  </WebField>
                  <WebField id="nj-fleet" label="Флот" required>
                    <WebSelect id="nj-fleet" value={f.fleet} onChange={(v) => setF({ ...f, fleet: v, department: '', position: '', vessel: '' })} options={[...FLEETS]} />
                  </WebField>
                  <WebField id="nj-dep" label="Департамент" required>
                    <WebSelect id="nj-dep" value={f.department} onChange={(v) => setF({ ...f, department: v, position: '' })} options={depts} placeholder={f.fleet ? 'Выберите' : 'Сначала флот'} />
                  </WebField>
                  <WebField id="nj-pos" label="Должность" required>
                    <WebSelect id="nj-pos" value={f.position} onChange={(v) => setF({ ...f, position: v })} options={positions} placeholder={f.department ? 'Выберите' : 'Сначала департамент'} />
                  </WebField>
                  <WebField id="nj-vessel" label="Тип судна">
                    <WebSelect id="nj-vessel" value={f.vessel} onChange={(v) => setF({ ...f, vessel: v })} options={vessels} />
                  </WebField>
                </>
              ),
            },
            {
              id: 'terms',
              title: 'Условия',
              summary: [f.amount && `${f.currency}${f.amount}`, f.duration, f.board && dt(f.board)].filter(Boolean).join(', ') || 'не заполнено',
              body: (
                <>
                  <div className="grid grid-cols-[1fr_72px_112px] gap-3">
                    <WebField id="nj-amount" label="Зарплата">
                      <WebInput id="nj-amount" inputMode="numeric" value={f.amount} onChange={(e) => setF({ ...f, amount: mask(e.target.value) })} placeholder="4 500" className="font-mono" />
                    </WebField>
                    <WebField id="nj-cur" label="Валюта">
                      <WebSelect id="nj-cur" value={f.currency} onChange={(v) => setF({ ...f, currency: v })} options={['$', '€', '£']} />
                    </WebField>
                    <WebField id="nj-per" label="За">
                      <WebSelect id="nj-per" value={f.period} onChange={(v) => setF({ ...f, period: v })} options={['месяц', 'день']} />
                    </WebField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <WebField id="nj-region" label="Регион">
                      <WebSelect id="nj-region" value={f.region} onChange={(v) => setF({ ...f, region: v })} options={['Европа', 'Африка', 'ОАЭ']} />
                    </WebField>
                    <WebField id="nj-dur" label="Контракт">
                      <WebSelect id="nj-dur" value={f.duration} onChange={(v) => setF({ ...f, duration: v })} options={DURATIONS} />
                    </WebField>
                  </div>
                  <WebField id="nj-board" label="Посадка">
                    <WebDatePick id="nj-board" value={isoToRu(f.board)} onChange={(v) => setF({ ...f, board: ruToIso(v) })} {...BOUNDS.future} />
                  </WebField>
                </>
              ),
            },
            {
              id: 'text',
              title: 'Описание',
              summary: f.text ? f.text.slice(0, 40) : 'необязательно',
              body: (
                <WebField id="nj-text" label="Описание">
                  <WebTextarea id="nj-text" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="Судно, линия, условия на борту" />
                </WebField>
              ),
            },
          ]}
        />
      </SideSheet>
    </AdminPage>
  )
}
