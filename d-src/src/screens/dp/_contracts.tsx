import { useState, type ComponentType } from 'react'
import { Camera, FolderOpen, Image, LoaderCircle, PenLine, Sparkles, Trash2 } from 'lucide-react'
import { CountryPick, MonthRangePick } from '@/components/app/pickers'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { FleetPicker, type FleetValue } from '@/components/app/fleet-picker'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CONTRACTS, VESSEL_TYPES, type Contract } from '@/lib/data-docs-profile'
import { Dur, Field, TextInput, useDP } from './_parts'

// Контракти для «Опыта работы» у профілі (p22) і CV (p20): підрахунок, форма контракту, блок додавання.
// Власна версія кроку s6 (правки №3, №25, №26, №34) — без імпорту з теки s.

/* ---------- одне джерело з реєстрацією ---------- */

// Контракти й «Скрыть общий стаж» живуть там само, де крок s6 і q09 (bag 's6.voyages', 's6.hideTotal'):
// стаж у профілі, «Опыте работы», CV і реєстрації — одна цифра. Формат кроку s6: rank, dept.
type Stored = Omit<Contract, 'position' | 'department' | 'fleet'> & { rank: string; dept?: string; fleet?: string }
const toContract = ({ rank, dept, fleet, ...v }: Stored): Contract => ({ ...v, fleet: fleet ?? '', department: dept ?? '', position: rank })
const toStored = ({ position, department, ...c }: Contract): Stored => ({ ...c, rank: position, dept: department })

export function useContracts() {
  const { bag, setBag } = useDP()
  const stored = bag<Stored[] | null>('s6.voyages', null)
  return {
    contracts: stored ? stored.map(toContract) : CONTRACTS,
    save: (next: Contract[]) => setBag('s6.voyages', next.map(toStored)),
    hideTotal: bag<boolean>('s6.hideTotal', false),
    setHideTotal: (v: boolean) => setBag('s6.hideTotal', v),
  }
}

const ym = (s: string) => {
  const m = s.match(/^(\d{2})\.(\d{4})$/)
  return m ? +m[2] * 12 + +m[1] - 1 : null
}

// Місяці контракту, включно з обома крайніми.
export function cMonths(c: { from: string; to: string }) {
  const a = ym(c.from)
  const b = ym(c.to)
  return a === null || b === null || b < a ? 0 : b - a + 1
}

export const byStart = (a: Contract, b: Contract) => (ym(b.from) ?? 0) - (ym(a.from) ?? 0)

// Для CV: «3 years 9 months».
export function durEn(m: number) {
  const y = Math.floor(m / 12)
  const mo = m % 12
  return [y ? `${y} ${y === 1 ? 'year' : 'years'}` : '', mo || !y ? `${mo} ${mo === 1 ? 'month' : 'months'}` : ''].filter(Boolean).join(' ')
}

// По посадах (порядок — від останнього контракту), всередині — по типах суден (більший стаж першим).
export function groupByPosition(list: Contract[]) {
  const out: { position: string; total: number; types: { type: string; m: number }[] }[] = []
  for (const c of [...list].sort(byStart)) {
    const m = cMonths(c)
    let r = out.find((x) => x.position === c.position)
    if (!r) out.push((r = { position: c.position, total: 0, types: [] }))
    r.total += m
    const t = r.types.find((x) => x.type === c.type)
    if (t) t.m += m
    else r.types.push({ type: c.type, m })
  }
  out.forEach((r) => r.types.sort((a, b) => b.m - a.m))
  return out
}

/* ---------- блок «добавить из документа» ---------- */

