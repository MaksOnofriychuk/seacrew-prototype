import { useState } from 'react'
import { Crown } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { DataTable, type Column } from '@/components/web/data-table'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader } from '@/components/web/page-header'
import { StatusDot, WebAvatar, type Tone } from '@/components/web/status-badge'
import {
  PREMIUM_PRICE,
  SUB_PLAN_LABEL,
  SUB_SOURCE_LABEL,
  SUB_STATE_LABEL,
  SUB_TOTALS,
  money,
  type Sub,
  type SubEvent,
  type SubPlan,
  type SubSource,
  type SubState,
} from '@/lib/data-admin-2'
import { ALL_SUBS, amountOptions } from '@/lib/data-admin-53-g'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { AdminPage, AdminTabs, Mono, PeriodFilter, dt, inPeriod, useBagState } from '../a/_parts'
import { Sample } from './_parts'

export const SUB_TONE: Record<SubState, Tone> = { active: 'success', trial: 'primary', ended: 'muted' }

type SubPatch = { until: string; state: SubState; events: SubEvent[] }

/** підписки з урахуванням ручних продовжень на a2-sub */
export function useSubs(): [Sub[], (id: string, p: SubPatch) => void] {
  const [over, setOver] = useBagState<Record<string, SubPatch>>('a2.subOver', {})
  const subs = ALL_SUBS.map((s) => (over[s.id] ? { ...s, until: over[s.id].until, state: over[s.id].state, history: [...s.history, ...over[s.id].events] } : s))
  return [subs, (id, p) => setOver({ ...over, [id]: p })]
}

type Tab = 'active' | 'trial' | 'ended' | 'all'

