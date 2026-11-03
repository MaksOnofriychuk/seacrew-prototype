import { useState } from 'react'
import { Coins } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { DataTable, type Column } from '@/components/web/data-table'
import { FilterBar } from '@/components/web/filter-bar'
import { WebSelect } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { BUDGET, DAILY_COST, PHOTOS, USAGE, type Period, type UsageRow } from '@/lib/data-admin'
import { EARLIER_COST } from '@/lib/data-admin-53-h'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { AdminPage, AdminTabs, Mono, PeriodFilter, useBagState } from './_parts'

const usd = (n: number) => '$' + n.toFixed(2).replace('.', ',')
const kfmt = (n: number) => (n >= 1_000_000 ? (n / 1_000_000).toFixed(1).replace('.', ',') + ' млн' : n >= 1000 ? Math.round(n / 1000) + ' тыс.' : String(n))

// Витрати по днях: один ряд, стовпчики від нуля з округленим верхом, підказка на наведенні, лінія денного бюджету.
function DailyBars() {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(BUDGET.daily * 0.5, ...DAILY_COST.map((d) => d.usd))
  const H = 120
  return (
    <figure className="flex min-w-0 flex-1 flex-col gap-2">
      <figcaption className="text-sm text-muted-foreground">Расходы по дням, последние 14 дней</figcaption>
      <div className="relative flex items-end gap-[2px]" style={{ height: H }} onMouseLeave={() => setHover(null)}>
        {DAILY_COST.map((d, i) => (
          <button
            type="button"
            key={d.day}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            aria-label={`${d.day.split('-').reverse().join('.')}: ${usd(d.usd)}`}
            className="group flex h-full flex-1 items-end"
          >
            <span
              className={cn('w-full rounded-t-[4px] transition-colors', i === DAILY_COST.length - 1 ? 'bg-primary' : 'bg-primary/35', hover === i && 'bg-primary')}
              style={{ height: Math.max(2, (d.usd / max) * H) }}
            />
          </button>
        ))}
        {hover !== null && (
          <span
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm whitespace-nowrap"
            style={{ left: `${((hover + 0.5) / DAILY_COST.length) * 100}%` }}
          >
            <Mono className="text-muted-foreground">{DAILY_COST[hover].day.split('-').reverse().join('.')}</Mono> <Mono>{usd(DAILY_COST[hover].usd)}</Mono>
          </span>
        )}
      </div>
      <div className="flex justify-between border-t border-border pt-1.5 text-xs text-muted-foreground">
        <Mono>{DAILY_COST[0].day.split('-').reverse().join('.')}</Mono>
        <span>сегодня</span>
      </div>
    </figure>
  )
}

type DayRow = { day: string; usd: number }
const ALL_DAYS: DayRow[] = [...EARLIER_COST, ...DAILY_COST]
const dayRu = (d: string) => d.split('-').reverse().join('.') + '.2026'

