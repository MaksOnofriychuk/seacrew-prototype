import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { countryLabel, findCountries } from '@/lib/countries'
import { addYears, daysIn, fmtDate, inRange, MONTHS, parseDate, TODAY } from '@/lib/dates'
import { findDials, flagFor, group, parsePhone, phoneIncomplete, toValue, type Dial } from '@/lib/phone'
import { cn } from '@/lib/utils'

// Вибір дати й країни для вебу: поле-кнопка + випадне вікно під ним. Вписати руками не можна.

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

// Вікно відкривається під полем; якщо знизу не вміщається (край прокрутки, нижня панель) — над полем.
function useFlip(open: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [up, setUp] = useState(false)
  useLayoutEffect(() => {
    if (!open) return setUp(false)
    const el = ref.current
    if (!el) return
    let limit = window.innerHeight
    for (let n = el.parentElement; n; n = n.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(n).overflowY)) {
        limit = Math.min(limit, n.getBoundingClientRect().bottom)
        break
      }
    }
    const r = el.getBoundingClientRect()
    const trigger = el.parentElement!.getBoundingClientRect()
    if (r.bottom > limit && trigger.top > r.height + 16) setUp(true)
  }, [open])
  return [ref, up ? 'bottom-full mb-1' : 'top-full mt-1'] as const
}

function Trigger({ id, open, value, placeholder, icon, mono, onClick, className, disabled }: { disabled?: boolean; id?: string; open: boolean; value: ReactNode; placeholder: string; icon: ReactNode; mono?: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      id={id}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'disabled:opacity-50 flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-surface px-3 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring',
        open && 'border-ring',
        className,
      )}
    >
      <span className={cn('truncate', value ? mono && 'font-mono' : 'text-muted-foreground')}>{value || placeholder}</span>
      <span className="shrink-0 text-muted-foreground">{icon}</span>
    </button>
  )
}

const panel = 'absolute left-0 z-50 rounded-lg border border-border bg-surface p-3 shadow-lg animate-in fade-in-0 zoom-in-95 duration-150'

/* ---------- дата: календар на місяць ---------- */

const WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function WebDatePick({
  id,
  value,
  onChange,
  min = TODAY,
  max = addYears(TODAY, 3),
  placeholder = 'Выберите дату',
  className,
  clearable,
}: {
  clearable?: boolean
  id?: string
  value: string
  onChange: (v: string) => void
  min?: Date | null
  max?: Date | null
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const picked = parseDate(value)
  const base = picked ?? (min && min > TODAY ? min : TODAY)
  const [view, setView] = useState({ y: base.getFullYear(), m: base.getMonth() })
  const ref = useOutside(open, () => setOpen(false))
  const [pref, pos] = useFlip(open)
  const first = (new Date(view.y, view.m, 1).getDay() + 6) % 7
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysIn(view.y, view.m) }, (_, i) => i + 1)]
  const step = (n: number) => setView(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }))
  const canPrev = !min || new Date(view.y, view.m, 1) > new Date(min.getFullYear(), min.getMonth(), 1)
  const canNext = !max || new Date(view.y, view.m, 1) < new Date(max.getFullYear(), max.getMonth(), 1)
  return (
    <div ref={ref} className={cn('relative', className)}>
      <Trigger
        id={id}
        open={open}
        value={value}
        placeholder={placeholder}
        mono
        icon={<CalendarDays className="size-4" />}
        onClick={() => {
          setView({ y: base.getFullYear(), m: base.getMonth() })
          setOpen(!open)
        }}
      />
      {open && (
        <div ref={pref} role="dialog" aria-label="Выбор даты" className={cn(panel, pos, 'w-72')}>
          <div className="mb-2 flex items-center justify-between">
            <button type="button" aria-label="Предыдущий месяц" disabled={!canPrev} onClick={() => step(-1)} className="rounded-md p-1.5 hover:bg-muted disabled:opacity-30">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-medium">
              {MONTHS[view.m]} <span className="font-mono">{view.y}</span>
            </span>
            <button type="button" aria-label="Следующий месяц" disabled={!canNext} onClick={() => step(1)} className="rounded-md p-1.5 hover:bg-muted disabled:opacity-30">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEK.map((w) => (
              <span key={w} className="py-1 text-xs text-muted-foreground">
                {w}
              </span>
            ))}
            {cells.map((d, i) => {
              if (!d) return <span key={`e${i}`} />
              const date = new Date(view.y, view.m, d)
              const ok = inRange(date, min, max)
              const on = !!picked && fmtDate(picked) === fmtDate(date)
              const today = fmtDate(date) === fmtDate(TODAY)
              return (
                <button
                  key={d}
                  type="button"
                  disabled={!ok}
                  onClick={() => {
                    onChange(fmtDate(date))
                    setOpen(false)
                  }}
                  className={cn(
                    'h-8 rounded-md font-mono text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:text-muted-foreground/40',
                    today && 'ring-1 ring-border',
                    on && 'bg-primary text-primary-foreground hover:bg-primary',
                  )}
                >
                  {d}
                </button>
              )
            })}
          </div>
          {clearable && picked && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="mt-2 w-full rounded-md py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              Очистить
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- країна: список з пошуком ---------- */

export function WebCountrySelect({ id, value, onChange, placeholder = 'Выберите страну', className, disabled }: { disabled?: boolean; id?: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const close = () => {
    setOpen(false)
    setQ('')
  }
  const ref = useOutside(open, close)
  const [pref, pos] = useFlip(open)
  const shown = countryLabel(value)
  const list = findCountries(q)
  return (
    <div ref={ref} className={cn('relative', className)}>
      <Trigger id={id} disabled={disabled} open={open} value={shown} placeholder={placeholder} icon={<ChevronDown className="size-4" />} onClick={() => (open ? close() : setOpen(true))} />
      {open && (
        <div ref={pref} role="dialog" aria-label="Выбор страны" className={cn(panel, pos, 'w-72 p-2')}>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus aria-label="Поиск страны" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Название страны" className="h-9 pl-9 text-sm md:text-sm" />
          </div>
          <ul role="listbox" className="mt-2 max-h-60 overflow-y-auto">
            {list.map((c) => {
              const on = shown === c.ru
              return (
                <li key={c.ru}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => {
                      onChange(c.ru)
                      close()
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <span className={cn('flex-1', on && 'font-medium')}>{c.ru}</span>
                    <span className="text-xs text-muted-foreground">{c.en}</span>
                    {on && <Check className="size-3.5 text-primary" />}
                  </button>
                </li>
              )
            })}
            {!list.length && <li className="px-2 py-2 text-sm text-muted-foreground">Такой страны нет в списке.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ---------- телефон: код країни + номер з маскою ---------- */

export function WebPhoneField({ id, value, onChange, disabled, className }: { id?: string; value: string; onChange: (v: string) => void; disabled?: boolean; className?: string }) {
  const [dial, setDial] = useState<Dial>(() => parsePhone(value).dial)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [touched, setTouched] = useState(false)
  const close = () => {
    setOpen(false)
    setQ('')
  }
  const ref = useOutside(open, close)
  const [pref, pos] = useFlip(open)
  const parsed = parsePhone(value)
  useEffect(() => {
    if (value && parsed.dial.dial !== dial.dial) setDial(parsed.dial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  const digits = parsePhone(value, dial).digits
  const bad = touched && phoneIncomplete(dial, digits)
  const list = findDials(q)
  const type = (raw: string) => {
    if (raw.trim().startsWith('+')) {
      const p = parsePhone(raw, dial)
      setDial(p.dial)
      return onChange(toValue(p.dial, p.digits))
    }
    onChange(toValue(dial, raw.replace(/\D/g, '').slice(0, dial.max)))
  }
  return (
    <div ref={ref} className={cn('relative flex flex-col gap-1.5', className)}>
      <div className={cn('flex h-10 items-stretch overflow-hidden rounded-md border border-input bg-surface focus-within:border-ring focus-within:ring-2 focus-within:ring-ring', bad && 'border-signal', disabled && 'opacity-50')}>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Код страны: ${dial.country.ru}, +${dial.dial}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex shrink-0 items-center gap-1.5 border-r border-input pr-2 pl-3 text-sm hover:bg-muted"
        >
          <span aria-hidden="true" className="text-base leading-none">
            {flagFor(dial)}
          </span>
          <span className="font-mono">+{dial.dial}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
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
          className="min-w-0 flex-1 bg-transparent px-3 font-mono text-sm outline-none placeholder:text-muted-foreground/60"
        />
      </div>
      {bad && <p className="text-xs text-signal">Номер неполный</p>}
      {open && (
        <div ref={pref} role="dialog" aria-label="Код страны" className={cn(panel, pos, 'w-72 p-2')}>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus aria-label="Поиск страны или кода" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Страна или код" className="h-9 pl-9 text-sm md:text-sm" />
          </div>
          <ul role="listbox" className="mt-2 max-h-60 overflow-y-auto">
            {list.map((d) => {
              const on = d.country.en === dial.country.en
              return (
                <li key={d.country.en}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => {
                      setDial(d)
                      onChange(toValue(d, digits.slice(0, d.max)))
                      close()
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <span aria-hidden="true">{flagFor(d)}</span>
                    <span className={cn('flex-1', on && 'font-medium')}>{d.country.ru}</span>
                    <span className="font-mono text-xs text-muted-foreground">+{d.dial}</span>
                    {on && <Check className="size-3.5 text-primary" />}
                  </button>
                </li>
              )
            })}
            {!list.length && <li className="px-2 py-2 text-sm text-muted-foreground">Такой страны или кода нет.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