// Велика зона: тап запускає розпізнавання; під нею — джерела. «Ввести вручную» — тихе посилання.
export function AddPanel({ title, sub, busy, onUpload, onManual }: { title: string; sub: string; busy?: boolean; onUpload: () => void; onManual: () => void }) {
  const sources: [ComponentType<{ className?: string }>, string][] = [
    [Camera, 'Камера'],
    [FolderOpen, 'Файл'],
    [Image, 'Галерея'],
  ]
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <button type="button" disabled={busy} onClick={onUpload} className="flex w-full items-center gap-4 px-4 py-4 text-left disabled:opacity-100">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
            {busy ? <LoaderCircle className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[15px] font-medium">{title}</span>
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {busy ? 'Распознаём…' : sub}
            </span>
          </span>
        </button>
        <div className="grid grid-cols-3 border-t border-border">
          {sources.map(([I, label]) => (
            <button key={label} type="button" disabled={busy} onClick={onUpload} className="flex items-center justify-center gap-2 border-l border-border py-3 text-sm font-medium text-primary first:border-l-0 disabled:opacity-50">
              <I className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <button type="button" onClick={onManual} className="flex items-center gap-2 self-start text-[15px] font-medium text-primary">
        <PenLine className="size-4" />
        Ввести вручную
      </button>
    </div>
  )
}

/* ---------- форма контракту (вікно знизу) ---------- */

const EMPTY: Contract = { id: '', vessel: '', type: '', flag: '', fleet: '', department: '', position: '', dwt: '', from: '', to: '', owner: '', engine: '' }

export function ContractSheet({
  open,
  initial,
  onSave,
  onClose,
  onDelete,
}: {
  open: boolean
  initial?: Contract
  onSave: (c: Contract) => void
  onClose: () => void
  onDelete?: () => void
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? initial.vessel : 'Новый контракт'}>
      {open && <ContractForm key={initial?.id ?? 'new'} initial={initial} onSave={onSave} onCancel={onClose} onDelete={onDelete} />}
    </BottomSheet>
  )
}

function ContractForm({ initial, onSave, onCancel, onDelete }: { initial?: Contract; onSave: (c: Contract) => void; onCancel: () => void; onDelete?: () => void }) {
  const [c, setC] = useState<Contract>(initial ?? EMPTY)
  const put = (p: Partial<Contract>) => setC((x) => ({ ...x, ...p }))
  const m = cMonths(c)
  const ok = !!c.vessel.trim() && !!c.position && m > 0
  const fleet: FleetValue = { fleets: c.fleet ? [c.fleet] : [], department: c.department || null, positions: c.position ? [c.position] : [] }

  const text = (k: keyof Contract, label: string, ph: string, mono?: boolean) => (
    <Field id={`p22-${k}`} label={label}>
      <TextInput id={`p22-${k}`} value={c[k]} placeholder={ph} mono={mono} onChange={(e) => put({ [k]: e.target.value })} />
    </Field>
  )
  return (
    <div className="flex flex-col gap-5 pb-2">
      {text('vessel', 'Судно', 'MV …')}
      <FleetPicker
        value={fleet}
        onChange={(v) => put({ fleet: v.fleets[0] ?? '', department: v.department ?? '', position: v.positions[0] ?? '' })}
        labels={{ position: 'Должность на контракте' }}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field id="p22-type" label="Тип судна">
          <Select value={c.type || undefined} onValueChange={(type) => put({ type })}>
            <SelectTrigger id="p22-type" className="h-12 w-full px-4 text-base data-[size=default]:h-12">
              <SelectValue placeholder="Выберите" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-64">
              {VESSEL_TYPES.map((o) => (
                <SelectItem key={o} value={o} className="py-2 text-base">
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="p22-flag" label="Флаг">
          <CountryPick id="p22-flag" title="Флаг судна" value={c.flag} onChange={(flag) => put({ flag })} />
        </Field>
      </div>
      {text('dwt', 'DWT / GT', '19 800', true)}
      <div className="flex flex-col gap-2">
        <Field id="p22-period" label="Период">
          <MonthRangePick
            id="p22-period"
            value={c.from && c.to ? `${c.from} – ${c.to}` : ''}
            onChange={(r) => {
              const [from, to] = r.split(/\s*–\s*/)
              put({ from, to })
            }}
          />
        </Field>
        {m > 0 && (
          <p className="text-sm text-muted-foreground">
            <Dur m={m} long />
          </p>
        )}
      </div>
      {text('owner', 'Судовладелец или агентство', 'Компания')}
      {text('engine', 'Двигатель', 'MAN B&W 6S46, 7 860 kW')}
      <div className="flex gap-2">
        <Button variant="ghost" className="h-11 text-[15px] text-muted-foreground" onClick={onCancel}>
          Отмена
        </Button>
        <Button className="h-11 flex-1 text-[15px]" disabled={!ok} onClick={() => onSave({ ...c, vessel: c.vessel.trim() })}>
          Сохранить контракт
        </Button>
      </div>
      {onDelete && (
        <button type="button" onClick={onDelete} className="-mt-1 flex items-center gap-2 self-start text-sm font-medium text-signal">
          <Trash2 className="size-4" />
          Удалить контракт
        </button>
      )}
    </div>
  )
}
