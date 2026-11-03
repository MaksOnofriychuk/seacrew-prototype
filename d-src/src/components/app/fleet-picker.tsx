import { useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover } from 'radix-ui'
import { usePhonePortal } from '@/lib/phone-portal'
import { departmentsFor, FLEETS, positionsFor } from '@/lib/data'
import { cn } from '@/lib/utils'

// Правки №2, №25, №35: вибір Флот → Департамент → Должность; кожен наступний список — лише під вибране в попередньому.
// Перевірка прототипу 03.11, №10б і №20: три випадаючі списки один під одним, пов'язані — крок за кроком:
// наступний активний лише після вибору попереднього й відкривається сам.
// Департамент завжди один. Флот і посада — один або кілька (multiFleet / multiPosition):
//   фільтри вакансій: флот кілька, посада кілька; бажана посада (s11): флот і посада кілька;
//   контракт в «Опыте работы»: усе по одному.
// Списки — FLEETS / FLEET_TREE у lib/data (за довідниками KB).

export type FleetValue = { fleets: string[]; department: string | null; positions: string[] }

export const FLEET_EMPTY: FleetValue = { fleets: [], department: null, positions: [] }

// «Offshore → Engine → 3rd Engineer» (кілька — через кому).
export function fleetSummary(v: FleetValue) {
  return [v.fleets.join(', '), v.department ?? '', v.positions.join(', ')].filter(Boolean).join(' → ')
}

export function FleetPicker({
  value,
  onChange,
  multiFleet = false,
  multiPosition = false,
  labels = {},
  className,
}: {
  value: FleetValue
  onChange: (v: FleetValue) => void
  multiFleet?: boolean
  multiPosition?: boolean
  labels?: { fleet?: string; department?: string; position?: string }
  className?: string
}) {
  const departments = departmentsFor(value.fleets)
  const positions = positionsFor(value.fleets, value.department)

  // Зміна флоту: департамент лишається, якщо він є в нових флотах; посади — лише ті, що лишились у списку.
  const setFleets = (fleets: string[]) => {
    const dep = value.department && departmentsFor(fleets).includes(value.department) ? value.department : null
    const allowed = positionsFor(fleets, dep)
    onChange({ fleets, department: dep, positions: value.positions.filter((p) => allowed.includes(p)) })
  }
  const toggleFleet = (f: string) =>
    setFleets(multiFleet ? (value.fleets.includes(f) ? value.fleets.filter((x) => x !== f) : [...value.fleets, f]) : [f])
  const setDepartment = (d: string) => onChange({ ...value, department: d, positions: value.department === d ? value.positions : [] })
  const togglePosition = (p: string) =>
    onChange({
      ...value,
      positions: multiPosition ? (value.positions.includes(p) ? value.positions.filter((x) => x !== p) : [...value.positions, p]) : [p],
    })

  const fleetNote = multiFleet ? 'можно несколько' : undefined
  const posNote = multiPosition ? 'можно несколько' : undefined
  // Покроково: після вибору флоту сам відкривається департамент, після департаменту — посада.
  const [openAt, setOpenAt] = useState<number | null>(null)
  const next = (i: number) => window.setTimeout(() => setOpenAt(i), 180)
  // Фільтри (кілька флотів / посад): вибране — плашками з «×», тап — вікно з галочками (перевірка 03.11, №32).
  if (multiFleet || multiPosition) {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        <MultiField
          label={labels.fleet ?? 'Флот'}
          options={FLEETS}
          picked={value.fleets}
          placeholder="Любой"
          onToggle={toggleFleet}
          onSet={setFleets}
        />
        <Drop
          label={labels.department ?? 'Департамент'}
          options={departments}
          picked={value.department ? [value.department] : []}
          placeholder={value.fleets.length ? 'Любой' : 'Сначала выберите флот'}
          disabled={!value.fleets.length}
          open={openAt === 1}
          onOpen={(o) => setOpenAt(o ? 1 : null)}
          onPick={setDepartment}
        />
        <MultiField
          label={labels.position ?? 'Должность'}
          options={positions}
          picked={value.positions}
          placeholder={value.department ? 'Любая' : 'Сначала выберите департамент'}
          disabled={!value.department}
          search
          onToggle={togglePosition}
          onSet={(positions) => onChange({ ...value, positions })}
        />
      </div>
    )
  }
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <Drop
        step={1}
        label={labels.fleet ?? 'Флот'}
        note={fleetNote}
        options={FLEETS}
        picked={value.fleets}
        multi={multiFleet}
        placeholder={multiFleet ? 'Выберите флоты' : 'Выберите флот'}
        open={openAt === 0}
        onOpen={(o) => setOpenAt(o ? 0 : null)}
        onPick={(f) => {
          toggleFleet(f)
          if (!multiFleet) next(1)
        }}
      />
      <Drop
        step={2}
        label={labels.department ?? 'Департамент'}
        options={departments}
        picked={value.department ? [value.department] : []}
        placeholder={value.fleets.length ? 'Выберите департамент' : 'Сначала выберите флот'}
        disabled={!value.fleets.length}
        open={openAt === 1}
        onOpen={(o) => setOpenAt(o ? 1 : null)}
        onPick={(d) => {
          setDepartment(d)
          next(2)
        }}
      />
      <Drop
        step={3}
        label={labels.position ?? 'Должность'}
        note={posNote}
        options={positions}
        picked={value.positions}
        multi={multiPosition}
        placeholder={value.department ? (multiPosition ? 'Выберите должности' : 'Выберите должность') : 'Сначала выберите департамент'}
        disabled={!value.department}
        open={openAt === 2}
        onOpen={(o) => setOpenAt(o ? 2 : null)}
        onPick={togglePosition}
      />
    </div>
  )
}

