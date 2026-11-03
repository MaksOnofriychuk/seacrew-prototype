import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { ChevronRight, Info } from 'lucide-react'
import { CountryPick, DatePick, moneyText, NumberPick, PhoneField } from '@/components/app/pickers'
import { FieldMsg } from '@/components/app/field-msg'
import { FleetPicker, type FleetValue } from '@/components/app/fleet-picker'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BOUNDS } from '@/lib/dates'
import { CURRENCIES, MARITAL, PROFILE_DOC, PROFILE_FIELDS, SALARY_PER, type Salary } from '@/lib/data-docs-profile'
import { cn } from '@/lib/utils'
import { parsePhone, phoneIncomplete } from '@/lib/phone'
import { Note, SourceTag, TextInput, useDP, useProfile, type TextField } from './_parts'

// Правка №19д: поля профиля редактируются тут же, под строкой (отдельного экрана «Изменить поле» больше нет).
// Тап по строке раскрывает блок (одновременно открыт один — следит экран), «Сохранить» обновляет значение
// и сворачивает, «Отмена» просто сворачивает. Проверки (ERR, valid) и переключатель Seg — здесь же.

export const ERR: Partial<Record<TextField, string>> = {
  phone: 'Номер неполный',
  email: 'Введите email, например name@example.com.',
}

