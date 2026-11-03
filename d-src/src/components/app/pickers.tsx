import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CalendarDays, Check, ChevronDown, Search } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { countryLabel, findCountries } from '@/lib/countries'
import { findDials, flagFor, group, parsePhone, phoneIncomplete, toValue, type Dial } from '@/lib/phone'
import { clampDate, daysIn, fmtDate, fmtMonth, inRange, MONTHS, MONTHS_SHORT, parseDate, parseMonth, TODAY } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { FieldMsg } from '@/components/app/field-msg'

// Поле-кнопка: виглядає як поле вводу, тап відкриває вікно знизу. Вписати руками нічого не можна.
function PickField({
  id,
  value,
  placeholder,
  icon,
  mono,
  invalid,
  disabled,
  className,
  onOpen,
}: {
  className?: string
  id?: string
  value: ReactNode
  placeholder: string
  icon: ReactNode
  mono?: boolean
  invalid?: boolean
  disabled?: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      id={id}
      aria-haspopup="dialog"
      aria-invalid={invalid || undefined}
      disabled={disabled}
      onClick={onOpen}
      className={cn(
        'flex h-12 w-full items-center justify-between gap-3 rounded-md border border-input bg-surface px-4 text-left text-base transition-transform active:scale-[0.99] disabled:opacity-50',
        invalid && 'border-signal',
        className,
      )}
    >
      <span className={cn('truncate', value ? mono && 'font-mono' : 'text-muted-foreground')}>{value || placeholder}</span>
      <span className="shrink-0 text-muted-foreground">{icon}</span>
    </button>
  )
}

/* ---------- країна: список з пошуком ---------- */

export function CountryPick({
  id,
  value,
  onChange,
  title = 'Страна',
  placeholder = 'Выберите страну',
  invalid,
  disabled,
  className,
}: {
  className?: string
  id?: string
  value: string
  onChange: (v: string) => void
  title?: string
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const shown = countryLabel(value)
  const list = findCountries(q)
  const close = () => {
    setOpen(false)
    setQ('')
  }
  return (
    <>
      <PickField id={id} value={shown} placeholder={placeholder} icon={<ChevronDown className="size-4" />} invalid={invalid} disabled={disabled} className={className} onOpen={() => setOpen(true)} />
      <BottomSheet
        open={open}
        onClose={close}
        title={title}
        fixed
        head={
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Поиск страны" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Название страны" className="h-12 pl-10 text-base md:text-base" />
          </div>
        }
      >
        {list.length ? (
          <ul className="overflow-hidden rounded-xl border border-border">
            {list.map((c) => {
              const on = shown === c.ru
              return (
                <li key={c.ru} className="border-t border-border first:border-t-0">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c.ru)
                      close()
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted"
                  >
                    <span className={cn('flex-1 text-[15px]', on && 'font-semibold')}>{c.ru}</span>
                    <span className="text-sm text-muted-foreground">{c.en}</span>
                    {on && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-[15px] text-muted-foreground">Такой страны нет в списке. Проверьте название.</p>
        )}
      </BottomSheet>
    </>
  )
}

/* ---------- колонки-барабани ---------- */

type Item = { v: number; label: string; off?: boolean }

// Колонка-барабан: вибране — те, що зупинилось по центру після прокрутки (або тап по рядку).
// Недоступні значення тьмяні: якщо прокрутка зупинилась на них, барабан повертається до вибраного.
const ROW = 48

function Wheel({ label, items, value, onChange, mono }: { label: string; items: Item[]; value: number; onChange: (v: number) => void; mono?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const at = items.findIndex((it) => it.v === value)
  useEffect(() => {
    const el = ref.current
    if (el && at >= 0 && Math.abs(el.scrollTop - at * ROW) > 2) el.scrollTo({ top: at * ROW })
  }, [at, items.length])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const settle = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const el = ref.current
      if (!el) return
      const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ROW)))
      const it = items[i]
      if (it && !it.off) {
        if (it.v !== value) onChange(it.v)
      } else if (at >= 0) el.scrollTo({ top: at * ROW, behavior: 'smooth' })
    }, 140)
  }
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="mb-2 text-center text-sm text-muted-foreground">{label}</span>
      {/* Рамка — на обгортці, а згасання — лише на списку: порожнє місце над першим рядком стає м'яким переходом. */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-2 top-1/2 h-12 -translate-y-1/2 rounded-lg bg-primary/10" />
      <div ref={ref} role="listbox" aria-label={label} onScroll={settle} className="relative h-44 snap-y snap-mandatory overflow-y-auto overscroll-contain py-16 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]">
        {items.map((it) => {
          const on = it.v === value
          return (
            <button
              key={it.v}
              type="button"
              role="option"
              aria-selected={on}
              data-on={on}
              disabled={it.off}
              onClick={() => onChange(it.v)}
              className={cn(
                'flex h-12 w-full snap-center items-center justify-center text-base transition-colors outline-none',
                mono && 'font-mono',
                on ? 'font-semibold text-primary' : 'text-foreground',
                it.off && 'text-muted-foreground/40',
              )}
            >
              {it.label}
            </button>
          )
        })}
      </div>
      </div>
    </div>
  )
}

