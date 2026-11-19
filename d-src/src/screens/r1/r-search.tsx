import { useEffect, useState } from 'react'
import { WebDatePick, WebMultiSelect } from '@/components/web/web-pickers'
import { useProto } from '@/lib/proto-state'
import { ChevronDown, SearchX } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { usePrefs } from '@/components/web/web-prefs'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { AvailabilityDot, WebAvatar } from '@/components/web/status-badge'
import { addDays, isoToRu, parseDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { departmentsFor, FLEETS, positionsFor } from '@/lib/data'
import { SEAFARERS, type WebSeafarer } from '@/lib/data-web'
import { AIRPORT_OPTIONS, AVAIL_FILTER, CERT_OPTIONS, EXP_OPTIONS, monthsText, VISA_OPTIONS } from '@/lib/data-recruiter-1'
import { CURRENCIES, EDUCATION_OPTIONS, GENDER_OPTIONS, LANGUAGE_OPTIONS, LEVELS, levelRank, RESIDENCE_OPTIONS, salaryMonthly, searchProfile, type TechLevel } from '@/lib/data-search-profile'
import type { ScreenProps } from '../types'
import { IncompleteMark, useSelected } from './_parts'
import { NumField } from './_search-fields'
import { TechFilter } from './_tech-filter'

// r-search — пошук моряків (правка №30; фільтри: флот → департамент → посада за №2, №25; відповіді 108, 136, 142).
// Рекрутер бачить «Andrii K.» — без прізвища, фото й контактів; аватар — лише ініціали.

type Filters = {
  q: string; fleet: string[]; department: string; position: string[]; exp: string; cert: string[]; avail: string; visa: string; airport: string
  /** «Готов с даты»: дата посадки (ДД.ММ.ГГГГ) и окно ± дней */
  boardDate: string; window: string
  age: string; residence: string; nationality: string; gender: string; dwt: string; gt: string
  salary: string; currency: string; period: string; english: string; lang: string; langLevel: string; edu: string
  tech: Record<string, TechLevel>
}
const NONE: Filters = {
  q: '', fleet: [], department: '', position: [], exp: '', cert: [], avail: '', visa: '', airport: '',
  boardDate: '', window: '7',
  age: '', residence: '', nationality: '', gender: '', dwt: '', gt: '',
  salary: '', currency: 'USD', period: 'month', english: '', lang: '', langLevel: 'B1', edu: '', tech: {},
}
const NATIONALITIES = [...new Set(SEAFARERS.map((s) => s.nationality))].sort((a, b) => a.localeCompare(b, 'ru'))
// Сколько «ещё» фильтров включено (для кнопки «Ещё фильтры»).
const extraCount = (f: Filters) => [f.age, f.residence, f.nationality, f.gender, f.dwt, f.gt, f.salary, f.english, f.lang, f.edu].filter(Boolean).length + Object.keys(f.tech).length

function match(s: WebSeafarer, f: Filters) {
  const q = f.q.trim().toLowerCase()
  if (q && !`${s.name} ${s.position} ${s.nationality}`.toLowerCase().includes(q)) return false
  if (f.fleet.length && !f.fleet.includes(s.fleet)) return false
  if (f.department && s.department !== f.department) return false
  if (f.position.length && !f.position.includes(s.position)) return false
  const p = searchProfile(s.id)
  if (f.exp && p.rankMonths < Number(f.exp)) return false
  if (f.cert.length && !f.cert.every((c) => s.certificates.includes(c))) return false
  if (f.avail && s.availability.kind !== f.avail) return false
  const board = f.avail === 'from' ? parseDate(f.boardDate) : null
  if (board) {
    const d = parseDate(isoToRu(s.availability.date ?? ''))
    const w = Number(f.window) || 0
    if (!d || d < addDays(board, -w) || d > addDays(board, w)) return false
  }
  if (f.visa && !s.visas.includes(f.visa)) return false
  if (f.airport && s.airport !== f.airport) return false
  if (f.age && p.age > Number(f.age)) return false
  if (f.residence && p.residence !== f.residence) return false
  if (f.nationality && s.nationality !== f.nationality) return false
  if (f.gender && p.gender !== f.gender) return false
  if (f.dwt && p.dwt < Number(f.dwt)) return false
  if (f.gt && p.gt < Number(f.gt)) return false
  if (f.salary && salaryMonthly(p.salary) < salaryMonthly({ amount: Number(f.salary), currency: f.currency, period: f.period as 'month' | 'day' })) return false
  if (f.english && levelRank(s.englishLevel) < levelRank(f.english)) return false
  if (f.lang && !p.languages.some((x) => x.lang === f.lang && levelRank(x.level) >= levelRank(f.langLevel))) return false
  if (f.edu && p.education !== f.edu) return false
  if (Object.entries(f.tech).some(([item, min]) => (p.tech[item] ?? 0) < min)) return false
  return true
}

export function RSearch({ go }: ScreenProps) {
  const { prefs } = usePrefs()
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
  const anyFilter = JSON.stringify(f) !== JSON.stringify({ ...NONE, q: f.q }) || !!f.q
  const [more, setMore] = useState(false)
  const extra = extraCount(f)

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
      width: '27%',
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
      header: 'Опыт в должности',
      width: '12%',
      sortValue: (s) => searchProfile(s.id).rankMonths,
      cell: (s) => <MonoNums text={monthsText(searchProfile(s.id).rankMonths)} />,
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
        <FilterSelect label="Опыт в должности" value={f.exp} onChange={(exp) => set({ exp })} options={EXP_OPTIONS} allLabel="Любой" />
        <WebMultiSelect label="Сертификат" className="w-[340px]" values={f.cert} options={CERT_OPTIONS} placeholder="Любой" searchPlaceholder="Найти сертификат" onChange={(cert) => set({ cert })} />
        <FilterSelect label="Готовность" value={f.avail} onChange={(avail) => set({ avail, ...(avail === 'from' ? {} : { boardDate: '' }) })} options={AVAIL_FILTER} allLabel="Любая" />
        {f.avail === 'from' && (
          <>
            <WebDatePick value={f.boardDate} onChange={(boardDate) => set({ boardDate })} clearable placeholder="Дата посадки" className="w-[170px]" />
            <NumField label="±" value={f.window} onChange={(window) => set({ window })} suffix="дн." placeholder="0" className="w-[112px]" />
          </>
        )}
        <FilterSelect label="Виза" value={f.visa} onChange={(visa) => set({ visa })} options={VISA_OPTIONS} allLabel="Любая" />
        <FilterSelect label="Аэропорт" value={f.airport} onChange={(airport) => set({ airport })} options={AIRPORT_OPTIONS} allLabel="Любой" />
        <button
          type="button"
          aria-expanded={more}
          onClick={() => setMore(!more)}
          className={cn('flex h-10 items-center gap-2 rounded-md border bg-surface px-3 text-sm font-medium', extra ? 'border-primary' : 'border-input')}
        >
          Ещё фильтры
          {extra > 0 && <span className="font-mono text-primary">{extra}</span>}
          <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none', more && 'rotate-180')} />
        </button>
      </FilterBar>
      {more && (
        <div className="mb-4 flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <NumField label="Возраст до" value={f.age} onChange={(age) => set({ age })} suffix="лет" placeholder="65" className="w-[190px]" />
            <button
              type="button"
              aria-pressed={!f.age}
              onClick={() => set({ age: '' })}
              className={cn('h-10 rounded-md border px-3 text-sm', !f.age ? 'border-primary bg-muted font-medium' : 'border-input bg-surface text-muted-foreground')}
            >
              Неограниченно
            </button>
            <FilterSelect label="Место проживания" value={f.residence} onChange={(residence) => set({ residence })} options={RESIDENCE_OPTIONS} allLabel="Любое" />
            <FilterSelect label="Национальность" value={f.nationality} onChange={(nationality) => set({ nationality })} options={NATIONALITIES} allLabel="Любая" />
            <FilterSelect label="Пол" value={f.gender} onChange={(gender) => set({ gender })} options={GENDER_OPTIONS} allLabel="Любой" />
            <FilterSelect label="Образование" value={f.edu} onChange={(edu) => set({ edu })} options={EDUCATION_OPTIONS} allLabel="Любое" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NumField label="DWT от" value={f.dwt} onChange={(dwt) => set({ dwt })} suffix="т" className="w-[170px]" />
            <NumField label="GT от" value={f.gt} onChange={(gt) => set({ gt })} suffix="т" className="w-[160px]" />
            <NumField label="Зарплата от" value={f.salary} onChange={(salary) => set({ salary })} className="w-[200px]" />
            <FilterSelect label="Валюта" value={f.currency === 'USD' ? '' : f.currency} onChange={(currency) => set({ currency: currency || 'USD' })} options={CURRENCIES.slice(1)} allLabel="USD" />
            <FilterSelect label="За" value={f.period === 'month' ? '' : f.period} onChange={(period) => set({ period: period || 'month' })} options={[{ value: 'day', label: 'день' }]} allLabel="месяц" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect label="Английский" value={f.english} onChange={(english) => set({ english })} options={LEVELS.map((l) => ({ value: l, label: `от ${l}` }))} allLabel="Любой" />
            <FilterSelect label="Другой язык" value={f.lang} onChange={(lang) => set({ lang })} options={LANGUAGE_OPTIONS} allLabel="Не важно" />
            {f.lang && <FilterSelect label="Уровень" value={f.langLevel === 'B1' ? '' : f.langLevel} onChange={(langLevel) => set({ langLevel: langLevel || 'B1' })} options={LEVELS.slice(2).map((l) => ({ value: l, label: `от ${l}` }))} allLabel="от B1" />}
          </div>
          <TechFilter value={f.tech} onChange={(tech) => set({ tech })} />
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(s) => s.id}
        onRowClick={open}
        initialSort={{ key: 'avail', dir: 'asc' }}
        pageSizes={[10, 20, 50]}
        pageSize={Number(prefs.rows)}
        sortOptions={[
          { key: 'avail', dir: 'asc', label: 'Готовность: сначала готовые' },
          { key: 'exp', dir: 'desc', label: 'Опыт в должности: сначала больше' },
          { key: 'exp', dir: 'asc', label: 'Опыт в должности: сначала меньше' },
          { key: 'name', dir: 'asc', label: 'Имя: А — Я' },
          { key: 'position', dir: 'asc', label: 'Должность: А — Я' },
        ]}
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
