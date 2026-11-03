import { useState } from 'react'
import { CountryPick, DatePick, PhoneField } from '@/components/app/pickers'
import { parsePhone, phoneIncomplete } from '@/lib/phone'
import { BOUNDS } from '@/lib/dates'
import { Check, FileCheck, Info, Trash2 } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { FleetPicker, type FleetValue } from '@/components/app/fleet-picker'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { CURRENCIES, MARITAL, PROFILE_DOC, PROFILE_FIELDS, SALARY_PER, type ProfileField, type Salary } from '@/lib/data-docs-profile'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { Note, SourceTag, TextInput, useDP, useHashParam, useProfile, type TextField } from './_parts'

// p21 — «Изменить поле»: одне поле профілю (gaps №6; profile-edit/[field] у застосунку).
// Значення з документа можна змінити: тоді наступні документи його не перезапишуть, лише запропонують
// своє (той самий текст, що в застосунку). «Должность» — флот → департамент → посада (правки №2, №25).
// «Семейное положение» — вибір зі списку, «Желаемая зарплата» — сума, $ € £, за день / за месяц
// (відповіді 46, 134). Поле — з p14 (bag dp.field) або з адреси:
// #p21?f=birth | last | first | cit | phone | email | marital | rank | salary.

const ERR: Partial<Record<TextField, string>> = {
  phone: 'Номер неполный',
  email: 'Введите email, например name@example.com.',
}

const valid = (k: TextField, v: string) => {
  if (!v) return true
  if (k === 'phone') return !phoneIncomplete(parsePhone(v).dial, parsePhone(v).digits)
  if (k === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  return true
}

export function P21Field({ go }: ScreenProps) {
  const { bag } = useDP()
  const fromHash = useHashParam('f')
  const field = (fromHash ?? bag<string>('dp.field', 'birth')) as ProfileField
  const def = PROFILE_FIELDS.find((f) => f.k === field)
  const editor =
    field === 'rank' ? (
      <RankEditor go={go} />
    ) : field === 'salary' ? (
      <SalaryEditor go={go} />
    ) : field === 'marital' ? (
      <MaritalEditor go={go} />
    ) : def ? (
      <TextEditor key={field} k={field as TextField} go={go} />
    ) : (
      <p className="px-6 py-10 text-[15px] text-muted-foreground">Такого поля в профиле нет.</p>
    )

  return (
    <div className="relative flex h-full flex-col">
      <NavBar onBack={() => go('p14')} />
      <ViewState loading={{ kind: 'cards', rows: 1 }} error={{ title: 'Не удалось загрузить профиль' }} empty={editor}>
        {editor}
      </ViewState>
    </div>
  )
}

function TextEditor({ k, go }: { k: TextField; go: ScreenProps['go'] }) {
  const { showToast } = useDP()
  const p = useProfile()
  const def = PROFILE_FIELDS.find((f) => f.k === k)!
  const current = p.value(k)
  const src = p.source(k)
  const [text, setText] = useState(current)
  const [tried, setTried] = useState(false)
  const bad = tried && !valid(k, text.trim())
  // Що було в документі — для поля, яке вже виправили.
  const fromDoc = def.src === 'doc'

  const save = (v: string) => {
    setTried(true)
    const next = v.trim()
    if (!valid(k, next)) return
    if (next !== current) {
      p.save(k, next)
      showToast(next ? 'Сохранено' : 'Поле очищено')
    }
    go('p14')
  }

  return (
    <>
      <div className="screen-in min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">{def.label}</h1>
        <div className="mt-5 flex flex-col gap-2">
          {k === 'birth' ? (
            <DatePick id="p21-input" title={def.label} value={text} onChange={setText} {...BOUNDS.birth} initial={new Date(1998, 5, 15)} />
          ) : k === 'cit' ? (
            <CountryPick id="p21-input" title={def.label} value={text} onChange={setText} />
          ) : k === 'phone' ? (
            <PhoneField id="p21-input" value={text} invalid={bad} onChange={setText} />
          ) : (
            <TextInput
              id="p21-input"
              aria-label={def.label}
              autoFocus
              mono={def.mono}
              value={text}
              invalid={bad}
              placeholder={def.ph}
              inputMode={k === 'email' ? 'email' : undefined}
              autoComplete={k === 'email' ? 'email' : undefined}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save(text)}
            />
          )}
          {bad && <p className="text-sm text-signal">{ERR[k]}</p>}
          {src && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <SourceTag kind={src} />
              {(src === 'doc' || (src === 'edited' && fromDoc)) && (
                <span className="flex items-center gap-1.5">
                  <FileCheck className="size-4 shrink-0 text-primary" />
                  {PROFILE_DOC}
                </span>
              )}
            </p>
          )}
        </div>

        {fromDoc && <Note icon={Info} className="mt-5">Это значение пришло из документа. Если вы его измените, следующие документы уже не перезапишут его — только предложат своё значение.</Note>}

        {current && (
          <button type="button" onClick={() => save('')} className="mt-8 flex items-center gap-2 px-1 text-[15px] font-medium text-signal">
            <Trash2 className="size-4" />
            Очистить
          </button>
        )}
      </div>
      <Footer className="border-t border-border pt-4">
        <Button size="lg" onClick={() => save(text)}>
          Сохранить
        </Button>
      </Footer>
    </>
  )
}

