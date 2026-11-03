import { useState } from 'react'
import { Ban, Link2, ShieldOff, UserX } from 'lucide-react'
import { EmptyState, ErrorState, LoadingState, useView } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebDialog } from '@/components/web/dialog'
import { WebField, WebSelect } from '@/components/web/fields'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader } from '@/components/web/page-header'
import { StatusDot, WebAvatar } from '@/components/web/status-badge'
import { ATTEMPTS, BANLIST, LINKED, TRACES, TRACE_LABEL, USTATUS_LABEL, type Attempt, type BanEntry, type LinkedGroup, type Trace } from '@/lib/data-admin'
import { EXTRA_ATTEMPTS, EXTRA_BANS, EXTRA_LINKED } from '@/lib/data-admin-53-e'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { useUserOverrides } from './a-users'
import { AdminPage, AdminTabs, CancelButton, Mono, Note, PeriodFilter, SideSheet, dt, inPeriod, useBagState } from './_parts'

type Tab = 'attempts' | 'linked' | 'banlist'

const TRACE_SHORT: Record<string, string> = { doc: 'Документ', name: 'Имя и дата рожд.', file: 'Файл', device: 'Устройство', email: 'Email' }

const ManualFlag = () => (
  <StatusDot tone="warning" className="text-[13px]">
    данные документа введены вручную
  </StatusDot>
)

