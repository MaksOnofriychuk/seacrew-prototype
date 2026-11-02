import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { departmentsFor, FLEETS, positionsFor } from '@/lib/data'
import { cn } from '@/lib/utils'

// Правки №2, №25, №35: вибір Флот → Департамент → Должность; кожен наступний список — лише під вибране в попередньому.
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
    setFleets(multiFleet ? (value.fleets.includes(f) ? value.fleets.filter((x) => x !== f) : [...value.fleets, f]) : value.fleets[0] === f ? [] : [f])
  const setDepartment = (d: string) => onChange({ ...value, department: value.department === d ? null : d, positions: [] })
  const togglePosition = (p: string) =>
    onChange({
      ...value,
      positions: multiPosition ? (value.positions.includes(p) ? value.positions.filter((x) => x !== p) : [...value.positions, p]) : value.positions[0] === p ? [] : [p],
    })

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <Level label={labels.fleet ?? 'Флот'} hint={multiFleet ? 'можно несколько' : undefined}>
        {FLEETS.map((f) => (
          <Chip key={f} on={value.fleets.includes(f)} multi={multiFleet} onClick={() => toggleFleet(f)}>
            {f}
          </Chip>
        ))}
      </Level>
      {value.fleets.length > 0 && (
        <Level label={labels.department ?? 'Департамент'}>
          {departments.map((d) => (
            <Chip key={d} on={value.department === d} onClick={() => setDepartment(d)}>
              {d}
            </Chip>
          ))}
        </Level>
      )}
      {value.department && (
        <Level label={labels.position ?? 'Должность'} hint={multiPosition ? 'можно несколько' : undefined}>
          {positions.map((p) => (
            <Chip key={p} on={value.positions.includes(p)} multi={multiPosition} onClick={() => togglePosition(p)}>
              {p}
            </Chip>
          ))}
        </Level>
      )}
    </div>
  )
}

function Level({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="screen-in flex flex-col gap-2">
      <legend className="mb-2 flex items-baseline gap-2 text-sm font-medium">
        {label}
        {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

// Чіп вибору: вибраний — заливка primary (як фільтри стрічки); у множинному виборі — з галочкою.
function Chip({ on, multi, onClick, children }: { on: boolean; multi?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors active:scale-[0.98]',
        on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground',
      )}
    >
      {multi && on && <Check className="size-4" strokeWidth={2.5} />}
      {children}
    </button>
  )
}