// Розхід по днях: довгий список — з пагінацією й сортуванням; бюджет дня і частка від нього.
function DaysTable() {
  const [q, setQ] = useState('')
  const rows = ALL_DAYS.filter((d) => !q.trim() || dayRu(d.day).includes(q.trim()))
  const cols: Column<DayRow>[] = [
    { key: 'day', header: 'День', width: '22%', mono: true, sortValue: (d) => d.day, cell: (d) => dayRu(d.day) },
    { key: 'usd', header: 'Потрачено', width: '18%', align: 'right', mono: true, sortValue: (d) => d.usd, cell: (d) => usd(d.usd) },
    {
      key: 'pct',
      header: 'От дневного бюджета',
      width: '30%',
      sortValue: (d) => d.usd,
      cell: (d) => {
        const p = Math.min(100, (d.usd / BUDGET.daily) * 100)
        return (
          <span className="flex items-center gap-3">
            <span className="h-1.5 w-32 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <span className={cn('block h-full rounded-full', p > 90 ? 'bg-signal' : p > 70 ? 'bg-warning' : 'bg-primary')} style={{ width: `${p}%` }} />
            </span>
            <Mono>{Math.round((d.usd / BUDGET.daily) * 100)} %</Mono>
          </span>
        )
      },
    },
    { key: 'note', header: 'Заметка', cell: (d) => (d.usd / BUDGET.daily >= 0.8 ? <span className="text-warning">письмо о бюджете</span> : <span className="text-muted-foreground">—</span>) },
  ]
  return (
    <>
      <FilterBar search={{ value: q, onChange: setQ, placeholder: 'День, например 28.10' }} onReset={q ? () => setQ('') : undefined} count={rows.length} />
      <DataTable
        columns={cols}
        rows={rows}
        rowKey={(d) => d.day}
        initialSort={{ key: 'day', dir: 'desc' }}
        pageSizes={[10, 20, 50]}
        sortOptions={[
          { key: 'day', dir: 'desc', label: 'День: сначала новые' },
          { key: 'day', dir: 'asc', label: 'День: сначала старые' },
          { key: 'usd', dir: 'desc', label: 'Расход: сначала больше' },
          { key: 'usd', dir: 'asc', label: 'Расход: сначала меньше' },
        ]}
        empty={{ icon: Coins, title: 'Такого дня нет', text: 'Измените запрос.' }}
      />
    </>
  )
}