function RankEditor({ go }: { go: ScreenProps['go'] }) {
  const { showToast } = useDP()
  const p = useProfile()
  const [v, setV] = useState<FleetValue>(p.rank)
  const ok = v.positions.length > 0

  const save = () => {
    p.saveRank(v)
    showToast('Должность сохранена')
    go('p14')
  }

  return (
    <>
      <div className="screen-in min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
        <h1 className="mb-6 text-[32px] leading-[1.1] font-semibold tracking-tight">Должность</h1>
        <FleetPicker value={v} onChange={setV} />
      </div>
      <Footer className="border-t border-border pt-4">
        <Button size="lg" disabled={!ok} onClick={save}>
          Сохранить
        </Button>
        <p className="min-h-5 text-center text-sm text-muted-foreground">{ok ? '' : 'Выберите флот, департамент и должность'}</p>
      </Footer>
    </>
  )
}

// Сімейний стан: один зі списку, тап одразу зберігає.
function MaritalEditor({ go }: { go: ScreenProps['go'] }) {
  const { showToast } = useDP()
  const p = useProfile()
  const current = p.value('marital')
  const pick = (v: string) => {
    if (v !== current) {
      p.save('marital', v)
      showToast('Сохранено')
    }
    go('p14')
  }
  return (
    <div className="screen-in min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
      <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Семейное положение</h1>
      <p className="mt-3 text-base text-muted-foreground">Нужно для анкет агентств.</p>
      <div role="radiogroup" aria-label="Семейное положение" className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        {MARITAL.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={m === current} onClick={() => pick(m)} className="flex min-h-13 w-full items-center gap-3 border-t border-border px-4 py-3 text-left first:border-t-0 active:bg-muted/60">
            <span className={cn('flex-1 text-[15px]', m === current && 'font-medium')}>{m}</span>
            {m === current && <Check className="size-5 shrink-0 text-primary" strokeWidth={2.5} />}
          </button>
        ))}
      </div>
    </div>
  )
}

// Желаемая зарплата: сума, валюта $ € £, за день або за місяць.
function SalaryEditor({ go }: { go: ScreenProps['go'] }) {
  const { showToast } = useDP()
  const p = useProfile()
  const [v, setV] = useState<Salary>(p.salary ?? { amount: '', cur: '$', per: 'month' })
  const digits = v.amount.replace(/\D/g, '')
  const save = () => {
    p.saveSalary(digits ? { ...v, amount: digits } : null)
    showToast(digits ? 'Сохранено' : 'Поле очищено')
    go('p14')
  }
  return (
    <>
      <div className="screen-in min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Желаемая зарплата</h1>
        <p className="mt-3 text-base text-muted-foreground">Её видят только агентства. В рейтинге моряков не участвует.</p>
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex gap-2">
            <TextInput
              aria-label="Сумма"
              autoFocus
              mono
              inputMode="numeric"
              placeholder="Сумма"
              value={digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
              onChange={(e) => setV({ ...v, amount: e.target.value.replace(/\D/g, '').slice(0, 7) })}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              className="flex-1"
            />
            <Seg label="Валюта" mono value={v.cur} options={CURRENCIES.map((c) => [c, c])} onChange={(cur) => setV({ ...v, cur })} className="w-[132px]" />
          </div>
          <Seg label="Период" value={v.per} options={SALARY_PER.map((o) => [o.id, o.label])} onChange={(per) => setV({ ...v, per })} />
        </div>
      </div>
      <Footer className="border-t border-border pt-4">
        <Button size="lg" onClick={save}>
          Сохранить
        </Button>
      </Footer>
    </>
  )
}

// Перемикач на 2–3 варіанти — як «Валюта» і «Период оплаты» у фільтрах вакансій.
function Seg<T extends string>({ label, value, options, onChange, mono, className }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void; mono?: boolean; className?: string }) {
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