const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i)

function DateWheels({ value, onChange, min, max }: { value: Date; onChange: (d: Date) => void; min?: Date | null; max?: Date | null }) {
  const y = value.getFullYear()
  const m = value.getMonth()
  const yMin = min?.getFullYear() ?? 1940
  const yMax = max?.getFullYear() ?? TODAY.getFullYear() + 30
  const set = (yy: number, mm: number, dd: number) => onChange(clampDate(new Date(yy, mm, Math.min(dd, daysIn(yy, mm))), min, max))
  return (
    <div className="flex gap-2">
      <Wheel
        label="День"
        mono
        value={value.getDate()}
        items={range(1, daysIn(y, m)).map((d) => ({ v: d, label: String(d).padStart(2, '0'), off: !inRange(new Date(y, m, d), min, max) }))}
        onChange={(d) => set(y, m, d)}
      />
      <Wheel
        label="Месяц"
        value={m}
        items={MONTHS.map((label, i) => ({ v: i, label, off: !inRange(new Date(y, i, 1), min && new Date(min.getFullYear(), min.getMonth(), 1), max) }))}
        onChange={(mm) => set(y, mm, value.getDate())}
      />
      <Wheel label="Год" mono value={y} items={range(yMin, yMax).reverse().map((v) => ({ v, label: String(v) }))} onChange={(yy) => set(yy, m, value.getDate())} />
    </div>
  )
}

/* ---------- дата ---------- */

export function DatePick({
  id,
  value,
  onChange,
  title,
  min,
  max,
  placeholder = 'Выбрать',
  invalid,
  disabled,
  initial,
  className,
}: {
  className?: string
  id?: string
  value: string
  onChange: (v: string) => void
  title: string
  min?: Date | null
  max?: Date | null
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  initial?: Date
}) {
  const [open, setOpen] = useState(false)
  const start = () => clampDate(parseDate(value) ?? initial ?? TODAY, min, max)
  const [draft, setDraft] = useState(start)
  const show = () => {
    setDraft(start())
    setOpen(true)
  }
  return (
    <>
      <PickField id={id} value={value} placeholder={placeholder} icon={<CalendarDays className="size-4" />}
        mono
        invalid={invalid || (!!parseDate(value) && !inRange(parseDate(value)!, min, max))}
        disabled={disabled}
        className={className}
        onOpen={show}
      />
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        aside={<span className="font-mono text-base text-muted-foreground">{fmtDate(draft)}</span>}
        footer={
          <Button
            className="h-12 text-base"
            onClick={() => {
              onChange(fmtDate(draft))
              setOpen(false)
            }}
          >
            Готово
          </Button>
        }
      >
        <DateWheels value={draft} onChange={setDraft} min={min} max={max} />
      </BottomSheet>
    </>
  )
}

/* ---------- період: місяць — місяць ---------- */

type Ym = { y: number; m: number }
const ymKey = (a: Ym) => a.y * 12 + a.m
const thisMonth: Ym = { y: TODAY.getFullYear(), m: TODAY.getMonth() }

