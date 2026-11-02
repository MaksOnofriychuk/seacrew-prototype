import { useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
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
}

type Sort = { key: string; dir: 'asc' | 'desc' } | null

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty = { title: 'Пока пусто' },
  initialSort = null,
  selectedKey,
  ignoreView = false,
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
  className?: string
}) {
  const view = useView()
  const [sort, setSort] = useState<Sort>(initialSort)
  const v = ignoreView ? 'normal' : view

  const col = sort && columns.find((c) => c.key === sort.key)
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

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-surface', className)}>
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
            {sorted.map((r) => {
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
      {v === 'loading' && <LoadingState kind="table" />}
      {v === 'error' && <ErrorState />}
      {(v === 'empty' || (v === 'normal' && sorted.length === 0)) && <EmptyState {...empty} />}
    </div>
  )
}