export function AUsage({ go }: ScreenProps) {
  const [tab, setTab] = useState<'engines' | 'days'>('engines')
  const [period, setPeriod] = useBagState<Period | 'custom'>('a.usagePeriod', 'today')
  const [from, setFrom] = useBagState('a.usageFrom', '')
  const [to, setTo] = useBagState('a.usageTo', '')
  // свой период: берём месяц и пропорционально тому, сколько потрачено в выбранные дни
  const monthSum = DAILY_COST.reduce((n, d) => n + d.usd, 0)
  const rangeSum = DAILY_COST.filter((d) => (!from || '2026-' + d.day >= from) && (!to || '2026-' + d.day <= to)).reduce((n, d) => n + d.usd, 0)
  const k = period === 'custom' ? rangeSum / monthSum : 1
  const scale = (r: UsageRow): UsageRow => ({ ...r, runs: Math.round(r.runs * k), ok: Math.round(r.ok * k), failed: Math.round(r.failed * k), running: 0, tokensIn: Math.round(r.tokensIn * k), tokensOut: Math.round(r.tokensOut * k), cost: r.cost * k })
  const rows = period === 'custom' ? USAGE.month.map(scale) : USAGE[period]
  const photos = period === 'custom' ? { sent: Math.round(PHOTOS.month.sent * k), atLimit: Math.round(PHOTOS.month.atLimit * k) } : PHOTOS[period]
  const pct = Math.min(100, (BUDGET.spentToday / BUDGET.daily) * 100)

  const columns: Column<UsageRow>[] = [
    { key: 'label', header: 'Движок', width: '15%', sortValue: (r) => r.label, cell: (r) => <span className="font-medium">{r.label}</span> },
    { key: 'runs', header: 'Запуски', width: '9%', align: 'right', mono: true, sortValue: (r) => r.runs, cell: (r) => r.runs.toLocaleString('ru') },
    {
      key: 'out',
      header: 'Успех / ошибка / идёт',
      width: '18%',
      align: 'right',
      sortValue: (r) => r.failed,
      cell: (r) => (
        <Mono>
          {r.ok.toLocaleString('ru')} <span className="text-muted-foreground">/</span> <span className={r.failed ? 'text-signal' : ''}>{r.failed}</span> <span className="text-muted-foreground">/</span> {r.running}
        </Mono>
      ),
    },
    { key: 'fail', header: 'Ошибки по типам', width: '21%', cell: (r) => <span className="text-muted-foreground" title={r.failures}>{r.failures}</span> },
    { key: 'tok', header: 'Токены', width: '15%', align: 'right', sortValue: (r) => r.tokensIn, cell: (r) => <span className="text-sm" title="вход / выход">{kfmt(r.tokensIn)} / {kfmt(r.tokensOut)}</span> },
    { key: 'cost', header: 'Стоимость', width: '11%', align: 'right', sortValue: (r) => r.cost, cell: (r) => (r.tier === 'free' ? <span className="text-muted-foreground">бесплатно</span> : <Mono>{usd(r.cost)}</Mono>) },
    { key: 'time', header: 'Время', align: 'right', sortValue: (r) => r.avgSec, cell: (r) => (
        <span className={r.avgSec > 60 ? 'text-warning' : ''}>
          <Mono>{r.avgSec.toString().replace('.', ',')}</Mono> с
        </span>
      ) },
  ]

  return (
    <AdminPage active="a-usage" go={go}>
      <PageHeader title="Расходы ИИ" description="Сколько стоили движки распознавания и сколько фото им отправили. Суммы — по нашим данным, из ответов провайдеров." />

      <ViewState loading={{ kind: 'cards', rows: 1 }} empty={{ icon: Coins, title: 'Расходов пока нет', text: 'Цифры появятся после первого распознавания.' }}>
        <section className="mb-8 flex items-stretch gap-10 rounded-xl border border-border bg-surface px-8 py-6">
          <div className="flex w-[300px] shrink-0 flex-col justify-between gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Потрачено сегодня</span>
              <span className="font-mono text-[44px] leading-none font-semibold tracking-tight">{usd(BUDGET.spentToday)}</span>
              <span className="text-[15px] text-muted-foreground">
                из дневного бюджета <Mono>{usd(BUDGET.daily)}</Mono>
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Дневной бюджет">
                <span className={cn('block h-full rounded-full', pct > 90 ? 'bg-signal' : pct > 70 ? 'bg-warning' : 'bg-primary')} style={{ width: `${pct}%` }} />
              </span>
              <span className="text-sm text-muted-foreground">
                <Mono>{Math.round(pct)} %</Mono> бюджета, при <Mono>80 %</Mono> придёт письмо
              </span>
            </div>
          </div>
          <span className="w-px bg-border" aria-hidden="true" />
          <DailyBars />
        </section>
      </ViewState>

      <AdminTabs<'engines' | 'days'> tabs={[{ id: 'engines', label: 'По движкам', count: rows.length }, { id: 'days', label: 'По дням', count: ALL_DAYS.length }]} value={tab} onChange={setTab} />
      {tab === 'days' && <DaysTable />}
      {tab === 'engines' && (
        <>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Период:</span>
          <WebSelect
            value={period}
            onChange={(v) => setPeriod(v as Period | 'custom')}
            options={[{ value: 'today', label: 'Сегодня' }, { value: 'week', label: '7 дней' }, { value: 'month', label: 'Этот месяц' }, { value: 'custom', label: 'Свой период' }]}
            className="w-44"
          />
          {period === 'custom' && <PeriodFilter label="Даты" from={from} to={to} onChange={(a, b) => (setFrom(a), setTo(b))} />}
        </div>
        <p className="mb-4 text-[15px]">
          Фото отправлено движкам: <Mono>{photos.sent.toLocaleString('ru')}</Mono>
          <span className="text-muted-foreground">
            {' '}
            — лимиты: <Mono>30</Mono> на аккаунт, <Mono>10</Mono> на запрос. Все фото потратили аккаунтов: <Mono>{photos.atLimit}</Mono>
          </span>
        </p>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          initialSort={{ key: 'runs', dir: 'desc' }}
          sortOptions={[
            { key: 'runs', dir: 'desc', label: 'Запуски: сначала больше' },
            { key: 'cost', dir: 'desc', label: 'Стоимость: сначала дороже' },
            { key: 'out', dir: 'desc', label: 'Ошибки: сначала больше' },
            { key: 'time', dir: 'desc', label: 'Время: сначала дольше' },
            { key: 'label', dir: 'asc', label: 'Движок: А — Я' },
          ]}
          empty={{ icon: Coins, title: 'За этот период запусков нет', text: 'Выберите другой период.' }} />
        </>
      )}
    </AdminPage>
  )
}
