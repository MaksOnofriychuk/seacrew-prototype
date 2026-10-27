import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Group } from '@/components/app/group'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '../q/_parts'
import { Dur, maskMonth, Pick } from './_core-parts'

// Рейси для кроку «Морской стаж»: дані, підрахунок і форма рейсу (C: «Рейс вручную»).

export type Voyage = {
  id: string
  vessel: string
  type: string
  flag: string
  rank: string
  dwt: string
  from: string // ММ.ГГГГ
  to: string // ММ.ГГГГ
  owner: string
  engine: string
}

export const VESSEL_TYPES = ['Tanker', 'Container Ship', 'Bulk Carrier', 'LPG Carrier']

// Вигадані рейси: два з C (MV Example Star, MV Example Wave) і ще два, щоб у кожній посаді
// було кілька типів суден.
export const VOYAGES: Voyage[] = [
  {
    id: 'v3',
    vessel: 'MV Example Crest',
    type: 'Tanker',
    flag: 'Liberia',
    rank: '3rd Engineer',
    dwt: '49 990',
    from: '11.2024',
    to: '06.2025',
    owner: 'Example Tankers Ltd',
    engine: 'MAN B&W 6G50, 8 600 kW',
  },
  {
    id: 'v1',
    vessel: 'MV Example Star',
    type: 'Container Ship',
    flag: 'Malta',
    rank: '3rd Engineer',
    dwt: '19 800',
    from: '02.2024',
    to: '09.2024',
    owner: 'Example Shipping Ltd',
    engine: 'MAN B&W 6S46, 7 860 kW',
  },
  {
    id: 'v2',
    vessel: 'MV Example Wave',
    type: 'Bulk Carrier',
    flag: 'Panama',
    rank: '4th Engineer',
    dwt: '58 000',
    from: '05.2022',
    to: '12.2023',
    owner: 'Example Bulk Management',
    engine: 'MAN B&W 6S50, 9 480 kW',
  },
  {
    id: 'v4',
    vessel: 'MV Example Reef',
    type: 'Tanker',
    flag: 'Marshall Islands',
    rank: '4th Engineer',
    dwt: '45 700',
    from: '03.2021',
    to: '11.2021',
    owner: 'Example Tankers Ltd',
    engine: 'MAN B&W 6S50, 9 480 kW',
  },
]

// Рейс, який «знаходить» ИИ у сторінках послужної книжки чи CV.
export const FOUND: Voyage = {
  id: 'found',
  vessel: 'MV Example Bay',
  type: 'LPG Carrier',
  flag: 'Malta',
  rank: '3rd Engineer',
  dwt: '22 300',
  from: '09.2025',
  to: '03.2026',
  owner: 'Example Gas Shipping',
  engine: 'MAN B&W 6S35, 5 600 kW',
}

const ym = (s: string) => {
  const m = s.match(/^(\d{2})\.(\d{4})$/)
  return m ? +m[2] * 12 + +m[1] - 1 : null
}

// Місяці рейсу, включно з обома крайніми (як months() у C).
export function vMonths(v: { from: string; to: string }) {
  const a = ym(v.from)
  const b = ym(v.to)
  return a === null || b === null || b < a ? 0 : b - a + 1
}

export const byStart = (a: Voyage, b: Voyage) => (ym(b.from) ?? 0) - (ym(a.from) ?? 0)

// По посадах (порядок — від останнього рейсу), всередині — по типах суден (більший стаж першим).
export function groupByRank(list: Voyage[]) {
  const ranks: {
    rank: string
    total: number
    types: { type: string; m: number }[]
  }[] = []
  for (const v of [...list].sort(byStart)) {
    const m = vMonths(v)
    let r = ranks.find((x) => x.rank === v.rank)
    if (!r) ranks.push((r = { rank: v.rank, total: 0, types: [] }))
    r.total += m
    const t = r.types.find((x) => x.type === v.type)
    if (t) t.m += m
    else r.types.push({ type: v.type, m })
  }
  ranks.forEach((r) => r.types.sort((a, b) => b.m - a.m))
  return ranks
}

const EMPTY: Voyage = {
  id: '',
  vessel: '',
  type: '',
  flag: '',
  rank: '',
  dwt: '',
  from: '',
  to: '',
  owner: '',
  engine: '',
}

export function VoyageForm({ initial, onSave, onCancel, onDelete }: { initial?: Voyage; onSave: (v: Voyage) => void; onCancel: () => void; onDelete?: () => void }) {
  const [v, setV] = useState<Voyage>(initial ?? EMPTY)
  const put = (p: Partial<Voyage>) => setV((x) => ({ ...x, ...p }))
  const ref = useRef<HTMLDivElement>(null)
  const m = vMonths(v)
  const datesBad = v.from.length === 7 && v.to.length === 7 && m === 0
  const ok = !!v.vessel.trim() && !!v.rank.trim() && m > 0

  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    return () => window.clearTimeout(t)
  }, [])

  const text = (k: keyof Voyage, label: string, ph: string, mono?: boolean) => (
    <Field id={`s6-${k}`} label={label}>
      <TextInput id={`s6-${k}`} value={v[k]} placeholder={ph} mono={mono} className={mono ? 'placeholder:font-sans' : undefined} onChange={(e) => put({ [k]: e.target.value })} />
    </Field>
  )
  const month = (k: 'from' | 'to', label: string) => (
    <Field id={`s6-${k}`} label={label}>
      <TextInput id={`s6-${k}`} value={v[k]} placeholder="ММ.ГГГГ" mono inputMode="numeric" invalid={datesBad} onChange={(e) => put({ [k]: maskMonth(e.target.value) })} />
    </Field>
  )

  return (
    <div ref={ref} className="scroll-mt-4">
      <Group title={v.vessel.trim() || 'Рейс вручную'}>
        <div className="flex flex-col gap-5 py-1">
          {text('vessel', 'Судно', 'MV …')}
          <div className="grid grid-cols-2 gap-3">
            <Pick id="s6-type" label="Тип судна" value={v.type} options={VESSEL_TYPES} onChange={(type) => put({ type })} />
            {text('flag', 'Флаг', 'Malta')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {text('rank', 'Должность', '3rd Engineer')}
            {text('dwt', 'DWT / GT', '19 800', true)}
          </div>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-3">
              {month('from', 'Начало')}
              {month('to', 'Окончание')}
            </div>
            {datesBad ? (
              <p className="text-sm text-signal">Окончание раньше начала</p>
            ) : m > 0 ? (
              <p className="text-sm text-muted-foreground">
                <Dur m={m} long />
              </p>
            ) : null}
          </div>
          {text('owner', 'Судовладелец или агентство', 'Компания')}
          {text('engine', 'Двигатель', 'MAN B&W 6S46, 7 860 kW')}
          <div className="flex gap-2">
            <Button variant="ghost" className="h-11 text-[15px] text-muted-foreground" onClick={onCancel}>
              Отмена
            </Button>
            <Button
              variant="secondary"
              className="h-11 flex-1 text-[15px] text-primary"
              disabled={!ok}
              onClick={() => onSave({ ...v, vessel: v.vessel.trim(), rank: v.rank.trim() })}
            >
              Сохранить рейс
            </Button>
          </div>
          {onDelete && (
            <button type="button" onClick={onDelete} className="-mt-1 flex items-center gap-2 self-start text-sm font-medium text-signal">
              <Trash2 className="size-4" />
              Удалить рейс
            </button>
          )}
        </div>
      </Group>
    </div>
  )
}
