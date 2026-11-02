import { useState } from 'react'
import { Ban, Link2, ShieldOff, UserX } from 'lucide-react'
import { EmptyState, ErrorState, LoadingState, useView } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebSelect } from '@/components/web/fields'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { StatusDot, WebAvatar } from '@/components/web/status-badge'
import { ATTEMPTS, BANLIST, LINKED, TRACES, TRACE_LABEL, USTATUS_LABEL, type Attempt, type BanEntry, type LinkedGroup, type Trace } from '@/lib/data-admin'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { useUserOverrides } from './a-users'
import { AdminPage, CancelButton, Mono, Note, SideSheet, dt, useBagState } from './_parts'

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
  const attempts = ATTEMPTS.filter((a) => !gone.includes(a.id))
  const groups = LINKED.map((g) => ({ ...g, state: groupState[g.id] ?? g.state }))
  const open = groups.filter((g) => g.state === 'new')
  const banlist = [...Object.values(groupBans).flat(), ...BANLIST]

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
      <PageTabs<Tab>
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
  const columns: Column<Attempt>[] = [
    {
      key: 'started',
      header: 'Начата',
      width: '18%',
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
      width: '17%',
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
      width: '25%',
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
    { key: 'match', header: 'Совпадение', width: '18%', cell: (a) => (a.match ? <StatusDot tone="error">{a.match}</StatusDot> : <span className="text-muted-foreground">нет</span>) },
    {
      key: 'left',
      header: 'Удалится',
      width: '12%',
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
            onDelete(a.id)
            showToast('Попытка удалена вместе с файлами')
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
      <DataTable columns={columns} rows={rows} rowKey={(a) => a.id} initialSort={{ key: 'started', dir: 'desc' }} empty={{ icon: UserX, title: 'Незавершённых регистраций нет', text: 'Здесь появятся те, кто начал регистрацию и не дошёл до конца.' }} />
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
      width: '46%',
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
      width: '30%',
      cell: (g) => (
        <span className="flex flex-col text-sm leading-tight whitespace-normal text-muted-foreground">
          {[...new Set(g.accounts.flatMap((a) => a.traces))].map((t) => (
            <span key={t}>{TRACE_SHORT[t]}</span>
          ))}
        </span>
      ),
    },
    {
      key: 'state',
      header: 'Решение',
      cell: (g) => (g.state === 'new' ? <StatusDot tone="warning">ждёт</StatusDot> : g.state === 'banned' ? <StatusDot tone="error">бан</StatusDot> : <StatusDot tone="muted">разные</StatusDot>),
    },
  ]

  return (
    <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.3fr)] items-start gap-6">
      <DataTable columns={columns} rows={groups} rowKey={(g) => g.id} onRowClick={(g) => setSelId(g.id)} selectedKey={sel?.id} empty={{ icon: Link2, title: 'Связанных аккаунтов нет', text: 'Если у двух аккаунтов совпадёт хотя бы один след, они появятся здесь.' }} />

      <section className="rounded-xl border border-border bg-surface">
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
        <WebField id="lb-reason" label="Причина" required>
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

function BanList({ rows }: { rows: BanEntry[] }) {
  const columns: Column<BanEntry>[] = [
    { key: 'trace', header: 'След', width: '18%', cell: (b) => <span className="font-medium">{TRACE_LABEL[b.trace]}</span> },
    { key: 'acc', header: 'Аккаунт', width: '16%', cell: (b) => b.account },
    { key: 'reason', header: 'Причина', width: '28%', cell: (b) => <span className="text-muted-foreground">{b.reason}</span> },
    { key: 'date', header: 'Дата', width: '12%', mono: true, sortValue: (b) => b.date, cell: (b) => dt(b.date) },
    { key: 'who', header: 'Кто', width: '14%', cell: (b) => b.who },
    { key: 'tries', header: 'Попыток после', width: '12%', align: 'right', sortValue: (b) => b.tries, cell: (b) => <Mono className={b.tries ? 'text-signal' : 'text-muted-foreground'}>{b.tries}</Mono> },
  ]
  return (
    <>
      <Note className="mb-4">Храним отпечатки, а не сами номера и имена. Бан-лист остаётся и после удаления аккаунта.</Note>
      <DataTable columns={columns} rows={rows} rowKey={(b) => b.id} empty={{ icon: Ban, title: 'Бан-лист пуст', text: 'Здесь появятся следы забаненных аккаунтов.' }} />
    </>
  )
}
