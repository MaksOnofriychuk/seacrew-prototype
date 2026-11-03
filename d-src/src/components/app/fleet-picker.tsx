import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Popover } from 'radix-ui'
import { usePhonePortal } from '@/lib/phone-portal'
import { departmentsFor, FLEETS, positionsFor } from '@/lib/data'
import { cn } from '@/lib/utils'

// Правки №2, №25, №35: вибір Флот → Департамент → Должность; кожен наступний список — лише під вибране в попередньому.
// Перевірка прототипу 03.11, №10б: три випадаючі списки в один рядок зліва направо; наступний активний, коли вибрано попередній.
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
  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      <Drop
        label={labels.fleet ?? 'Флот'}
        align="start"
        note={fleetNote}
        options={FLEETS}
        picked={value.fleets}
        multi={multiFleet}
        placeholder="Выбрать"
        onPick={toggleFleet}
      />
      <Drop
        label={labels.department ?? 'Департамент'}
        options={departments}
        picked={value.department ? [value.department] : []}
        placeholder={value.fleets.length ? 'Выбрать' : '—'}
        disabled={!value.fleets.length}
        onPick={setDepartment}
      />
      <Drop
        label={labels.position ?? 'Должность'}
        align="end"
        note={posNote}
        options={positions}
        picked={value.positions}
        multi={multiPosition}
        placeholder={value.department ? 'Выбрать' : '—'}
        disabled={!value.department}
        onPick={togglePosition}
      />
    </div>
  )
}

// Випадаючий список під полем. Один вибір — закривається після тапу; кілька — лишається відкритим, галочки біля вибраних.
function Drop({
  label,
  note,
  options,
  picked,
  multi,
  placeholder,
  disabled,
  align = 'center',
  onPick,
}: {
  label: string
  note?: string
  options: readonly string[]
  picked: string[]
  multi?: boolean
  placeholder: string
  disabled?: boolean
  align?: 'start' | 'center' | 'end'
  onPick: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const container = usePhonePortal()
  const shown = picked.length > 1 ? `${picked[0]} +${picked.length - 1}` : (picked[0] ?? '')
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="truncate text-sm font-medium" title={note ? `${label}, ${note}` : label}>
        {label}
      </span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild disabled={disabled}>
          <button
            type="button"
            className={cn(
              'flex h-12 w-full min-w-0 items-center justify-between gap-1 rounded-md border border-input bg-surface px-3 text-left text-sm transition-colors disabled:opacity-50',
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
            align={align}
            sideOffset={4}
            collisionPadding={12}
            collisionBoundary={container}
            avoidCollisions={false}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="z-50 max-h-[min(18rem,var(--radix-popover-content-available-height))] w-60 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground">{note ? `${label} — ${note}` : label}</p>
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
                        if (!multi) setOpen(false)
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
