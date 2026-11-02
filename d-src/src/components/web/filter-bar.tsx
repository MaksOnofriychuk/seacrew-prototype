import type { ReactNode } from 'react'
import { Search, X } from 'lucide-react'
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
      <SelectTrigger aria-label={label} className={cn('h-10 bg-surface', value && 'border-primary', className)}>
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
