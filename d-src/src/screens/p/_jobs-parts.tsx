import type { ReactNode } from 'react'
import { Check, Lock } from 'lucide-react'
import { FleetPicker } from '@/components/app/fleet-picker'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { departmentsFor, positionsFor } from '@/lib/data'
import { FILTER_EMPTY, FJ_JOBS, isClosed, JOB_META, REGIONS, SORTS, type Currency, type JobFilter, type SortId } from '@/lib/data-feed-jobs'
import { cn } from '@/lib/utils'
import { Dateish } from '../g02-guest-jobs'
import { AppSheet, plural, SaveButton } from './_app-parts'

// Етап 4: картка вакансії (відповідь 95), фільтри (правка №35, відповідь 100), сортування (відповідь 94),
// автоназва підборки (відповідь 103). Спільне для p05, p08, p09, p13, p17.

/* ---------- зарплата й дати ---------- */

const num = (s: string) => Number(s.replace(/[^\d]/g, '')) || 0

// '$4 200–4 600 / мес' → 4200 на місяць; '$170 / день' → 170 × 30; 'Договорная' → null.
export function salaryPerMonth(sal: string): number | null {
  const m = sal.match(/[\d\s]+/)
  if (!m || !num(m[0])) return null
  return /день/.test(sal) ? num(m[0]) * 30 : num(m[0])
}

const boardTime = (v: string) => {
  const m = v.match(/(\d{2})\.(\d{2})\.(\d{4})/)
  return m ? new Date(+m[3], +m[2] - 1, +m[1]).getTime() : 0 // «как можно скорее» — першою
}

const money = (n: number) => n.toLocaleString('ru-RU').replace(/ /g, ' ')

/* ---------- фільтр ---------- */

export function matches(k: number, f: JobFilter) {
  const j = FJ_JOBS[k]
  const m = JOB_META[k]
  const { fleets, department, positions } = f.fleet
  if (fleets.length && !fleets.includes(m.fleet)) return false
  if (department && department !== m.dep) return false
  if (positions.length && !positions.includes(j.t)) return false
  if (f.regions.length && !f.regions.includes(m.region)) return false
  if (num(f.salary)) {
    const pm = salaryPerMonth(j.sal)
    if (pm === null) {
      if (!f.nego) return false
    } else if ((f.per === 'day' ? pm / 30 : pm) < num(f.salary)) return false
  }
  if (num(f.dur) && m.weeks > num(f.dur) * (f.durUnit === 'month' ? 4.35 : 1)) return false
  return true
}

/** Відкриті вакансії під фільтр, у вибраному порядку. */
export function jobList(f: JobFilter, sort: SortId, needle = '') {
  const q = needle.trim().toLowerCase()
  return FJ_JOBS.map((_, k) => k)
    .filter((k) => !isClosed(k) && matches(k, f))
    .filter((k) => !q || [FJ_JOBS[k].t, FJ_JOBS[k].ship, FJ_JOBS[k].co].some((s) => s.toLowerCase().includes(q)))
    .sort((a, b) => {
      if (sort === 'salary') return (salaryPerMonth(FJ_JOBS[b].sal) ?? -1) - (salaryPerMonth(FJ_JOBS[a].sal) ?? -1)
      if (sort === 'board') return boardTime(FJ_JOBS[a].board) - boardTime(FJ_JOBS[b].board)
      return a - b
    })
}

export const salaryText = (f: JobFilter) => (num(f.salary) ? `от ${f.cur}${money(num(f.salary))} / ${f.per === 'month' ? 'мес' : 'день'}` : '')
export const durFilterText = (f: JobFilter) => (num(f.dur) ? `контракт до ${num(f.dur)} ${f.durUnit === 'month' ? 'мес' : plural(num(f.dur), 'недели', 'недель', 'недель')}` : '')

