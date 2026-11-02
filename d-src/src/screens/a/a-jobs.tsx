import { useState } from 'react'
import { Briefcase, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebInput, WebSelect, WebTextarea } from '@/components/web/fields'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { FLEETS, departmentsFor, positionsFor } from '@/lib/data'
import { ADMIN_ORGS } from '@/lib/data-web'
import { AJOB_STATE_LABEL, A_JOBS, VESSEL_TYPES, type AJob, type AJobState } from '@/lib/data-admin'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { AdminPage, CancelButton, Facts, Mono, Note, SideSheet, dt, useBagState } from './_parts'

const TONE: Record<AJobState, Tone> = { review: 'warning', published: 'success', rejected: 'muted', hidden: 'muted' }
type Tab = 'review' | 'published' | 'off' | 'all'

const EMPTY_FORM = { org: 'Seafolio', fleet: '', department: '', position: '', vessel: '', amount: '', currency: '$', period: 'месяц', region: '', board: '', duration: '', text: '' }

export function AJobs({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [jobs, setJobs] = useBagState<AJob[]>('a.jobs', A_JOBS)
  const [tab, setTab] = useState<Tab>('review')
  const [q, setQ] = useState('')
  const [fleet, setFleet] = useState('')
  const [who, setWho] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState(EMPTY_FORM)
  const open = jobs.find((j) => j.id === openId)

  const inTab = (j: AJob) => (tab === 'review' ? j.state === 'review' : tab === 'published' ? j.state === 'published' : tab === 'off' ? j.state === 'rejected' || j.state === 'hidden' : true)
  const rows = jobs
    .filter(inTab)
    .filter((j) => !fleet || j.fleet === fleet)
    .filter((j) => !who || (who === 'team' ? j.byTeam : !j.byTeam))
    .filter((j) => !q || (j.position + j.org + j.vesselType).toLowerCase().includes(q.toLowerCase()))

  const setState = (id: string, state: AJobState, toast: string) => {
    setJobs(jobs.map((j) => (j.id === id ? { ...j, state } : j)))
    showToast(toast)
    setOpenId(null)
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

  const columns: Column<AJob>[] = [
    {
      key: 'pos',
      header: 'Должность',
      width: '27%',
      sortValue: (j) => j.position,
      cell: (j) => (
        <span className="flex flex-col leading-tight">
          <span className="truncate font-medium">{j.position}</span>
          <span className="truncate text-sm text-muted-foreground">
            {j.fleet}, {j.vesselType}
          </span>
        </span>
      ),
    },
    {
      key: 'org',
      header: 'Кто разместил',
      width: '20%',
      sortValue: (j) => j.org,
      cell: (j) => (
        <span className="flex flex-col leading-tight">
          <span className="truncate">{j.byTeam ? 'Команда Seafolio' : j.org}</span>
          {j.note && <span className="truncate text-sm text-muted-foreground">{j.note}</span>}
        </span>
      ),
    },
    { key: 'salary', header: 'Зарплата', width: '16%', cell: (j) => <span className="font-mono text-[13px]">{j.salary}</span> },
    { key: 'board', header: 'Посадка', width: '11%', mono: true, sortValue: (j) => j.board, cell: (j) => dt(j.board) },
    { key: 'cmp', header: 'Жалобы', width: '9%', align: 'right', sortValue: (j) => j.complaints, cell: (j) => <Mono className={j.complaints ? 'text-signal' : 'text-muted-foreground'}>{j.complaints}</Mono> },
    { key: 'state', header: 'Статус', width: '17%', sortValue: (j) => j.state, cell: (j) => <StatusDot tone={TONE[j.state]}>{AJOB_STATE_LABEL[j.state]}</StatusDot> },
  ]

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
      <PageTabs<Tab>
        tabs={[
          { id: 'review', label: 'На проверке', count: jobs.filter((j) => j.state === 'review').length },
          { id: 'published', label: 'Опубликованные', count: jobs.filter((j) => j.state === 'published').length },
          { id: 'off', label: 'Снятые и отклонённые', count: jobs.filter((j) => j.state === 'rejected' || j.state === 'hidden').length },
          { id: 'all', label: 'Все', count: jobs.length },
        ]}
        value={tab}
        onChange={setTab}
      />
      <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Должность, судно, компания' }} onReset={fleet || who || q ? () => (setFleet(''), setWho(''), setQ('')) : undefined} count={rows.length}>
        <FilterSelect label="Флот" value={fleet} onChange={setFleet} options={[...FLEETS]} />
        <FilterSelect label="Кто" value={who} onChange={setWho} options={[{ value: 'team', label: 'Команда Seafolio' }, { value: 'orgs', label: 'Агентства' }]} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(j) => j.id}
        onRowClick={(j) => setOpenId(j.id)}
        selectedKey={openId ?? undefined}
        empty={tab === 'review' && !q && !fleet && !who ? { icon: Briefcase, title: 'Проверять нечего', text: 'Новые вакансии от непроверенных агентств и вакансии с жалобами появятся здесь.' } : { icon: Briefcase, title: 'Вакансий не нашлось', text: 'Сбросьте фильтры или откройте вкладку «Все».' }}
      />

      <SideSheet
        open={!!open}
        onOpenChange={(v) => !v && setOpenId(null)}
        title={open?.position}
        description={open ? (open.byTeam ? 'Команда Seafolio' : open.org) : undefined}
        footer={
          open && (
            <>
              {open.state === 'review' && (
                <>
                  <Button variant="outline" onClick={() => setState(open.id, 'rejected', 'Вакансия отклонена')}>
                    Отклонить
                  </Button>
                  <Button onClick={() => setState(open.id, 'published', 'Вакансия опубликована')}>Опубликовать</Button>
                </>
              )}
              {open.state === 'published' && (
                <Button variant="outline" className="text-signal" onClick={() => setState(open.id, 'hidden', 'Вакансия снята с публикации')}>
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
            {open.note && <Note tone={open.complaints ? 'error' : 'warning'}>{open.note}</Note>}
            <Facts
              items={[
                ['Флот', open.fleet],
                ['Департамент', open.department],
                ['Тип судна', open.vesselType],
                ['Регион', open.region],
                ['Зарплата', <Mono key="s">{open.salary}</Mono>],
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
        <WebField id="nj-org" label="От имени">
          <WebSelect id="nj-org" value={f.org} onChange={(v) => setF({ ...f, org: v })} options={['Seafolio', ...ADMIN_ORGS.filter((o) => o.status === 'verified').map((o) => o.name)]} />
        </WebField>
        <WebField id="nj-fleet" label="Флот" required>
          <WebSelect id="nj-fleet" value={f.fleet} onChange={(v) => setF({ ...f, fleet: v, department: '', position: '', vessel: '' })} options={[...FLEETS]} />
        </WebField>
        <div className="grid grid-cols-2 gap-3">
          <WebField id="nj-dep" label="Департамент" required>
            <WebSelect id="nj-dep" value={f.department} onChange={(v) => setF({ ...f, department: v, position: '' })} options={depts} placeholder={f.fleet ? 'Выберите' : 'Сначала флот'} />
          </WebField>
          <WebField id="nj-pos" label="Должность" required>
            <WebSelect id="nj-pos" value={f.position} onChange={(v) => setF({ ...f, position: v })} options={positions} placeholder={f.department ? 'Выберите' : 'Сначала департамент'} />
          </WebField>
        </div>
        <WebField id="nj-vessel" label="Тип судна">
          <WebSelect id="nj-vessel" value={f.vessel} onChange={(v) => setF({ ...f, vessel: v })} options={vessels} />
        </WebField>
        <div className="grid grid-cols-[1fr_72px_112px] gap-3">
          <WebField id="nj-amount" label="Зарплата">
            <WebInput id="nj-amount" inputMode="numeric" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="4 500" className="font-mono" />
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
            <WebSelect id="nj-region" value={f.region} onChange={(v) => setF({ ...f, region: v })} options={['Европа', 'Африка', 'ОАЭ', 'Азия']} />
          </WebField>
          <WebField id="nj-dur" label="Контракт">
            <WebInput id="nj-dur" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} placeholder="4 мес. или 6 недель" />
          </WebField>
        </div>
        <WebField id="nj-board" label="Посадка">
          <WebInput id="nj-board" type="date" value={f.board} onChange={(e) => setF({ ...f, board: e.target.value })} className="font-mono" />
        </WebField>
        <WebField id="nj-text" label="Описание">
          <WebTextarea id="nj-text" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="Судно, линия, условия на борту" />
        </WebField>
      </SideSheet>
    </AdminPage>
  )
}
