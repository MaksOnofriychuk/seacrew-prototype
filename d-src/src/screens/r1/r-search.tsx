import { useEffect, useState } from 'react'
import { WebMultiSelect } from '@/components/web/web-pickers'
import { useProto } from '@/lib/proto-state'
import { SearchX } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { AvailabilityDot, WebAvatar } from '@/components/web/status-badge'
import { departmentsFor, FLEETS, positionsFor } from '@/lib/data'
import { SEAFARERS, type WebSeafarer } from '@/lib/data-web'
import { AIRPORT_OPTIONS, AVAIL_FILTER, CERT_OPTIONS, EXP_OPTIONS, expForFilter, monthsText, VISA_OPTIONS } from '@/lib/data-recruiter-1'
import type { ScreenProps } from '../types'
import { IncompleteMark, useSelected } from './_parts'

// r-search — пошук моряків (правка №30; фільтри: флот → департамент → посада за №2, №25; відповіді 108, 136, 142).
// Рекрутер бачить «Andrii K.» — без прізвища, фото й контактів; аватар — лише ініціали.

type Filters = { q: string; fleet: string[]; department: string; position: string[]; exp: string; cert: string[]; avail: string; visa: string; airport: string }
const NONE: Filters = { q: '', fleet: [], department: '', position: [], exp: '', cert: [], avail: '', visa: '', airport: '' }

function match(s: WebSeafarer, f: Filters) {
  const q = f.q.trim().toLowerCase()
  if (q && !`${s.name} ${s.position} ${s.nationality}`.toLowerCase().includes(q)) return false
  if (f.fleet.length && !f.fleet.includes(s.fleet)) return false
  if (f.department && s.department !== f.department) return false
  if (f.position.length && !f.position.includes(s.position)) return false
  if (f.exp && expForFilter(s) < Number(f.exp)) return false
  if (f.cert.length && !f.cert.every((c) => s.certificates.includes(c))) return false
  if (f.avail && s.availability.kind !== f.avail) return false
  if (f.visa && !s.visas.includes(f.visa)) return false
  if (f.airport && s.airport !== f.airport) return false
  return true
}