export const valid = (k: TextField, v: string) => {
  if (!v) return true
  if (k === 'phone') return !phoneIncomplete(parsePhone(v).dial, parsePhone(v).digits)
  if (k === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  return true
}


export type EditKey = TextField | 'rank' | 'salary' | 'theme'

/** Строка-аккордеон: заголовок как MenuRow, под ним плавно раскрывается блок (200 мс, без движения при reduced-motion). */
export function ExpandRow({ icon: I, title, value, open, onToggle, children, className }: { icon?: ComponentType<{ className?: string }>; title: ReactNode; value?: ReactNode; open: boolean; onToggle: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 230)
    return () => window.clearTimeout(t)
  }, [open])
  return (
    <div ref={ref} className={cn('border-t border-border first:border-t-0', className)}>
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex min-h-13 w-full items-center gap-3 px-4 py-3 text-left active:bg-muted/60">
        {I && <I className="size-5 shrink-0 text-primary" />}
        <span className="flex-1 text-[15px]">{title}</span>
        {value !== undefined && <span className="min-w-0 truncate text-[15px] text-muted-foreground">{value}</span>}
        <ChevronRight className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none', open && 'rotate-90')} />
      </button>
      <div className={cn('grid transition-[grid-template-rows,visibility] duration-200 ease-out motion-reduce:transition-none', open ? 'visible grid-rows-[1fr]' : 'invisible grid-rows-[0fr]')}>
        <div className="min-h-0 overflow-hidden" {...(open ? {} : { inert: '' as unknown as boolean })}>
          <div className="border-t border-dashed border-border bg-background/60 px-4 pt-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

function Actions({ onSave, onCancel, disabled }: { onSave: () => void; onCancel: () => void; disabled?: boolean }) {
  return (
    <div className="mt-2 flex gap-3">
      <Button type="button" variant="outline" className="h-11 flex-1 text-[15px]" onClick={onCancel}>
        Отмена
      </Button>
      <Button type="button" className="h-11 flex-1 text-[15px]" disabled={disabled} onClick={onSave}>
        Сохранить
      </Button>
    </div>
  )
}

/** Блок редактирования текстового поля профиля (фамилия, имя, дата, гражданство, телефон, email, семейное положение). */
export function FieldEditor({ k, open, onClose }: { k: TextField; open: boolean; onClose: () => void }) {
  const { showToast } = useDP()
  const p = useProfile()
  const def = PROFILE_FIELDS.find((f) => f.k === k)!
  const current = p.value(k)
  const src = p.source(k)
  const [text, setText] = useState(current)
  const [tried, setTried] = useState(false)
  // Каждое открытие начинается с актуального значения.
  useEffect(() => {
    if (open) {
      setText(p.value(k))
      setTried(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const bad = tried && !valid(k, text.trim())
  const fromDoc = def.src === 'doc'
  const docNote = src === 'doc' || (src === 'edited' && fromDoc) ? PROFILE_DOC : undefined

  const save = () => {
    setTried(true)
    const next = text.trim()
    if (!valid(k, next)) return
    if (next !== current) {
      p.save(k, next)
      showToast(next ? 'Сохранено' : 'Поле очищено')
    }
    onClose()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-6 items-center justify-between gap-3">
        <span className="text-sm font-medium">{def.label}</span>
        {src && k !== 'marital' && <SourceTag kind={src} />}
      </div>
      {k === 'birth' ? (
        <DatePick title={def.label} value={text} onChange={setText} {...BOUNDS.birth} initial={new Date(1998, 5, 15)} />
      ) : k === 'cit' ? (
        <CountryPick title={def.label} value={text} onChange={setText} />
      ) : k === 'phone' ? (
        <PhoneField value={text} invalid={bad} onChange={setText} />
      ) : k === 'marital' ? (
        <Select value={text || undefined} onValueChange={setText}>
          <SelectTrigger aria-label={def.label} className="h-12 w-full px-4 text-base">
            <SelectValue placeholder="Выберите" />
          </SelectTrigger>
          <SelectContent>
            {MARITAL.map((m) => (
              <SelectItem key={m} value={m} className="py-2.5 text-[15px]">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <TextInput
          aria-label={def.label}
          mono={def.mono}
          value={text}
          invalid={bad}
          placeholder={def.ph}
          inputMode={k === 'email' ? 'email' : undefined}
          autoComplete={k === 'email' ? 'email' : undefined}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
      )}
      {(k in ERR || docNote) && <FieldMsg error={bad ? ERR[k] : null} note={docNote} />}
      {fromDoc && <Note icon={Info} className="mt-1">Это значение пришло из документа. Если вы его измените, следующие документы уже не перезапишут его — только предложат своё значение.</Note>}
      <Actions onSave={save} onCancel={onClose} />
    </div>
  )
}

export function RankEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showToast } = useDP()
  const p = useProfile()
  const [v, setV] = useState<FleetValue>(p.rank)
  useEffect(() => {
    if (open) setV(p.rank)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const ok = v.positions.length > 0
  return (
    <div className="flex flex-col gap-2">
      <FleetPicker value={v} onChange={setV} />
      <FieldMsg note={ok ? '' : 'Выберите флот, департамент и должность'} />
      <Actions
        disabled={!ok}
        onCancel={onClose}
        onSave={() => {
          p.saveRank(v)
          showToast('Должность сохранена')
          onClose()
        }}
      />
    </div>
  )
}

export function SalaryEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showToast } = useDP()
  const p = useProfile()
  const [v, setV] = useState<Salary>(p.salary ?? { amount: '', cur: '$', per: 'month' })
  useEffect(() => {
    if (open) setV(p.salary ?? { amount: '', cur: '$', per: 'month' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const digits = v.amount.replace(/\D/g, '')
  const save = () => {
    p.saveSalary(digits ? { ...v, amount: digits } : null)
    showToast(digits ? 'Сохранено' : 'Поле очищено')
    onClose()
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Её видят только агентства. В рейтинге моряков не участвует.</p>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <NumberPick
            title="Желаемая зарплата"
            value={digits}
            onChange={(amount) => setV({ ...v, amount })}
            placeholder="Сумма"
            format={moneyText}
            unit={`${v.cur} ${v.per === 'month' ? 'в месяц' : 'в день'}`}
            {...(v.per === 'month' ? { min: 500, max: 30000, step: 100, initial: 4000 } : { min: 50, max: 1500, step: 10, initial: 150 })}
          />
        </div>
        <Seg label="Валюта" mono value={v.cur} options={CURRENCIES.map((c) => [c, c])} onChange={(cur) => setV({ ...v, cur })} className="w-[132px] shrink-0" />
      </div>
      <Seg label="Период" value={v.per} options={SALARY_PER.map((o) => [o.id, o.label])} onChange={(per) => setV({ ...v, per })} />
      <Actions onSave={save} onCancel={onClose} />
    </div>
  )
}

// Перемикач на 2–3 варіанти — як «Валюта» і «Период оплаты» у фільтрах вакансій.
export function Seg<T extends string>({ label, value, options, onChange, mono, className }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void; mono?: boolean; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex h-12 gap-1 rounded-md border border-border bg-surface p-1', className)}>
      {options.map(([o, l]) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn('flex-1 rounded-[6px] px-2 text-[15px] font-medium transition-colors duration-150', mono && 'font-mono', value === o ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
