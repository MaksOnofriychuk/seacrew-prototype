import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { WebCheckbox } from '@/components/web/fields'
import { WebDatePick } from '@/components/web/web-pickers'
import { TODAY, addYears, isoToRu, ruToIso, parseDate } from '@/lib/dates'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Option } from './fields'

// Рядок фільтрів над таблицею: пошук, списки-фільтри (children), «Сбросить», праворуч — кількість знайденого.
export function FilterBar({
  search,
  children,
  onReset,
  count,
  className,
}: {
  search?: { value: string; onChange: (v: string) => void; placeholder?: string }
  children?: ReactNode
  /** показати «Сбросить», коли щось вибрано */
  onReset?: () => void
  /** «Найдено: N» праворуч */
  count?: number
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-center gap-2', className)}>
      {search && (
        <label className="flex h-10 w-[280px] items-center gap-2 rounded-md border border-border bg-surface px-3 focus-within:border-primary">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? 'Поиск'}
            aria-label={search.placeholder ?? 'Поиск'}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {search.value && (
            <button type="button" aria-label="Очистить" onClick={() => search.onChange('')} className="text-muted-foreground">
              <X className="size-4" />
            </button>
          )}
        </label>
      )}
      {children}
      {onReset && (
        <button type="button" onClick={onReset} className="h-10 px-2 text-sm font-medium text-primary">
          Сбросить
        </button>
      )}
      {count !== undefined && (
        <span className="ml-auto text-sm text-muted-foreground">
          Найдено: <span className="font-mono">{count}</span>
        </span>
      )}
    </div>
  )
}

const ALL = '__all'

// Фільтр-список: «Флот: Все». value '' — без фільтра.
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = 'Все',
  className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Option[]
  allLabel?: string
  className?: string
}) {
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
      <SelectTrigger aria-label={label} className={cn('h-10 data-[size=default]:h-10 bg-surface', value && 'border-primary', className)}>
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value
          return (
            <SelectItem key={v} value={v}>
              {typeof o === 'string' ? o : o.label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

const PERIOD_MIN = new Date(2026, 0, 1)

/** Период «с … по»: даты только выбором. «По» не раньше «с», обе не позже сегодня (правило 2). */
export function PeriodFilter({ from, to, onChange, label = 'Период', future = false }: { from: string; to: string; onChange: (from: string, to: string) => void; label?: string; future?: boolean }) {
  const top = future ? addYears(TODAY, 1) : TODAY
  const f = parseDate(isoToRu(from))
  const t = parseDate(isoToRu(to))
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <span className="text-sm text-muted-foreground">{label}:</span>
      <WebDatePick value={isoToRu(from)} onChange={(v) => onChange(ruToIso(v), to && ruToIso(v) > to ? '' : to)} min={PERIOD_MIN} max={t ?? top} clearable placeholder="С" className="w-[150px]" />
      <span className="text-muted-foreground">—</span>
      <WebDatePick value={isoToRu(to)} onChange={(v) => onChange(from, ruToIso(v))} min={f ?? PERIOD_MIN} max={top} clearable placeholder="По" className="w-[150px]" />
    </div>
  )
}

/** Попадает ли дата (ISO, можно со временем) в период. */
export const inPeriod = (iso: string, from: string, to: string) => {
  const d = iso.slice(0, 10)
  return (!from || d >= from) && (!to || d <= to)
}


/** Фильтр с несколькими значениями: выбранные плашки «×» и список с галочками (правило 8). */
export function MultiFilter({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])
  return (
    <div ref={ref} className="relative">
      <div
        className={cn('flex min-h-10 min-w-[200px] cursor-pointer flex-wrap items-center gap-1.5 rounded-md border bg-surface py-1 pr-2 pl-3', value.length ? 'border-primary' : 'border-border')}
        onClick={() => setOpen(!open)}
        role="button"
        aria-expanded={open}
        aria-label={label}
      >
        <span className="text-sm text-muted-foreground">{label}:</span>
        {value.length === 0 && <span className="text-sm">Все</span>}
        {value.map((v) => (
          <span key={v} className="flex h-6 items-center gap-1 rounded-full bg-muted pr-1 pl-2.5 text-xs font-medium">
            {v}
            <button type="button" aria-label={`Убрать ${v}`} onClick={(e) => (e.stopPropagation(), toggle(v))} className="flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-border">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <ChevronDown className="ml-auto size-4 text-muted-foreground" />
      </div>
      {open && (
        <div className="absolute left-0 z-40 mt-1 w-full min-w-[220px] rounded-lg border border-border bg-surface p-1 shadow-lg animate-in fade-in-0 duration-150">
          {options.map((o, i) => (
            <WebCheckbox key={o} id={`mf-${label}-${i}`} checked={value.includes(o)} onChange={() => toggle(o)} className="h-9 rounded-md px-2 hover:bg-muted">
              {o}
            </WebCheckbox>
          ))}
        </div>
      )}
    </div>
  )
}

