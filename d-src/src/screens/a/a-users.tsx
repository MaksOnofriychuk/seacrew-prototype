import { useState } from 'react'
import { Users } from 'lucide-react'
import { DataTable, type Column } from '@/components/web/data-table'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader } from '@/components/web/page-header'
import { StatusDot, WebAvatar, type Tone } from '@/components/web/status-badge'
import { A_USERS, USTATUS_LABEL, type AUser, type UStatus } from '@/lib/data-admin'
import type { ScreenProps } from '../types'
import { AdminPage, AdminTabs, Mono, PeriodFilter, dt, inPeriod, useBagState } from './_parts'

export const USTATUS_TONE: Record<UStatus, Tone> = { active: 'success', blocked: 'error', banned: 'error' }

/** зміни з a-user: розблоковано (лічильник 0) або забанено */
export function useUserOverrides() {
  return useBagState<Record<string, Partial<Pick<AUser, 'status' | 'wrongDocs' | 'reason'>>>>('a.userOver', {})
}

export function useUsers() {
  const [over] = useUserOverrides()
  return A_USERS.map((u) => ({ ...u, ...over[u.id] }))
}

type Tab = 'all' | 'blocked'

export function AUsers({ go }: ScreenProps) {
  const users = useUsers()
  const [, setSel] = useBagState('a.user', 'u02')
  const [tab, setTab] = useState<Tab>('blocked')
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [st, setSt] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const blocked = users.filter((u) => u.status !== 'active')
  const rows = (tab === 'blocked' ? blocked : users)
    .filter((u) => !role || u.role === role)
    .filter((u) => !st || u.status === st)
    .filter((u) => inPeriod(u.created, from, to))
    .filter((u) => !q || (u.name + u.email).toLowerCase().includes(q.toLowerCase()))

  const columns: Column<AUser>[] = [
    {
      key: 'name',
      header: 'Пользователь',
      width: '26%',
      sortValue: (u) => u.name,
      cell: (u) => (
        <span className="flex items-center gap-3">
          <WebAvatar initials={u.initials} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium">{u.name}</span>
            <span className="truncate text-sm text-muted-foreground">{u.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Кто',
      width: '18%',
      sortValue: (u) => u.role,
      cell: (u) => (
        <span className="flex flex-col leading-tight">
          <span>{u.role === 'seafarer' ? 'Моряк' : 'Рекрутер'}</span>
          <span className="truncate text-sm text-muted-foreground">{u.role === 'seafarer' ? u.position : u.org}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      width: '30%',
      sortValue: (u) => u.status,
      cell: (u) => (
        <span className="flex flex-col gap-0.5 leading-tight">
          <StatusDot tone={USTATUS_TONE[u.status]}>{USTATUS_LABEL[u.status]}</StatusDot>
          {u.status !== 'active' && u.reason && <span className="truncate pl-4 text-sm text-muted-foreground">{u.reason}</span>}
        </span>
      ),
    },
    {
      key: 'wrong',
      header: 'Ошибки',
      width: '10%',
      align: 'right',
      sortValue: (u) => u.wrongDocs,
      cell: (u) =>
        u.role === 'recruiter' ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <Mono className={u.wrongDocs >= 2 ? 'text-signal' : u.wrongDocs === 1 ? 'text-warning' : 'text-muted-foreground'}>{u.wrongDocs} из 2</Mono>
        ),
    },
    { key: 'created', header: 'Регистрация', width: '16%', mono: true, sortValue: (u) => u.created, cell: (u) => dt(u.created) },
  ]

  return (
    <AdminPage active="a-users" go={go}>
      <PageHeader
        title="Пользователи"
        description="Моряка блокирует сама система, если он дважды подряд загрузил не документ моряка. Разблокировать можно после обращения в поддержку — счётчик ошибок обнулится."
      />
      <AdminTabs<Tab>
        tabs={[
          { id: 'blocked', label: 'Заблокированные', count: blocked.length },
          { id: 'all', label: 'Все', count: users.length },
        ]}
        value={tab}
        onChange={setTab}
      />
      <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Имя или email' }} onReset={role || st || from || to || q ? () => (setRole(''), setSt(''), setFrom(''), setTo(''), setQ('')) : undefined} count={rows.length}>
        <FilterSelect label="Кто" value={role} onChange={setRole} options={[{ value: 'seafarer', label: 'Моряки' }, { value: 'recruiter', label: 'Рекрутеры' }]} />
        {tab === 'all' && <FilterSelect label="Статус" value={st} onChange={setSt} options={(Object.keys(USTATUS_LABEL) as UStatus[]).map((k) => ({ value: k, label: USTATUS_LABEL[k] }))} />}
        <PeriodFilter label="Регистрация" from={from} to={to} onChange={(a, b) => (setFrom(a), setTo(b))} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(u) => u.id}
        onRowClick={(u) => (setSel(u.id), go('a-user'))}
        empty={tab === 'blocked' && !q && !role ? { icon: Users, title: 'Заблокированных нет', text: 'Если моряк дважды подряд загрузит не тот документ, он появится здесь.' } : { icon: Users, title: 'Никого не нашли', text: 'Проверьте имя или сбросьте фильтры.' }}
      />
    </AdminPage>
  )
}
