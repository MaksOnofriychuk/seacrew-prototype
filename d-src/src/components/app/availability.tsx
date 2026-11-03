import { useState } from 'react'
import { DatePick } from '@/components/app/pickers'
import { BOUNDS } from '@/lib/dates'
import { CalendarClock, Check, ChevronDown, CircleCheck, CircleMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AVAIL_DEFAULT, AVAIL_DEFAULT_DATE, AVAIL_OPTIONS, availLabel, ruDate, type AvailKind, type Availability } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { BottomSheet } from './bottom-sheet'

// Статус доступності моряка (правки №1, №15, №19, №20, №23): три статуси, «В рейсе до» прибрано;
// дату «Готов к контракту с» моряк вибирає сам і може змінити. Один стан на весь прототип — bag 'avail'.

export const AVAIL_ICON: Record<AvailKind, typeof CircleCheck> = { now: CircleCheck, from: CalendarClock, not: CircleMinus }
export const AVAIL_TONE: Record<AvailKind, string> = { now: 'text-success', from: 'text-success', not: 'text-muted-foreground' }

export function useAvailability() {
  const { bag, setBag } = useProto()
  const value = bag<Availability>('avail', AVAIL_DEFAULT)
  return { value, label: availLabel(value), set: (a: Availability) => setBag('avail', a) }
}

// Тиха кнопка статусу (значок + текст + стрілка), без пігулки. Відкриває AvailabilitySheet.
export function AvailabilityButton({ onClick, className }: { onClick: () => void; className?: string }) {
  const { value, label } = useAvailability()
  const Icon = AVAIL_ICON[value.kind]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Статус: ${label}. Изменить`}
      className={cn('flex min-h-11 w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left text-sm leading-snug font-normal', className)}
    >
      <Icon className={cn('size-[18px] shrink-0', AVAIL_TONE[value.kind])} />
      <span className="min-w-0 flex-1 text-balance">
        <AvailText a={value} />
      </span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

// Текст статусу; дата — моноширинним.
export function AvailText({ a }: { a: Availability }) {
  const base = AVAIL_OPTIONS.find((o) => o.kind === a.kind)!.label
  if (a.kind !== 'from') return <span>{base}</span>
  return (
    <span>
      {base} <span className="font-mono">{ruDate(a.date ?? AVAIL_DEFAULT_DATE)}</span>
    </span>
  )
}

// Вікно знизу «Статус»: три варіанти; для «Готов к контракту с» — поле дати і «Сохранить».
export function AvailabilitySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { value, set } = useAvailability()
  const [kind, setKind] = useState<AvailKind>(value.kind)
  const [date, setDate] = useState(value.date ?? AVAIL_DEFAULT_DATE)

  const choose = (k: AvailKind) => {
    setKind(k)
    if (k !== 'from') {
      set({ kind: k })
      onClose()
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        setKind(value.kind)
        onClose()
      }}
      title="Статус"
      description="Агентства видят его в вашем профиле."
      footer={
        kind === 'from' ? (
          <Button
            size="lg"
            disabled={!date}
            onClick={() => {
              set({ kind: 'from', date })
              onClose()
            }}
          >
            Сохранить
          </Button>
        ) : undefined
      }
    >
      <div role="radiogroup" aria-label="Статус" className="flex flex-col">
        {AVAIL_OPTIONS.map((o) => {
          const Icon = AVAIL_ICON[o.kind]
          const on = o.kind === kind
          return (
            <div key={o.kind} className="flex flex-col border-t border-border first:border-t-0">
              <button type="button" role="radio" aria-checked={on} onClick={() => choose(o.kind)} className="flex min-h-13 items-center gap-3 py-3 text-left">
                <Icon className={cn('size-5 shrink-0', AVAIL_TONE[o.kind])} />
                <span className="flex-1 text-base">
                  {o.label}
                  {o.kind === 'from' && !on && value.kind === 'from' && value.date && <span className="font-mono"> {ruDate(value.date)}</span>}
                  {o.kind === 'from' && !on && value.kind !== 'from' && ' …'}
                </span>
                {on && <Check className="size-5 text-primary" strokeWidth={2.5} />}
              </button>
              {o.kind === 'from' && on && (
                <div className="flex flex-col gap-2 pb-4 pl-8">
                  <span className="text-sm text-muted-foreground">Дата, с которой готовы к контракту</span>
                  <DatePick title="Готов к контракту с" value={ruDate(date)} onChange={(v) => setDate(v.split('.').reverse().join('-'))} {...BOUNDS.future} initial={new Date(date)} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </BottomSheet>
  )
}