export function ARegistrations({ go }: ScreenProps) {
  const [tab, setTab] = useBagState<Tab>('a.regTab', 'attempts')
  const [gone, setGone] = useBagState<string[]>('a.attemptsGone', [])
  const [groupState, setGroupState] = useBagState<Record<string, LinkedGroup['state']>>('a.linkedState', {})
  // сліди груп, забанених тут: потрапляють у бан-лист (ADR-087 п. 3)
  const [userOver, setUserOver] = useUserOverrides()
  const [groupBans, setGroupBans] = useBagState<Record<string, BanEntry[]>>('a.linkedBans', {})
  const attempts = [...ATTEMPTS, ...EXTRA_ATTEMPTS].filter((a) => !gone.includes(a.id))
  const groups = [...LINKED, ...EXTRA_LINKED].map((g) => ({ ...g, state: groupState[g.id] ?? g.state }))
  const open = groups.filter((g) => g.state === 'new')
  const banlist = [...Object.values(groupBans).flat(), ...BANLIST, ...EXTRA_BANS]

  const setGroup = (g: LinkedGroup, s: LinkedGroup['state'], reason?: string) => {
    setGroupState({ ...groupState, [g.id]: s })
    const entries: BanEntry[] =
      s === 'banned'
        ? g.accounts
            .filter((a) => a.status !== 'deleted')
            .flatMap((a, i) =>
              [...new Set<Trace>([...a.traces, 'email'])].map((t) => ({ id: `${g.id}-${i}-${t}`, trace: t, account: a.name, reason: reason ?? '', date: '2026-11-02', who: 'Команда Seafolio', tries: 0 })),
            )
            .filter((e) => !BANLIST.some((b) => b.account === e.account && b.trace === e.trace))
        : []
    setGroupBans({ ...groupBans, [g.id]: entries })
    // карточки користувачів (a-user) теж бачать бан групи
    const ids = g.accounts.filter((a) => a.userId && a.status === 'active').map((a) => a.userId!)
    if (ids.length) {
      const next = { ...userOver }
      for (const id of ids) next[id] = s === 'banned' ? { ...next[id], status: 'banned', reason: reason || 'Бан связанных аккаунтов' } : { ...next[id], status: 'active', reason: undefined }
      setUserOver(next)
    }
  }

  return (
    <AdminPage active="a-registrations" go={go}>
      <PageHeader
        title="Незавершённые регистрации и связанные аккаунты"
        description="Человека узнаём не по email, а по следам: документ моряка, имя с датой рождения, файл, устройство. Сам блокирует только документ из бан-листа, остальное решаете вы."
      />
      <AdminTabs<Tab>
        tabs={[
          { id: 'attempts', label: 'Незавершённые', count: attempts.length },
          { id: 'linked', label: 'Связанные аккаунты', count: open.length },
          { id: 'banlist', label: 'Бан-лист', count: banlist.length },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'attempts' && <Attempts rows={attempts} onDelete={(id) => setGone([...gone, id])} />}
      {tab === 'linked' && <Linked groups={groups} go={go} onState={setGroup} />}
      {tab === 'banlist' && <BanList rows={banlist} />}
    </AdminPage>
  )
}

function Attempts({ rows, onDelete }: { rows: Attempt[]; onDelete: (id: string) => void }) {
  const { showToast } = useProto()
  const [q, setQ] = useState('')
  const [path, setPath] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [del, setDel] = useState<Attempt | null>(null)
  const shown = rows.filter((a) => (!path || a.path === path) && inPeriod(a.started, from, to) && (!q || (a.email ?? '').includes(q.toLowerCase()) || (a.doc ?? '').toLowerCase().includes(q.toLowerCase())))
  const columns: Column<Attempt>[] = [
    {
      key: 'started',
      header: 'Начата',
      width: '22%',
      sortValue: (a) => a.started,
      cell: (a) => (
        <span className="flex flex-col leading-tight">
          <Mono>{dt(a.started)}</Mono>
          <span className="truncate text-sm text-muted-foreground">{a.email ?? 'email не указан'}</span>
        </span>
      ),
    },
    {
      key: 'step',
      header: 'Где остановился',
      width: '16%',
      sortValue: (a) => a.step,
      cell: (a) => (
        <span className="flex flex-col leading-tight">
          <span>{a.step}</span>
          <span className="text-sm text-muted-foreground">{a.path === 'quick' ? 'быстрая' : 'пошаговая'}</span>
        </span>
      ),
    },
    {
      key: 'doc',
      header: 'Документ',
      width: '21%',
      sortValue: (a) => a.doc ?? '',
      cell: (a) =>
        a.doc ? (
          <span className="flex flex-col gap-0.5 leading-tight">
            <span>{a.doc}</span>
            {a.manual && <ManualFlag />}
          </span>
        ) : (
          <span className="text-muted-foreground">не загружен</span>
        ),
    },
    { key: 'match', header: 'Совпадение', width: '19%', sortValue: (a) => a.match ?? '', cell: (a) => (a.match ? <span title={a.match}><StatusDot tone="error">{a.match}</StatusDot></span> : <span className="text-muted-foreground">нет</span>) },
    {
      key: 'left',
      header: 'Удалится',
      width: '11%',
      sortValue: (a) => a.daysLeft,
      cell: (a) => (
        <span className={cn('text-sm', a.daysLeft <= 3 ? 'text-warning' : 'text-muted-foreground')}>
          через <Mono>{a.daysLeft}</Mono> дн.
        </span>
      ),
    },
    {
      key: 'act',
      header: '',
      align: 'right',
      cell: (a) => (
        <button
          type="button"
          title="Удалить попытку и файлы сейчас"
          onClick={(e) => {
            e.stopPropagation()
            setDel(a)
          }}
          className="rounded-md px-1.5 py-1 text-sm font-medium text-primary hover:bg-muted"
        >
          Удалить
        </button>
      ),
    },
  ]
  return (
    <>
      <Note className="mb-4">Аккаунт не создан. Файлы и распознанные данные храним 30 дней, потом они удаляются сами — остаётся запись о попытке: дата и какой след совпал.</Note>
      <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Email или документ' }} onReset={path || from || to || q ? () => (setPath(''), setFrom(''), setTo(''), setQ('')) : undefined} count={shown.length}>
        <FilterSelect label="Путь" value={path} onChange={setPath} options={[{ value: 'quick', label: 'Быстрая' }, { value: 'stepper', label: 'Пошаговая' }]} />
        <PeriodFilter label="Начата" from={from} to={to} onChange={(a, b) => (setFrom(a), setTo(b))} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={shown}
        rowKey={(a) => a.id}
        initialSort={{ key: 'started', dir: 'desc' }}
        pageSizes={[10, 20, 50]}
        sortOptions={[
          { key: 'started', dir: 'desc', label: 'Начата: сначала новые' },
          { key: 'started', dir: 'asc', label: 'Начата: сначала старые' },
          { key: 'left', dir: 'asc', label: 'Удалится: сначала скоро' },
          { key: 'step', dir: 'asc', label: 'Шаг: А — Я' },
          { key: 'match', dir: 'desc', label: 'Совпадение: сначала с совпадением' },
        ]}
        empty={{ icon: UserX, title: 'Незавершённых регистраций нет', text: 'Здесь появятся те, кто начал регистрацию и не дошёл до конца.' }}
      />
      <WebDialog
        open={!!del}
        onClose={() => setDel(null)}
        title="Удалить попытку?"
        description="Файлы и распознанные данные удалятся сразу, не дожидаясь 30 дней. Останется только запись о попытке."
        footer={
          <>
            <CancelButton onClick={() => setDel(null)} />
            <Button
              variant="destructive"
              onClick={() => {
                if (del) onDelete(del.id)
                setDel(null)
                showToast('Попытка удалена вместе с файлами')
              }}
            >
              Удалить
            </Button>
          </>
        }
      />
    </>
  )
}

function Linked({ groups, go, onState }: { groups: LinkedGroup[]; go: (id: string) => void; onState: (g: LinkedGroup, s: LinkedGroup['state'], reason?: string) => void }) {
  const view = useView()
  const { showToast } = useProto()
  const [, setUser] = useBagState('a.user', 'u02')
  const [selId, setSelId] = useState(groups[0]?.id)
  const [ban, setBan] = useState(false)
  const [reason, setReason] = useState('')
  const sel = groups.find((g) => g.id === selId) ?? groups[0]

  const columns: Column<LinkedGroup>[] = [
    {
      key: 'acc',
      header: 'Аккаунты',
      width: '40%',
      sortValue: (g) => g.accounts[0]?.name ?? '',
      cell: (g) => (
        <span className="flex flex-col leading-tight">
          <span className="font-medium">
            <Mono>{g.accounts.length}</Mono> аккаунта
          </span>
          <span className="truncate text-sm text-muted-foreground">{g.accounts.map((a) => a.name).join(', ')}</span>
        </span>
      ),
    },
    {
      key: 'by',
      header: 'Совпало',
      width: '34%',
      cell: (g) => {
        const t = [...new Set(g.accounts.flatMap((a) => a.traces))].map((x) => TRACE_SHORT[x]).join(', ')
        return (
          <span title={t} className="line-clamp-2 text-sm leading-tight whitespace-normal text-muted-foreground">
            {t}
          </span>
        )
      },
    },
    { key: 'found', header: 'Найдено', hidden: true, sortValue: (g) => g.found, cell: (g) => dt(g.found) },
    { key: 'cnt', header: 'Число аккаунтов', hidden: true, sortValue: (g) => g.accounts.length, cell: (g) => g.accounts.length },
    {
      key: 'state',
      header: 'Решение',
      sortValue: (g) => g.state,
      cell: (g) => (g.state === 'new' ? <StatusDot tone="warning">ждёт</StatusDot> : g.state === 'banned' ? <StatusDot tone="error">бан</StatusDot> : <StatusDot tone="muted">разные</StatusDot>),
    },
  ]

  return (
    <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.3fr)] items-start gap-6">
      <DataTable
        columns={columns}
        rows={groups}
        rowKey={(g) => g.id}
        onRowClick={(g) => setSelId(g.id)}
        selectedKey={sel?.id}
        initialSort={{ key: 'found', dir: 'desc' }}
        pageSizes={[10, 20, 50]}
        sortOptions={[
          { key: 'found', dir: 'desc', label: 'Найдено: сначала новые' },
          { key: 'found', dir: 'asc', label: 'Найдено: сначала старые' },
          { key: 'cnt', dir: 'desc', label: 'Аккаунтов: сначала больше' },
          { key: 'state', dir: 'asc', label: 'Решение' },
        ]}
        empty={{ icon: Link2, title: 'Связанных аккаунтов нет', text: 'Если у двух аккаунтов совпадёт хотя бы один след, они появятся здесь.' }}
      />

      <section className="sticky top-4 rounded-xl border border-border bg-surface">
        {view === 'loading' ? (
          <LoadingState kind="table" rows={3} />
        ) : view === 'error' ? (
          <ErrorState />
        ) : view === 'empty' || !sel ? (
          <EmptyState icon={Link2} title="Выберите группу" text="Слева — аккаунты, у которых совпал хотя бы один след." />
        ) : (
          <>
            <div className="flex flex-col gap-1 border-b border-border px-6 py-4">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-base font-semibold">
                  Связанные аккаунты: <Mono>{sel.accounts.length}</Mono>
                </h2>
                <span className="text-sm text-muted-foreground">
                  найдено <Mono>{dt(sel.found)}</Mono>
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Тезки и проданный телефон дают ложные совпадения — решаете вы.</p>
            </div>
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col style={{ width: '42%' }} />
                {TRACES.map((t) => (
                  <col key={t} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="h-11 px-6 font-medium text-muted-foreground">
                    Аккаунт
                  </th>
                  {TRACES.map((t) => (
                    <th key={t} scope="col" className="h-11 px-1 text-center text-xs leading-tight font-medium text-muted-foreground">
                      {TRACE_LABEL[t]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sel.accounts.map((a, i) => (
                  <tr key={i} className={cn('border-t border-border first:border-t-0', a.userId && 'cursor-pointer hover:bg-muted')} onClick={a.userId ? () => (setUser(a.userId!), go('a-user')) : undefined}>
                    <td className="px-6 py-3 align-top">
                      <span className="flex items-start gap-3">
                        <WebAvatar initials={a.initials} size="sm" />
                        <span className="flex min-w-0 flex-col gap-0.5 leading-tight">
                          <span className="truncate font-medium">{a.name}</span>
                          <span className="truncate text-muted-foreground">{a.email}</span>
                          <span className={cn('text-xs', a.status === 'banned' || (sel.state === 'banned' && a.status !== 'deleted') ? 'text-signal' : 'text-muted-foreground')}>
                            {a.status === 'deleted' ? 'аккаунт удалён' : USTATUS_LABEL[sel.state === 'banned' ? 'banned' : a.status]}
                          </span>
                          {a.manual && <ManualFlag />}
                        </span>
                      </span>
                    </td>
                    {TRACES.map((t) => (
                      <td key={t} className="text-center align-middle">
                        {a.traces.includes(t) ? <span className="mx-auto block size-3 rounded-full bg-primary" aria-label="совпал" /> : <span className="mx-auto block h-px w-3 bg-border" aria-label="нет" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
              {sel.state === 'new' ? (
                <>
                  <span />
                  <span className="flex gap-2">
                    <Button variant="outline" onClick={() => (onState(sel, 'dismissed'), showToast('Отмечено: это разные люди'))}>
                      Это разные люди
                    </Button>
                    <Button variant="destructive" onClick={() => (setReason(''), setBan(true))}>
                      <Ban /> Забанить все связанные
                    </Button>
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">{sel.state === 'banned' ? 'Все аккаунты группы забанены, следы в бан-листе.' : 'Отмечено как разные люди. Новые совпадения появятся снова.'}</span>
                  <Button variant="outline" onClick={() => (onState(sel, 'new'), showToast('Группа снова ждёт решения, следы убраны из бан-листа'))}>
                    <ShieldOff /> Вернуть на решение
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </section>

      <SideSheet
        open={ban}
        onOpenChange={setBan}
        title={`Забанить ${sel?.accounts.length ?? 0} аккаунта?`}
        description="Следы всех аккаунтов группы уйдут в бан-лист: документы, имя с датой рождения, файлы, устройства и email. С ними больше не зарегистрироваться."
        footer={
          <>
            <CancelButton onClick={() => setBan(false)} />
            <Button
              variant="destructive"
              disabled={!reason}
              onClick={() => {
                if (sel) onState(sel, 'banned', reason)
                showToast(`Забанено аккаунтов: ${sel?.accounts.length ?? 0}`)
                setBan(false)
              }}
            >
              Забанить все
            </Button>
          </>
        }
      >
        <WebField id="lb-reason" label="Причина" required hint="Попадёт в бан-лист вместе со следами.">
          <WebSelect id="lb-reason" value={reason} onChange={setReason} options={['Один человек под разными аккаунтами', 'Обход бана', 'Чужие документы', 'Другое']} />
        </WebField>
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
          {sel?.accounts.map((a, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2.5">
              <WebAvatar initials={a.initials} size="sm" />
              <span className="flex-1 truncate text-[15px]">{a.name}</span>
              <span className="text-sm text-muted-foreground">{a.email}</span>
            </li>
          ))}
        </ul>
      </SideSheet>
    </div>
  )
}

function BanList({ rows: all }: { rows: BanEntry[] }) {
  const [trace, setTrace] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const rows = all.filter((b) => (!trace || b.trace === trace) && inPeriod(b.date, from, to))
  const columns: Column<BanEntry>[] = [
    { key: 'trace', header: 'След', width: '16%', sortValue: (b) => TRACE_LABEL[b.trace], cell: (b) => <span className="font-medium">{TRACE_LABEL[b.trace]}</span> },
    { key: 'acc', header: 'Аккаунт', width: '16%', sortValue: (b) => b.account, cell: (b) => b.account },
    { key: 'reason', header: 'Причина', width: '28%', sortValue: (b) => b.reason, cell: (b) => <span title={b.reason} className="text-muted-foreground">{b.reason}</span> },
    { key: 'date', header: 'Дата', width: '12%', mono: true, sortValue: (b) => b.date, cell: (b) => dt(b.date) },
    { key: 'who', header: 'Кто', width: '14%', sortValue: (b) => b.who, cell: (b) => b.who },
    { key: 'tries', header: 'Попыток после', width: '12%', align: 'right', sortValue: (b) => b.tries, cell: (b) => <Mono className={b.tries ? 'text-signal' : 'text-muted-foreground'}>{b.tries}</Mono> },
  ]
  return (
    <>
      <Note className="mb-4">Храним отпечатки, а не сами номера и имена. Бан-лист остаётся и после удаления аккаунта.</Note>
      <FilterBar onReset={trace || from || to ? () => (setTrace(''), setFrom(''), setTo('')) : undefined} count={rows.length}>
        <FilterSelect label="След" value={trace} onChange={setTrace} options={TRACES.map((t) => ({ value: t, label: TRACE_LABEL[t] }))} />
        <PeriodFilter label="Дата" from={from} to={to} onChange={(a, b) => (setFrom(a), setTo(b))} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(b) => b.id}
        initialSort={{ key: 'date', dir: 'desc' }}
        pageSizes={[10, 20, 50]}
        sortOptions={[
          { key: 'date', dir: 'desc', label: 'Дата: сначала новые' },
          { key: 'date', dir: 'asc', label: 'Дата: сначала старые' },
          { key: 'tries', dir: 'desc', label: 'Попыток после: сначала больше' },
          { key: 'trace', dir: 'asc', label: 'След: А — Я' },
          { key: 'acc', dir: 'asc', label: 'Аккаунт: А — Я' },
        ]}
        empty={{ icon: Ban, title: 'Бан-лист пуст', text: 'Здесь появятся следы забаненных аккаунтов.' }}
      />
    </>
  )
}