// Чіпи над списком: кожен прибирає свою частину фільтра.
export function filterChips(f: JobFilter): { key: string; label: string; off: () => JobFilter }[] {
  const { fleets, department, positions } = f.fleet
  const withFleets = (next: string[]) => {
    const dep = department && departmentsFor(next).includes(department) ? department : null
    const allowed = positionsFor(next, dep)
    return { ...f, fleet: { fleets: next, department: dep, positions: positions.filter((p) => allowed.includes(p)) } }
  }
  return [
    ...fleets.map((x) => ({ key: 'fl' + x, label: x, off: () => withFleets(fleets.filter((y) => y !== x)) })),
    ...(department && !positions.length ? [{ key: 'dep', label: department, off: () => ({ ...f, fleet: { ...f.fleet, department: null, positions: [] } }) }] : []),
    ...positions.map((x) => ({ key: 'po' + x, label: x, off: () => ({ ...f, fleet: { ...f.fleet, positions: positions.filter((y) => y !== x) } }) })),
    ...(salaryText(f) ? [{ key: 'sal', label: salaryText(f), off: () => ({ ...f, salary: '' }) }] : []),
    ...f.regions.map((x) => ({ key: 're' + x, label: x, off: () => ({ ...f, regions: f.regions.filter((y) => y !== x) }) })),
    ...(durFilterText(f) ? [{ key: 'dur', label: durFilterText(f), off: () => ({ ...f, dur: '' }) }] : []),
  ]
}

// Автоназва підборки (відповідь 103): посади (або департамент, або флот), зарплата, регіони.
export function searchName(f: JobFilter) {
  const { fleets, department, positions } = f.fleet
  const who = positions.length ? positions : department ? [department] : fleets
  const parts = [...who, salaryText(f), ...f.regions].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Все вакансии'
}

export const searchDetails = (f: JobFilter) => [f.fleet.fleets.join(', '), durFilterText(f)].filter(Boolean).join('; ')

export const sameFilter = (a: JobFilter, b: JobFilter) => JSON.stringify(a) === JSON.stringify(b)

export const sortLabel = (s: SortId) => SORTS.find((x) => x[0] === s)![1]

/* ---------- картка вакансії (відповідь 95) ---------- */

// Лише: должность, тип судна, длительность контракта, посадка, ЗП. Закрита — сіра, з поміткою (відповідь 106).
export function JobCard({ k, saved, onSave, onOpen }: { k: number; saved: boolean; onSave: () => void; onOpen: () => void }) {
  const j = FJ_JOBS[k]
  const closed = isClosed(k)
  return (
    <li className="flex gap-3 border-t border-border py-4 pr-3 pl-5 first:border-t-0">
      <button type="button" onClick={onOpen} className={cn('flex min-w-0 flex-1 flex-col gap-1 text-left', closed && 'text-muted-foreground')}>
        <span className="text-[17px] font-semibold">{j.t}</span>
        <span className={cn('text-[15px] font-semibold', closed ? 'text-muted-foreground' : 'text-primary')}>{j.sal}</span>
        <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
          <span>{j.ship}</span>
          <span>
            контракт <MonoLike v={j.dur} />
          </span>
          <span>
            посадка <Dateish v={j.board} />
          </span>
        </span>
        {closed && (
          <span className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Lock className="size-3.5" /> Вакансия закрыта
          </span>
        )}
      </button>
      <SaveButton on={saved} onClick={onSave} className="self-start" />
    </li>
  )
}

// «4 ±1 мес» — цифри моноширинним, слова звичайним.
function MonoLike({ v }: { v: string }) {
  return (
    <>
      {v.split(/(\d[\d\s±]*\d|\d)/).map((part, i) => (i % 2 ? <span key={i} className="font-mono">{part}</span> : part))}
    </>
  )
}

/* ---------- дрібні елементи керування ---------- */