export function RSearch({ go }: ScreenProps) {
  // Поиск из верхней строки кабинета (Enter) приходит сюда готовым запросом.
  const { bag, setBag } = useProto()
  const [f, setF] = useState<Filters>(() => ({ ...NONE, q: bag<string>('shell.q', '') }))
  // Если экран уже открыт, новый запрос из шапки тоже применяется.
  const shellQ = bag<string>('shell.q', '')
  useEffect(() => {
    if (!shellQ) return
    setF((s) => ({ ...s, q: shellQ }))
    setBag('shell.q', '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shellQ])
  const [, select] = useSelected('r1.seafarer', 'sf01')
  const set = (patch: Partial<Filters>) => setF((s) => ({ ...s, ...patch }))
  const rows = SEAFARERS.filter((s) => match(s, f))
  const anyFilter = Object.values(f).some((v) => (Array.isArray(v) ? v.length > 0 : !!v))

  // Кожен наступний список — лише під вибране в попередньому.
  const fleets = f.fleet.length ? f.fleet : FLEETS
  const departments = departmentsFor(fleets)
  const positions = positionsFor(fleets, f.department || null)

  const open = (s: WebSeafarer) => {
    select(s.id)
    go('r-seafarer')
  }

  const columns: Column<WebSeafarer>[] = [
    {
      key: 'name',
      header: 'Моряк',
      width: '29%',
      sortValue: (s) => s.name,
      cell: (s) => (
        <span className="flex items-center gap-3">
          <WebAvatar initials={s.initials} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium">{s.name}</span>
            <span className="flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
              <span className="truncate">{s.nationality}</span>
              <IncompleteMark id={s.id} className="px-1.5 py-0 text-[11px]" />
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'position',
      header: 'Должность',
      width: '21%',
      sortValue: (s) => s.position,
      cell: (s) => (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate">{s.position}</span>
          <span className="truncate text-[13px] text-muted-foreground">
            {s.fleet}, {s.department}
          </span>
        </span>
      ),
    },
    {
      key: 'exp',
      header: 'Опыт',
      width: '9%',
      sortValue: (s) => expForFilter(s),
      cell: (s) => (s.experienceMonths === null ? <span className="text-muted-foreground">по контрактам</span> : <MonoNums text={monthsText(s.experienceMonths)} />),
    },
    { key: 'avail', header: 'Готовность', width: '15%', sortValue: (s) => ({ now: 0, from: 1, not: 2 })[s.availability.kind] * 1e9 + Number((s.availability.date ?? '').replace(/-/g, '')), cell: (s) => <AvailabilityDot a={s.availability} short /> },
    { key: 'visas', header: 'Визы', width: '13%', cell: (s) => (s.visas.length ? s.visas.join(', ') : <span className="text-muted-foreground">нет</span>) },
    { key: 'airport', header: 'Аэропорт', width: '13%', sortValue: (s) => s.airport, cell: (s) => s.airport },
  ]

  return (
    <WebShell variant="recruiter" active="r-search" go={go}>
      <PageHeader title="Поиск моряков" description="Имя, должность, документы и готовность к контракту. Фамилию, контакты и фото моряки не показывают." />

      <FilterBar search={{ value: f.q, onChange: (q) => set({ q }), placeholder: 'Имя, должность, гражданство' }} className="mb-2 items-start">
        <WebMultiSelect
          label="Флот"
          className="w-[330px]"
          values={f.fleet}
          options={[...FLEETS]}
          onChange={(fleet) => {
            const deps = departmentsFor(fleet.length ? fleet : FLEETS)
            const department = deps.includes(f.department) ? f.department : ''
            const allowed = department ? positionsFor(fleet.length ? fleet : FLEETS, department) : []
            set({ fleet, department, position: f.position.filter((p) => allowed.includes(p)) })
          }}
        />
        <FilterSelect label="Департамент" value={f.department} onChange={(department) => set({ department, position: [] })} options={departments} />
        <WebMultiSelect
          label="Должность"
          className="w-[300px]"
          values={f.position}
          options={positions}
          searchPlaceholder="Найти должность"
          disabled={!f.department}
          disabledHint="Сначала выберите департамент"
          onChange={(position) => set({ position })}
        />
      </FilterBar>
      <FilterBar onReset={anyFilter ? () => setF(NONE) : undefined} count={rows.length}>
        <FilterSelect label="Опыт" value={f.exp} onChange={(exp) => set({ exp })} options={EXP_OPTIONS} allLabel="Любой" />
        <WebMultiSelect label="Сертификат" className="w-[340px]" values={f.cert} options={CERT_OPTIONS} placeholder="Любой" searchPlaceholder="Найти сертификат" onChange={(cert) => set({ cert })} />
        <FilterSelect label="Готовность" value={f.avail} onChange={(avail) => set({ avail })} options={AVAIL_FILTER} allLabel="Любая" />
        <FilterSelect label="Виза" value={f.visa} onChange={(visa) => set({ visa })} options={VISA_OPTIONS} allLabel="Любая" />
        <FilterSelect label="Аэропорт" value={f.airport} onChange={(airport) => set({ airport })} options={AIRPORT_OPTIONS} allLabel="Любой" />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(s) => s.id}
        onRowClick={open}
        initialSort={{ key: 'avail', dir: 'asc' }}
        empty={{
          icon: SearchX,
          title: anyFilter ? 'Никого не нашли' : 'Моряков пока нет',
          text: anyFilter ? 'Уберите часть фильтров — например, аэропорт или визу.' : 'Моряки появятся здесь, когда заполнят профиль.',
          action: anyFilter ? (
            <Button variant="outline" className="text-primary" onClick={() => setF(NONE)}>
              Сбросить фильтры
            </Button>
          ) : undefined,
        }}
      />
    </WebShell>
  )
}
