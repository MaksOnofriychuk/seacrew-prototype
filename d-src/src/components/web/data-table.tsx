import { useEffect, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState, ErrorState, LoadingState, useView, type EmptyProps } from '@/components/app/states'
import { cn } from '@/lib/utils'

// Таблиця вебу в білому блоці. Сама реагує на «Состояние экрана» з панелі: загрузка — скелет рядків,
// пусто — порожній стан (empty), ошибка — помилка з повтором. ignoreView — показувати рядки завжди.

export type Column<T> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** значення для сортування; без нього колонка не сортується */
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right'
  /** ширина колонки, напр. '160px' або '20%' */
  width?: string
  /** цифри й дати — моноширинним */
  mono?: boolean
  /** не показувати колонку, але дати її для сортування (пункти списку «Сортировать») */
  hidden?: boolean
}

type Sort = { key: string; dir: 'asc' | 'desc' } | null

/** пункт списку «Сортировать: …»; key — ключ колонки з sortValue */
export type SortOption = { key: string; dir: 'asc' | 'desc'; label: string }

/** номери сторінок зі «…»: 1 … 4 5 6 … 12 */
function pageList(cur: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const set = new Set([0, total - 1, cur - 1, cur, cur + 1])
  const out: (number | '…')[] = []
  let prev = -1
  for (const n of [...set].filter((n) => n >= 0 && n < total).sort((a, b) => a - b)) {
    if (n - prev > 1) out.push('…')
    out.push(n)
    prev = n
  }
  return out
}

export function DataTable<T>({
  columns: allColumns,
  rows,
  rowKey,
  onRowClick,
  empty = { title: 'Пока пусто' },
  initialSort = null,
  selectedKey,
  ignoreView = false,
  pageSizes,
  pageSize,
  sortOptions,
  className,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  /** порожній стан: і коли rows порожній, і коли в панелі вибрано «Пусто» */
  empty?: EmptyProps
  initialSort?: Sort
  /** підсвітити рядок (напр. відкритий праворуч) */
  selectedKey?: string
  ignoreView?: boolean
  /** пагінація «по скільки виводити», напр. [10, 20, 50]; без пропа таблиця показує всі рядки */
  pageSizes?: number[]
  /** початковий розмір сторінки (напр. з налаштувань рекрутера); має бути серед pageSizes */
  pageSize?: number
  /** список «Сортировать: …» у верхній смузі таблиці (додатково до клікабельних заголовків) */
  sortOptions?: SortOption[]
  className?: string
}) {
  const view = useView()
  const columns = allColumns.filter((c) => !c.hidden)
  const sortable = allColumns
  const [sort, setSort] = useState<Sort>(initialSort)
  const v = ignoreView ? 'normal' : view
  const [size, setSize] = useState(pageSize && pageSizes?.includes(pageSize) ? pageSize : (pageSizes?.[0] ?? 0))
  const [page, setPage] = useState(0)

  const col = sort && sortable.find((c) => c.key === sort.key)
  const sorted =
    col?.sortValue && sort
      ? [...rows].sort((a, b) => {
          const x = col.sortValue!(a)
          const y = col.sortValue!(b)
          const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'ru')
          return sort.dir === 'asc' ? r : -r
        })
      : rows

  const toggle = (key: string) => setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null))
  const showRows = v === 'normal' && sorted.length > 0

  // Нова вибірка (пошук, фільтр, вкладка) або інший розмір сторінки — повертаємось на першу сторінку.
  useEffect(() => setPage(0), [rows.length, size])
  const pages = pageSizes && size ? Math.max(1, Math.ceil(sorted.length / size)) : 1
  const cur = Math.min(page, pages - 1)
  const shown = pageSizes && size ? sorted.slice(cur * size, (cur + 1) * size) : sorted
  const sortValueNow = sort && sortOptions?.some((o) => o.key === sort.key && o.dir === sort.dir) ? `${sort.key}:${sort.dir}` : ''

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-surface', className)}>
      {showRows && sortOptions && (
        <div className="flex h-12 items-center justify-end gap-2 border-b border-border px-4 text-sm">
          <span className="text-muted-foreground">Сортировать:</span>
          <Select
            value={sortValueNow}
            onValueChange={(val) => {
              const o = sortOptions.find((x) => `${x.key}:${x.dir}` === val)
              if (o) setSort({ key: o.key, dir: o.dir })
            }}
          >
            <SelectTrigger size="sm" aria-label="Сортировать" className="min-w-[220px] bg-surface">
              <SelectValue placeholder="По заголовку колонки" />
            </SelectTrigger>
            <SelectContent align="end">
              {sortOptions.map((o) => (
                <SelectItem key={`${o.key}:${o.dir}`} value={`${o.key}:${o.dir}`}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <colgroup>
          {columns.map((c) => (
            <col key={c.key} style={c.width ? { width: c.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn('h-11 px-4 font-medium text-muted-foreground', c.align === 'right' && 'text-right')} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                {c.sortValue ? (
                  <button type="button" onClick={() => toggle(c.key)} className={cn('inline-flex items-center gap-1 hover:text-foreground', sort?.key === c.key && 'text-foreground')}>
                    {c.header}
                    {sort?.key === c.key ? sort.dir === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" /> : <ChevronsUpDown className="size-3.5 opacity-50" />}
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        {showRows && (
          <tbody>
            {shown.map((r) => {
              const k = rowKey(r)
              return (
                <tr
                  key={k}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  className={cn('border-t border-border first:border-t-0', onRowClick && 'cursor-pointer hover:bg-muted', selectedKey === k && 'bg-muted')}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn('h-14 truncate px-4 py-2 align-middle', c.align === 'right' && 'text-right', c.mono && 'font-mono')}>
                      {c.cell(r)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        )}
      </table>
      {showRows && pageSizes && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Показывать по</span>
            <Select value={String(size)} onValueChange={(x) => setSize(Number(x))}>
              <SelectTrigger size="sm" aria-label="Сколько строк показывать" className="w-[72px] bg-surface font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((n) => (
                  <SelectItem key={n} value={String(n)} className="font-mono">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-muted-foreground">
            <span className="font-mono">
              {cur * size + 1}–{Math.min((cur + 1) * size, sorted.length)}
            </span>{' '}
            из <span className="font-mono">{sorted.length}</span>
          </span>
          {pages > 1 && (
            <nav aria-label="Страницы" className="flex items-center gap-1">
              <button type="button" aria-label="Предыдущая страница" disabled={cur === 0} onClick={() => setPage(cur - 1)} className="flex size-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent">
                <ChevronLeft className="size-4" />
              </button>
              {pageList(cur, pages).map((n, i) =>
                n === '…' ? (
                  <span key={`g${i}`} className="px-1 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    aria-current={n === cur ? 'page' : undefined}
                    onClick={() => setPage(n)}
                    className={cn('flex size-8 items-center justify-center rounded-md font-mono hover:bg-muted', n === cur && 'bg-primary text-primary-foreground hover:bg-primary')}
                  >
                    {n + 1}
                  </button>
                ),
              )}
              <button type="button" aria-label="Следующая страница" disabled={cur === pages - 1} onClick={() => setPage(cur + 1)} className="flex size-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent">
                <ChevronRight className="size-4" />
              </button>
            </nav>
          )}
        </div>
      )}
      {v === 'loading' && <LoadingState kind="table" />}
      {v === 'error' && <ErrorState />}
      {(v === 'empty' || (v === 'normal' && sorted.length === 0)) && <EmptyState {...empty} />}
    </div>
  )
}