export function A2Subs({ go }: ScreenProps) {
  const [subs] = useSubs()
  const [, setSel] = useBagState('a2.sub', 's-104')
  const [tab, setTab] = useBagState<Tab>('a2.subsTab', 'active')
  const [q, setQ] = useState('')
  const [source, setSource] = useState('')
  const [plan, setPlan] = useState('')
  const [minPaid, setMinPaid] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const rows = subs
    .filter((s) => tab === 'all' || s.state === tab)
    .filter((s) => !source || s.source === source)
    .filter((s) => !plan || s.plan === plan)
    .filter((s) => !minPaid || s.paid >= Number(minPaid))
    .filter((s) => inPeriod(s.until, from, to))
    .filter((s) => !q || (s.name + s.position).toLowerCase().includes(q.toLowerCase()))

  const T = SUB_TOTALS
  const total = T.paying + T.trial + T.gift
  const parts = [
    { label: 'Платят', n: T.paying, cls: 'bg-primary' },
    { label: 'Пробная неделя', n: T.trial, cls: 'bg-primary/45' },
    { label: 'По коду и приглашению', n: T.gift, cls: 'bg-primary/20' },
  ]

  const columns: Column<Sub>[] = [
    {
      key: 'name',
      header: 'Моряк',
      width: '25%',
      sortValue: (s) => s.name,
      cell: (s) => (
        <span className="flex items-center gap-3">
          <WebAvatar initials={s.initials} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium">{s.name}</span>
            <span className="truncate text-sm text-muted-foreground">{s.position}</span>
          </span>
        </span>
      ),
    },
    { key: 'plan', header: 'Срок', width: '10%', sortValue: (s) => s.plan, cell: (s) => SUB_PLAN_LABEL[s.plan] },
    { key: 'src', header: 'Откуда', width: '15%', sortValue: (s) => s.source, cell: (s) => <span className="text-muted-foreground">{SUB_SOURCE_LABEL[s.source]}</span> },
    {
      key: 'until',
      header: 'До',
      width: '16%',
      sortValue: (s) => s.until,
      cell: (s) => (
        <span className="flex flex-col leading-tight">
          <Mono>{dt(s.until)}</Mono>
          <span className="text-sm text-muted-foreground">{s.state === 'ended' ? 'не продлена' : s.autoRenew ? 'продлится сама' : 'без автопродления'}</span>
        </span>
      ),
    },
    { key: 'paid', header: 'Оплачено', width: '12%', align: 'right', mono: true, sortValue: (s) => s.paid, cell: (s) => (s.paid ? money(s.paid) : <span className="text-muted-foreground">—</span>) },
    { key: 'state', header: 'Статус', sortValue: (s) => s.state, cell: (s) => <StatusDot tone={SUB_TONE[s.state]}>{SUB_STATE_LABEL[s.state]}</StatusDot> },
  ]

  return (
    <AdminPage active="a2-subs" go={go}>
      <PageHeader
        title="Подписки моряков"
        description="Премиум оплачивают в App Store, Google Play или картой на сайте. Отсюда можно продлить подписку вручную — например, если оплата прошла, а премиум не включился."
      />

      <ViewState loading={{ kind: 'cards', rows: 1, className: 'mb-8' }} empty={{ icon: Crown, title: 'Премиум ещё никто не купил', text: 'Подписки появятся после первой оплаты или пробной недели.' }}>
        <section className="mb-8 flex items-stretch gap-10 rounded-xl border border-border bg-surface px-8 py-6">
          <div className="flex w-[240px] shrink-0 flex-col gap-1">
            <span className="text-sm text-muted-foreground">Премиум сейчас у</span>
            <span className="font-mono text-[44px] leading-none font-semibold tracking-tight">{total}</span>
            <span className="text-[15px] text-muted-foreground">моряков</span>
            <span className="mt-auto flex flex-col items-start gap-1.5 pt-4 text-sm text-muted-foreground">
              <span>
                <Mono>{money(PREMIUM_PRICE.month)}</Mono> в месяц или <Mono>{money(PREMIUM_PRICE.year)}</Mono> в год
              </span>
              <Sample q="128" />
            </span>
          </div>
          <span className="w-px bg-border" aria-hidden="true" />
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex h-3 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={parts.map((p) => `${p.label}: ${p.n}`).join(', ')}>
                {parts.map((p) => (
                  <span key={p.label} className={cn('h-full first:rounded-l-full last:rounded-r-full', p.cls)} style={{ width: `${(p.n / total) * 100}%` }} />
                ))}
              </div>
              <ul className="flex flex-wrap gap-x-8 gap-y-2">
                {parts.map((p) => (
                  <li key={p.label} className="flex items-center gap-2 text-[15px]">
                    <span className={cn('size-2.5 rounded-sm', p.cls)} aria-hidden="true" />
                    {p.label} <Mono className="text-muted-foreground">{p.n}</Mono>
                  </li>
                ))}
              </ul>
            </div>
            <p className="border-t border-border pt-4 text-[15px] text-muted-foreground">
              За 30 дней премиум закончился у <Mono className="text-foreground">{T.endedMonth}</Mono> моряков. После уведомления продлили{' '}
              <Mono className="text-foreground">{T.returned}</Mono>.
            </p>
          </div>
        </section>
      </ViewState>

      <AdminTabs<Tab>
        tabs={[
          { id: 'active', label: 'Активные', count: subs.filter((s) => s.state === 'active').length },
          { id: 'trial', label: 'Пробные', count: subs.filter((s) => s.state === 'trial').length },
          { id: 'ended', label: 'Закончились', count: subs.filter((s) => s.state === 'ended').length },
          { id: 'all', label: 'Все', count: subs.length },
        ]}
        value={tab}
        onChange={setTab}
      />
      <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Имя или должность' }} onReset={source || plan || minPaid || from || to ? () => (setSource(''), setPlan(''), setMinPaid(''), setFrom(''), setTo('')) : undefined} count={rows.length}>
        <FilterSelect label="Откуда" value={source} onChange={setSource} options={(Object.keys(SUB_SOURCE_LABEL) as SubSource[]).map((k) => ({ value: k, label: SUB_SOURCE_LABEL[k] }))} />
        <FilterSelect label="Срок" value={plan} onChange={setPlan} options={(Object.keys(SUB_PLAN_LABEL) as SubPlan[]).map((k) => ({ value: k, label: SUB_PLAN_LABEL[k] }))} />
        <FilterSelect label="Оплачено" value={minPaid} onChange={setMinPaid} options={amountOptions} allLabel="Любая" />
        <PeriodFilter label="Действует до" from={from} to={to} onChange={(a, b) => (setFrom(a), setTo(b))} future />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(s) => s.id}
        onRowClick={(s) => {
          setSel(s.id)
          go('a2-sub')
        }}
        initialSort={{ key: 'until', dir: 'asc' }}
        pageSizes={[10, 20, 50]}
        sortOptions={[
          { key: 'until', dir: 'asc', label: 'Действует до: сначала ближайшие' },
          { key: 'until', dir: 'desc', label: 'Действует до: сначала дальние' },
          { key: 'name', dir: 'asc', label: 'Имя: А — Я' },
          { key: 'paid', dir: 'desc', label: 'Оплачено: сначала больше' },
          { key: 'paid', dir: 'asc', label: 'Оплачено: сначала меньше' },
          { key: 'state', dir: 'asc', label: 'Статус' },
        ]}
        empty={
          q || source || plan || minPaid || from || to
            ? { icon: Crown, title: 'Никого не нашли', text: 'Проверьте имя или сбросьте фильтр.' }
            : tab === 'ended'
              ? { icon: Crown, title: 'Закончившихся подписок нет', text: 'Здесь будут моряки, которые не продлили премиум.' }
              : { icon: Crown, title: 'Подписок нет', text: 'Подписки появятся после первой оплаты или пробной недели.' }
        }
      />
    </AdminPage>
  )
}
