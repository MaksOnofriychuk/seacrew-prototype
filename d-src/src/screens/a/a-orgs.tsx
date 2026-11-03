import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { DataTable, type Column } from '@/components/web/data-table'
import { FilterBar, FilterSelect, PeriodFilter, inPeriod } from '@/components/web/filter-bar'
import { PageHeader } from '@/components/web/page-header'
import { OrgStatusDot } from '@/components/web/status-badge'
import { ADMIN_ORGS, type AdminOrg, type OrgStatus } from '@/lib/data-web'
import { EXTRA_ORGS, orgDetail53 } from '@/lib/data-admin-53-e'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { VERIFY_REQS } from '@/lib/data-admin-2'
import { AdminPage, AdminTabs, dt, useBagState } from './_parts'

type Tab = 'pending' | 'verified' | 'all'

/** статуси, змінені на a-org (Подтвердить / Отклонить / Заблокировать) */
export function useOrgStatuses() {
  return useBagState<Record<string, OrgStatus>>('a.orgStatus', {})
}

export function AOrgs({ go }: ScreenProps) {
  const [over] = useOrgStatuses()
  const [, setSel] = useBagState('a.org', 'org-mc')
  const [, setVerifySel] = useBagState('a2.verifySel', '')
  const { bag, setBag } = useProto()
  // Запрос из поиска в шапке: показываем среди всех организаций.
  const shellQ = bag<string>('shell.q', '')
  const [tab, setTab] = useState<Tab>(shellQ ? 'all' : 'pending')
  const [q, setQ] = useState(shellQ)
  useEffect(() => {
    if (!shellQ) return
    setQ(shellQ)
    setTab('all')
    setBag('shell.q', '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shellQ])
  const orgs = [...ADMIN_ORGS, ...EXTRA_ORGS].map((o) => ({ ...o, status: over[o.id] ?? o.status }))
  const pending = orgs.filter((o) => o.status === 'pending')
  const [country, setCountry] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const countries = [...new Set(orgs.map((o) => o.country))].sort((a, b) => a.localeCompare(b, 'ru'))
  const rows = orgs
    .filter((o) => !country || o.country === country)
    .filter((o) => inPeriod(o.created, from, to))
    .filter((o) => (tab === 'pending' ? o.status === 'pending' : tab === 'verified' ? o.status === 'verified' : true))
    .filter((o) => !q || o.name.toLowerCase().includes(q.toLowerCase()))

  const open = (o: AdminOrg) => {
    setSel(o.id)
    go('a-org')
  }
  // заявка на проверку разбирается в одном месте — на «Верификации»
  const check = (o: AdminOrg) => {
    const req = VERIFY_REQS.find((r) => r.orgId === o.id && r.state === 'pending')
    if (!req) return open(o)
    setVerifySel(req.id)
    go('a2-verify')
  }

  const columns: Column<AdminOrg>[] = [
    {
      key: 'name',
      header: 'Организация',
      width: '30%',
      sortValue: (o) => o.name,
      cell: (o) => (
        <span className="flex flex-col leading-tight">
          <span className="truncate font-medium">{o.name}</span>
          <span className="text-sm text-muted-foreground">{o.country}</span>
        </span>
      ),
    },
    { key: 'country', header: 'Страна', hidden: true, sortValue: (o) => o.country, cell: (o) => o.country },
    { key: 'owner', header: 'Владелец', width: '24%', sortValue: (o) => orgDetail53(o.id).owner.email, cell: (o) => <span title={orgDetail53(o.id).owner.email} className="text-muted-foreground">{orgDetail53(o.id).owner.email}</span> },
    { key: 'members', header: 'Участники', width: '10%', align: 'right', mono: true, sortValue: (o) => o.members, cell: (o) => o.members },
    { key: 'created', header: 'Регистрация', width: '12%', mono: true, sortValue: (o) => o.created, cell: (o) => dt(o.created) },
    { key: 'status', header: 'Статус', width: '14%', sortValue: (o) => o.status, cell: (o) => <OrgStatusDot s={o.status} /> },
    {
      key: 'act',
      header: '',
      width: '10%',
      align: 'right',
      cell: (o) => (o.status === 'pending' ? <span className="text-sm font-medium text-primary">Проверить</span> : null),
    },
  ]

  return (
    <AdminPage active="a-orgs" go={go}>
      <PageHeader
        title="Организации"
        description="Рекрутеры регистрируются сами. Приглашать моряков организация может только после вашей проверки — остальной кабинет работает и без неё."
      />
      <AdminTabs<Tab>
        tabs={[
          { id: 'pending', label: 'Ждут проверки', count: pending.length },
          { id: 'verified', label: 'Проверенные', count: orgs.filter((o) => o.status === 'verified').length },
          { id: 'all', label: 'Все', count: orgs.length },
        ]}
        value={tab}
        onChange={setTab}
      />
      <FilterBar
        search={{ value: q, onChange: setQ, placeholder: 'Название организации' }}
        onReset={country || from || to || q ? () => (setCountry(''), setFrom(''), setTo(''), setQ('')) : undefined}
        count={rows.length}
      >
        <FilterSelect label="Страна" value={country} onChange={setCountry} options={countries} />
        <PeriodFilter label="Регистрация" from={from} to={to} onChange={(a, b) => (setFrom(a), setTo(b))} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(o) => o.id}
        onRowClick={(o) => (o.status === 'pending' ? check(o) : open(o))}
        initialSort={{ key: 'created', dir: 'desc' }}
        pageSizes={[10, 20, 50]}
        sortOptions={[
          { key: 'created', dir: 'desc', label: 'Регистрация: сначала новые' },
          { key: 'created', dir: 'asc', label: 'Регистрация: сначала старые' },
          { key: 'name', dir: 'asc', label: 'Название: А — Я' },
          { key: 'members', dir: 'desc', label: 'Участники: сначала больше' },
          { key: 'status', dir: 'asc', label: 'Статус' },
          { key: 'country', dir: 'asc', label: 'Страна: А — Я' },
        ]}
        empty={
          tab === 'pending' && !q
            ? { icon: Building2, title: 'Новых заявок нет', text: 'Когда агентство зарегистрируется, оно появится здесь.' }
            : { icon: Building2, title: 'Ничего не нашлось', text: 'Проверьте название или откройте вкладку «Все».' }
        }
      />
    </AdminPage>
  )
}
