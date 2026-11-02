import { useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { StepShell } from './_stepper'
import { Badge } from '@/components/ui/badge'
import { AIRPORTS, airportLabel } from '@/lib/data-stepper'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { TextInput } from '../q/_parts'
import { ScrollParam, Section, useBag, XField, XSelect } from './_extra-parts'

// s12 — «Дополнительная информация» (C: step 12): рост, вес, размеры; ближайший аэропорт;
// близкий человек. Правка №29: «Особые приметы» (татуировки, шрамы…) у блоці розмірів. Правка п. 13: у близкого человека — «Имя и фамилия», «Кем приходится»,
// «Телефон», «Email» (необязательно), «Адрес». Адресу самого моряка тут немає.
// «Ближайший аэропорт» — вибір зі списку з пошуком (відповідь замовника 48); список — lib/data-stepper.

type Info = {
  height: string
  weight: string
  suit: string
  shoe: string
  marks: string
  airport: string
  kinName: string
  kinRel: string
  kinPhone: string
  kinEmail: string
  kinAddr: string
}
const EMPTY: Info = { height: '', weight: '', suit: '', shoe: '', marks: '', airport: '', kinName: '', kinRel: '', kinPhone: '', kinEmail: '', kinAddr: '' }
const SUITS = ['M', 'L', 'XL', 'XXL'] as const

const num = (v: string, n: number) => v.replace(/\D/g, '').slice(0, n)

export function S12Extra({ go }: ScreenProps) {
  const { bag, setBag } = useBag()
  const f = bag<Info>('s12.form', EMPTY)
  const patch = (p: Partial<Info>) => setBag('s12.form', { ...f, ...p })

  return (
    <StepShell step={12} go={go} optional>
      <ScrollParam />

      <Section id="f-size" title="Рост, вес и размеры" note="Нужны агентству для спецодежды и обуви.">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <XField id="s12-height" label="Рост, см">
            <TextInput id="s12-height" mono inputMode="numeric" value={f.height} onChange={(e) => patch({ height: num(e.target.value, 3) })} placeholder="180" />
          </XField>
          <XField id="s12-weight" label="Вес, кг">
            <TextInput id="s12-weight" mono inputMode="numeric" value={f.weight} onChange={(e) => patch({ weight: num(e.target.value, 3) })} placeholder="80" />
          </XField>
          <XField id="s12-suit" label="Комбинезон">
            <XSelect id="s12-suit" value={f.suit} onChange={(suit) => patch({ suit })} options={SUITS} placeholder="Размер" />
          </XField>
          <XField id="s12-shoe" label="Обувь">
            <TextInput id="s12-shoe" mono inputMode="numeric" value={f.shoe} onChange={(e) => patch({ shoe: num(e.target.value, 2) })} placeholder="43" />
          </XField>
        </div>
        <XField id="s12-marks" label="Особые приметы">
          <TextInput id="s12-marks" value={f.marks ?? ''} onChange={(e) => patch({ marks: e.target.value })} placeholder="Татуировки, шрамы…" />
        </XField>
      </Section>

      <Section title="Ближайший аэропорт">
        <AirportPick value={f.airport} onChange={(airport) => patch({ airport })} />
      </Section>

      <Section id="f-kin" title="Близкий человек" note="С кем связаться в экстренном случае.">
        <XField id="s12-kin-name" label="Имя и фамилия">
          <TextInput id="s12-kin-name" value={f.kinName} onChange={(e) => patch({ kinName: e.target.value })} placeholder="Например, Olena Koval" autoComplete="off" />
        </XField>
        <div className="grid grid-cols-2 gap-3">
          <XField id="s12-kin-rel" label="Кем приходится">
            <TextInput id="s12-kin-rel" value={f.kinRel} onChange={(e) => patch({ kinRel: e.target.value })} placeholder="Жена" />
          </XField>
          <XField id="s12-kin-phone" label="Телефон">
            <TextInput id="s12-kin-phone" mono type="tel" inputMode="tel" value={f.kinPhone} onChange={(e) => patch({ kinPhone: e.target.value })} placeholder="+380 …" />
          </XField>
        </div>
        <XField
          id="s12-kin-email"
          label="Email"
          tag={
            <Badge variant="outline" className="font-normal text-muted-foreground">
              необязательно
            </Badge>
          }
        >
          <TextInput
            id="s12-kin-email"
            type="email"
            inputMode="email"
            value={f.kinEmail}
            onChange={(e) => patch({ kinEmail: e.target.value })}
            placeholder="name@example.com"
            autoComplete="off"
          />
        </XField>
        <XField id="s12-kin-addr" label="Адрес">
          <TextInput id="s12-kin-addr" value={f.kinAddr} onChange={(e) => patch({ kinAddr: e.target.value })} placeholder="Страна, город, улица, дом" autoComplete="off" />
        </XField>
      </Section>
    </StepShell>
  )
}

// Поле-кнопка: тап відкриває вікно знизу з пошуком за містом, назвою, країною або кодом.
function AirportPick({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const list = AIRPORTS.filter((a) => !needle || [a.city, a.name ?? '', a.en, a.country, a.code].some((x) => x.toLowerCase().includes(needle)))
  const close = () => {
    setOpen(false)
    setQ('')
  }
  return (
    <>
      <button
        type="button"
        id="s12-airport"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-md border border-input bg-surface px-4 text-left text-base active:scale-[0.99]"
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>{value || 'Выберите аэропорт'}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <BottomSheet open={open} onClose={close} title="Ближайший аэропорт">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <TextInput aria-label="Поиск аэропорта" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Город или код, например ODS" className="pl-10" />
        </div>
        {list.length ? (
          <ul className="mt-3 overflow-hidden rounded-xl border border-border">
            {list.map((a) => {
              const label = airportLabel(a)
              const on = value === label
              return (
                <li key={a.code} className="border-t border-border first:border-t-0">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(label)
                      close()
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted"
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn('text-[15px]', on && 'font-semibold')}>
                        {a.city}
                        {a.name && <span className="text-muted-foreground">, {a.name}</span>}
                      </span>
                      <span className="text-sm text-muted-foreground">{a.country}</span>
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">{a.code}</span>
                    {on && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-4 text-[15px] text-muted-foreground">Ничего не нашли. Проверьте название или код.</p>
        )}
      </BottomSheet>
    </>
  )
}