function MonthWheels({ value, onChange, min, max }: { value: Ym; onChange: (v: Ym) => void; min: Ym; max: Ym }) {
  const fit = (v: Ym): Ym => (ymKey(v) < ymKey(min) ? min : ymKey(v) > ymKey(max) ? max : v)
  return (
    <div className="flex gap-2">
      <Wheel
        label="Месяц"
        value={value.m}
        items={MONTHS.map((label, i) => ({ v: i, label, off: ymKey({ y: value.y, m: i }) < ymKey(min) || ymKey({ y: value.y, m: i }) > ymKey(max) }))}
        onChange={(m) => onChange(fit({ y: value.y, m }))}
      />
      <Wheel label="Год" mono value={value.y} items={range(min.y, max.y).reverse().map((v) => ({ v, label: String(v) }))} onChange={(y) => onChange(fit({ y, m: value.m }))} />
    </div>
  )
}

const ymText = (v: Ym) => `${MONTHS_SHORT[v.m]} ${v.y}`

// Значення — «ММ.ГГГГ – ММ.ГГГГ». «По» не раніше «с» і не пізніше поточного місяця.
export function MonthRangePick({
  id,
  value,
  onChange,
  title = 'Период',
  placeholder = 'Выберите период',
  invalid,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  title?: string
  placeholder?: string
  invalid?: boolean
}) {
  const [a, b] = value.split(/\s*[–-]\s*/)
  const from0 = parseMonth(a)
  const to0 = parseMonth(b)
  const [open, setOpen] = useState(false)
  const [side, setSide] = useState<'from' | 'to'>('from')
  const [from, setFrom] = useState<Ym>(from0 ?? { y: thisMonth.y - 1, m: thisMonth.m })
  const [to, setTo] = useState<Ym>(to0 ?? thisMonth)
  const earliest: Ym = { y: 1980, m: 0 }
  const show = () => {
    setFrom(from0 ?? { y: thisMonth.y - 1, m: thisMonth.m })
    setTo(to0 ?? thisMonth)
    setSide('from')
    setOpen(true)
  }
  const setFromFit = (v: Ym) => {
    setFrom(v)
    if (ymKey(to) < ymKey(v)) setTo(v)
  }
  const shown = from0 && to0 ? `${fmtMonth(from0.y, from0.m)} – ${fmtMonth(to0.y, to0.m)}` : ''
  const tab = (k: 'from' | 'to', label: string, v: Ym) => (
    <button
      type="button"
      onClick={() => setSide(k)}
      aria-pressed={side === k}
      className={cn('flex flex-1 flex-col items-start rounded-xl border px-4 py-2.5 text-left transition-colors', side === k ? 'border-primary bg-primary/10' : 'border-border')}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base font-medium">{ymText(v)}</span>
    </button>
  )
  return (
    <>
      <PickField id={id} value={shown} placeholder={placeholder} icon={<CalendarDays className="size-4" />} mono invalid={invalid} onOpen={show} />
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          <Button
            className="h-12 text-base"
            onClick={() => {
              onChange(`${fmtMonth(from.y, from.m)} – ${fmtMonth(to.y, to.m)}`)
              setOpen(false)
            }}
          >
            Готово
          </Button>
        }
      >
        <div className="mb-4 flex gap-2">
          {tab('from', 'С', from)}
          {tab('to', 'По', to)}
        </div>
        {side === 'from' ? (
          <MonthWheels key="from" value={from} onChange={setFromFit} min={earliest} max={thisMonth} />
        ) : (
          <MonthWheels key="to" value={to} onChange={setTo} min={from} max={thisMonth} />
        )}
      </BottomSheet>
    </>
  )
}

// Один місяць «ММ.ГГГГ» (окремі поля «С» / «По»).
export function MonthPick({
  id,
  value,
  onChange,
  title,
  min,
  max = thisMonth,
  placeholder = 'Выбрать',
  invalid,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  title: string
  min?: Ym | null
  max?: Ym
  placeholder?: string
  invalid?: boolean
}) {
  const [open, setOpen] = useState(false)
  const lo = min ?? { y: 1980, m: 0 }
  const [draft, setDraft] = useState<Ym>(parseMonth(value) ?? max)
  const show = () => {
    setDraft(parseMonth(value) ?? max)
    setOpen(true)
  }
  return (
    <>
      <PickField id={id} value={value} placeholder={placeholder} icon={<CalendarDays className="size-4" />} mono invalid={invalid} onOpen={show} />
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          <Button
            className="h-12 text-base"
            onClick={() => {
              onChange(fmtMonth(draft.y, draft.m))
              setOpen(false)
            }}
          >
            Готово
          </Button>
        }
      >
        <MonthWheels value={draft} onChange={setDraft} min={lo} max={max} />
      </BottomSheet>
    </>
  )
}