export function Segmented<T extends string>({ label, value, options, onChange, mono, className }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void; mono?: boolean; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex h-11 gap-1 rounded-md border border-border bg-surface p-1', className)}>
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn(
            'flex-1 rounded-[6px] px-2 text-[15px] font-medium transition-colors duration-150',
            mono && 'font-mono',
            value === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function NumField({ label, prefix, value, onChange, placeholder, className }: { label: string; prefix: string; value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={cn('flex h-11 items-center gap-2 rounded-md border border-input bg-surface px-3 focus-within:border-primary', className)}>
      <span className="text-[15px] text-muted-foreground">{prefix}</span>
      <input
        inputMode="numeric"
        aria-label={label}
        value={value ? money(num(value)) : ''}
        onChange={(e) => onChange(String(num(e.target.value) || ''))}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent font-mono text-base outline-none placeholder:font-sans placeholder:text-muted-foreground"
      />
    </label>
  )
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 flex items-baseline gap-2 text-sm font-medium">
        {title}
        {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
      </legend>
      {children}
    </fieldset>
  )
}

/* ---------- вікно «Фильтры» (правка №35) ---------- */

// Тип флоту (кілька), департамент (один), посада (кілька) — FleetPicker; зарплата вручну + валюта + за день / за місяць;
// регіон роботи; тривалість контракту в місяцях або тижнях. «Тип судна» і «Посадка» прибрано, «По типу» не малюємо.
export function FiltersSheet({ open, f, onChange, onClose }: { open: boolean; f: JobFilter; onChange: (f: JobFilter) => void; onClose: () => void }) {
  const n = jobList(f, 'new').length
  const set = (patch: Partial<JobFilter>) => onChange({ ...f, ...patch })
  return (
    <AppSheet
      open={open}
      onClose={onClose}
      title="Фильтры"
      description="Сначала подставлены из вашего профиля."
      aside={
        <button type="button" className="text-[15px] font-medium text-primary" onClick={() => onChange(FILTER_EMPTY)}>
          Сбросить
        </button>
      }
      footer={
        <Button size="lg" onClick={onClose}>
          {n ? (
            <>
              Показать <span className="font-mono">{n}</span> {plural(n, 'вакансию', 'вакансии', 'вакансий')}
            </>
          ) : (
            'Нет вакансий с такими фильтрами'
          )}
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <FleetPicker value={f.fleet} onChange={(fleet) => set({ fleet })} multiFleet multiPosition labels={{ fleet: 'Тип флота' }} />

        <Group title="Зарплата">
          <div className="flex gap-2">
            <NumField label="Зарплата от" prefix="от" value={f.salary} onChange={(salary) => set({ salary })} placeholder="любая" className="flex-1" />
            <Segmented<Currency> label="Валюта" value={f.cur} onChange={(cur) => set({ cur })} options={[['$', '$'], ['€', '€'], ['£', '£']]} mono className="w-[132px]" />
          </div>
          <Segmented
            label="Период оплаты"
            value={f.per}
            onChange={(per) => set({ per })}
            options={[
              ['month', 'за месяц'],
              ['day', 'за день'],
            ]}
          />
          <label className="mt-1 flex items-center gap-3 py-1 text-[15px]">
            <Checkbox checked={f.nego} onCheckedChange={(v) => set({ nego: v === true })} className="size-5" />
            Показывать вакансии с договорной зарплатой
          </label>
        </Group>

        <Group title="Регион работы" hint="можно несколько">
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => {
              const on = f.regions.includes(r)
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ regions: on ? f.regions.filter((x) => x !== r) : [...f.regions, r] })}
                  className={cn(
                    'flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors active:scale-[0.98]',
                    on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground',
                  )}
                >
                  {on && <Check className="size-4" strokeWidth={2.5} />}
                  {r}
                </button>
              )
            })}
          </div>
        </Group>

        <Group title="Длительность контракта">
          <div className="flex gap-2">
            <NumField label="Длительность контракта, не больше" prefix="до" value={f.dur} onChange={(dur) => set({ dur })} placeholder="любая" className="w-36" />
            <Segmented
              label="Единица"
              value={f.durUnit}
              onChange={(durUnit) => set({ durUnit })}
              options={[
                ['month', 'месяцев'],
                ['week', 'недель'],
              ]}
              className="flex-1"
            />
          </div>
        </Group>
      </div>
    </AppSheet>
  )
}

/* ---------- вікно «Сортировка» (відповідь 94) ---------- */

export function SortSheet({ open, value, onChange, onClose }: { open: boolean; value: SortId; onChange: (s: SortId) => void; onClose: () => void }) {
  return (
    <AppSheet open={open} onClose={onClose} title="Сортировка">
      <ul role="radiogroup" aria-label="Сортировка" className="-mt-2 flex flex-col pb-2">
        {SORTS.map(([id, label]) => (
          <li key={id} className="border-t border-border first:border-t-0">
            <button
              type="button"
              role="radio"
              aria-checked={value === id}
              onClick={() => {
                onChange(id)
                onClose()
              }}
              className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-base"
            >
              <span className={cn(value === id && 'font-semibold')}>{label}</span>
              {value === id && <Check className="size-5 text-primary" />}
            </button>
          </li>
        ))}
      </ul>
    </AppSheet>
  )
}