// Випадаючий список під полем. Один вибір — закривається після тапу; кілька — лишається відкритим, галочки біля вибраних.
function Drop({
  step,
  label,
  note,
  options,
  picked,
  multi,
  placeholder,
  disabled,
  open,
  onOpen,
  onPick,
}: {
  step?: number
  open: boolean
  onOpen: (o: boolean) => void
  label: string
  note?: string
  options: readonly string[]
  picked: string[]
  multi?: boolean
  placeholder: string
  disabled?: boolean
  onPick: (v: string) => void
}) {
  const container = usePhonePortal()
  const shown = picked.join(', ')
  return (
    <div className={cn('flex flex-col gap-2 transition-opacity duration-200', disabled && 'opacity-60')}>
      <span className="flex items-baseline gap-2 text-sm font-medium">
        {step && <span className={cn('font-mono text-xs', picked.length ? 'text-success' : 'text-muted-foreground')}>{step}</span>}
        {label}
        {note && <span className="font-normal text-muted-foreground">{note}</span>}
      </span>
      <Popover.Root open={open && !disabled} onOpenChange={onOpen}>
        <Popover.Trigger asChild disabled={disabled}>
          <button
            type="button"
            className={cn(
              'flex h-12 w-full items-center justify-between gap-3 rounded-md border border-input bg-surface px-4 text-left text-base transition-colors disabled:cursor-not-allowed',
              open && 'border-ring',
            )}
          >
            <span className={cn('truncate', !shown && 'text-muted-foreground')}>{shown || placeholder}</span>
            <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-150', open && 'rotate-180')} />
          </button>
        </Popover.Trigger>
        <Popover.Portal container={container}>
          <Popover.Content
            side="top"
            align="start"
            sideOffset={4}
            collisionPadding={12}
            collisionBoundary={container}
            avoidCollisions={false}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="z-50 max-h-[min(18rem,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            {note && <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground">{note}</p>}
            <ul role="listbox" aria-multiselectable={multi || undefined}>
              {options.map((o) => {
                const on = picked.includes(o)
                return (
                  <li key={o}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      onClick={() => {
                        onPick(o)
                        if (!multi) onOpen(false)
                      }}
                      className={cn('flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] active:bg-muted', on && 'font-medium text-primary')}
                    >
                      <span className="flex-1">{o}</span>
                      {on && <Check className="size-4 shrink-0" strokeWidth={2.5} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}

// Поле з кількома значеннями: вибране — плашками з «×» (прибрати одразу); тап по полю — вікно знизу з галочками.
function MultiField({
  label,
  options,
  picked,
  placeholder,
  disabled,
  search,
  onToggle,
  onSet,
}: {
  label: string
  options: readonly string[]
  picked: string[]
  placeholder: string
  disabled?: boolean
  search?: boolean
  onToggle: (v: string) => void
  onSet: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const list = options.filter((o) => !needle || o.toLowerCase().includes(needle))
  const close = () => {
    setOpen(false)
    setQ('')
  }
  return (
    <div className={cn('flex flex-col gap-2 transition-opacity duration-200', disabled && 'opacity-60')}>
      <span className="text-sm font-medium">{label}</span>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-haspopup="dialog"
        onClick={() => !disabled && setOpen(true)}
        onKeyDown={(e) => !disabled && (e.key === 'Enter' || e.key === ' ') && setOpen(true)}
        className={cn('flex min-h-12 w-full items-center gap-2 rounded-md border border-input bg-surface py-1.5 pr-3 pl-1.5 text-left', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {picked.length ? (
            picked.map((v) => (
              <span key={v} className="inline-flex h-8 items-center gap-1 rounded-full bg-primary/10 pr-1 pl-3 text-sm font-medium text-primary">
                {v}
                <button
                  type="button"
                  aria-label={`Убрать ${v}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggle(v)
                  }}
                  className="flex size-6 items-center justify-center rounded-full active:bg-primary/20"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))
          ) : (
            <span className="px-2.5 text-base text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <BottomSheet
        open={open}
        onClose={close}
        title={label}
        fixed
        aside={
          picked.length ? (
            <button type="button" className="text-[15px] font-medium text-primary" onClick={() => onSet([])}>
              Сбросить
            </button>
          ) : undefined
        }
        head={
          search ? (
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label={`Поиск: ${label}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" className="h-12 pl-10 text-base md:text-base" />
            </div>
          ) : undefined
        }
        footer={
          <Button className="h-12 text-base" onClick={close}>
            {picked.length ? `Готово · ${picked.length}` : 'Готово'}
          </Button>
        }
      >
        {list.length ? (
          <ul className="overflow-hidden rounded-xl border border-border">
            {list.map((o) => {
              const on = picked.includes(o)
              return (
                <li key={o} className="border-t border-border first:border-t-0">
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 active:bg-muted">
                    <Checkbox checked={on} onCheckedChange={() => onToggle(o)} />
                    <span className={cn('flex-1 text-[15px]', on && 'font-medium')}>{o}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-[15px] text-muted-foreground">Ничего не нашли.</p>
        )}
      </BottomSheet>
    </div>
  )
}