/* ---------- телефон: код країни + номер з маскою ---------- */

export function PhoneField(props: {
  id?: string
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  disabled?: boolean
}) {
  const { id, value, onChange, invalid, disabled } = props
  // Свій рядок «Номер неполный» з резервом; якщо вирішує батько (передав invalid) — рядок у його полі.
  const own = !('invalid' in props)
  const parsed = parsePhone(value)
  const [dial, setDial] = useState<Dial>(parsed.dial)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [touched, setTouched] = useState(false)
  // Значення змінили ззовні (скинули, підставили з іншого джерела) — підтягуємо код.
  useEffect(() => {
    if (value && parsed.dial.dial !== dial.dial) setDial(parsed.dial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  const digits = parsePhone(value, dial).digits
  const bad = invalid || (touched && phoneIncomplete(dial, digits))
  const list = findDials(q)
  const close = () => {
    setOpen(false)
    setQ('')
  }
  const type = (raw: string) => {
    // Вставили номер із кодом — розкладаємо його на код і цифри.
    if (raw.trim().startsWith('+')) {
      const p = parsePhone(raw, dial)
      setDial(p.dial)
      return onChange(toValue(p.dial, p.digits))
    }
    onChange(toValue(dial, raw.replace(/\D/g, '').slice(0, dial.max)))
  }
  return (
    <div className="flex flex-col gap-2">
      <div className={cn('flex h-12 items-stretch overflow-hidden rounded-md border border-input bg-surface focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40', bad && 'border-signal', disabled && 'opacity-50')}>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Код страны: ${dial.country.ru}, +${dial.dial}`}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className="flex shrink-0 items-center gap-1.5 border-r border-input pr-2.5 pl-3.5 text-base active:bg-muted"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            {flagFor(dial)}
          </span>
          <span className="font-mono">+{dial.dial}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          disabled={disabled}
          aria-invalid={bad || undefined}
          value={group(digits, dial)}
          placeholder={group('0'.repeat(dial.min), dial)}
          onChange={(e) => type(e.target.value)}
          onBlur={() => setTouched(true)}
          className="min-w-0 flex-1 bg-transparent px-3.5 font-mono text-base outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
        />
      </div>
      {own && <FieldMsg error={bad ? 'Номер неполный' : null} />}
      <BottomSheet
        open={open}
        onClose={close}
        title="Код страны"
        fixed
        head={
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Поиск страны или кода" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Страна или код" className="h-12 pl-10 text-base md:text-base" />
          </div>
        }
      >
        {list.length ? (
          <ul className="overflow-hidden rounded-xl border border-border">
            {list.map((d) => {
              const on = d.country.en === dial.country.en
              return (
                <li key={d.country.en} className="border-t border-border first:border-t-0">
                  <button
                    type="button"
                    onClick={() => {
                      setDial(d)
                      onChange(toValue(d, digits.slice(0, d.max)))
                      close()
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted"
                  >
                    <span aria-hidden="true" className="text-xl leading-none">
                      {flagFor(d)}
                    </span>
                    <span className={cn('flex-1 text-[15px]', on && 'font-semibold')}>{d.country.ru}</span>
                    <span className="font-mono text-sm text-muted-foreground">+{d.dial}</span>
                    {on && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-[15px] text-muted-foreground">Такой страны или кода нет в списке.</p>
        )}
      </BottomSheet>
    </div>
  )
}

// Рік «ГГГГ» (роки навчання тощо). Межі min/max — роки; недоступні тьмяні.
export function YearPick({
  id,
  value,
  onChange,
  title,
  min = 1960,
  max = TODAY.getFullYear(),
  placeholder = 'Выбрать',
  invalid,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  title: string
  min?: number
  max?: number
  placeholder?: string
  invalid?: boolean
}) {
  const [open, setOpen] = useState(false)
  const fit = (y: number) => Math.min(max, Math.max(min, y))
  const [draft, setDraft] = useState(() => fit(Number(value) || max))
  const show = () => {
    setDraft(fit(Number(value) || max))
    setOpen(true)
  }
  return (
    <>
      <PickField id={id} value={value} placeholder={placeholder} icon={<CalendarDays className="size-4" />} mono invalid={invalid} onOpen={show} />
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          <Button
            className="h-12 text-base"
            onClick={() => {
              onChange(String(draft))
              setOpen(false)
            }}
          >
            Готово
          </Button>
        }
      >
        <Wheel label="Год" mono value={draft} items={range(min, max).reverse().map((v) => ({ v, label: String(v) }))} onChange={setDraft} />
      </BottomSheet>
    </>
  )
}

// Число з діапазону (рост, вес, размер обуви, зарплата, тривалість): барабан, без введення.
// Порожнє значення — барабан стає на `initial` (або на «Любая», якщо є emptyLabel).
export function NumberPick({
  id,
  value,
  onChange,
  title,
  min,
  max,
  initial,
  unit,
  placeholder = 'Выбрать',
  invalid,
  disabled,
  step = 1,
  format,
  emptyLabel,
  prefix,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  title: string
  min: number
  max: number
  initial: number
  unit?: string
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  /** крок барабана (зарплата — 100, за день — 10) */
  step?: number
  /** як показати число в полі й у барабані («4 000») */
  format?: (n: number) => string
  /** перший рядок барабана — «без значення» (фільтри: «Любая»); вибір дає '' */
  emptyLabel?: string
  /** текст поля перед числом («от») */
  prefix?: string
}) {
  const [open, setOpen] = useState(false)
  const show = (n: number) => (format ? format(n) : String(n))
  const snap = (n: number) => Math.min(max, Math.max(min, Math.round((n - min) / step) * step + min))
  const start = () => (Number(value) ? snap(Number(value)) : emptyLabel ? 0 : snap(initial))
  const [draft, setDraft] = useState(start)
  const openSheet = () => {
    setDraft(start())
    setOpen(true)
  }
  const values: Item[] = []
  for (let v = min; v <= max; v += step) values.push({ v, label: show(v) })
  const items = emptyLabel ? [{ v: 0, label: emptyLabel }, ...values] : values
  const shown = Number(value) ? `${prefix ? prefix + ' ' : ''}${show(Number(value))}` : ''
  return (
    <>
      <PickField id={id} value={shown} placeholder={placeholder} icon={<ChevronDown className="size-4" />} mono invalid={invalid} disabled={disabled} onOpen={openSheet} />
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          <Button
            className="h-12 text-base"
            onClick={() => {
              onChange(draft ? String(draft) : '')
              setOpen(false)
            }}
          >
            Готово
          </Button>
        }
      >
        {items.length <= 16 ? (
          // Короткий список — сітка кнопок замість барабана: без порожнього місця над першим рядком.
          <div className="flex flex-col gap-2">
            {unit && <span className="text-center text-sm text-muted-foreground">{unit}</span>}
            <div role="listbox" aria-label={unit ?? title} className="grid grid-cols-4 gap-2">
              {items.map((it) => {
                const on = it.v === draft
                return (
                  <button
                    key={it.v}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => setDraft(it.v)}
                    className={cn(
                      'flex h-12 items-center justify-center rounded-lg border text-base transition-colors active:scale-[0.98]',
                      it.v === 0 ? 'col-span-2' : 'font-mono',
                      on ? 'border-primary bg-primary/10 font-semibold text-primary' : 'border-border text-foreground',
                    )}
                  >
                    {it.label}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <Wheel label={unit ?? title} mono value={draft} items={items} onChange={setDraft} />
        )}
      </BottomSheet>
    </>
  )
}

export const SIZE_RANGES = {
  height: { min: 140, max: 220, initial: 180, unit: 'см' },
  weight: { min: 40, max: 160, initial: 80, unit: 'кг' },
  shoe: { min: 35, max: 50, initial: 43, unit: 'EU' },
} as const

export const moneyText = (n: number) => n.toLocaleString('ru-RU').replace(/[\u00a0\u202f]/g, ' ')

// Барабан числа без поля (для вікон, що вже відкриті, — напр. «Моя зарплата»).
export function NumberWheel({ value, onChange, min, max, step = 1, format, label }: { value: number; onChange: (n: number) => void; min: number; max: number; step?: number; format?: (n: number) => string; label: string }) {
  const items: Item[] = []
  for (let v = min; v <= max; v += step) items.push({ v, label: format ? format(v) : String(v) })
  const snapped = Math.min(max, Math.max(min, Math.round((value - min) / step) * step + min))
  return <Wheel label={label} mono value={snapped} items={items} onChange={onChange} />
}
