import { useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { StepShell } from '@/components/app/stepper'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { QSheet, TextInput } from '../q/_parts'
import { Chip, ChipWrap, ScrollParam, Section, TextArea, useBag } from './_extra-parts'
import { deptsOf, FLEET_NAMES, positionsOf, typesOf } from './_extra-ref'

// s11 — «О себе» (C: step 11): языки с уровнем, желаемая должность, коротко о себе.
// Правка п. 12: должность — чотири поля по черзі, кожне залежить від попереднього:
// Флот (кілька) → Типы судов (лише вибраних флотів) → Департамент (один) → Желаемые должности
// (лише вибраного департаменту, кілька). Списки — _extra-ref (з KB).
// Як у C, частина вже вибрана: посада з диплома (3rd Engineer) і два типи суден.

const LEVELS = ['A2', 'B1', 'B2', 'C1'] as const
const LANGS = ['Русский', 'Украинский', 'Польский', 'Немецкий', 'Испанский', 'Французский']
type Lang = { name: string; lvl: string }

export function S11About({ go }: ScreenProps) {
  const { bag, setBag } = useBag()
  const eng = bag('s11.eng', 'B1')
  const langs = bag<Lang[]>('s11.langs', [])
  const fleets = bag<string[]>('s11.fleets', ['Merchant'])
  const types = bag<string[]>('s11.types', ['Chemical Tanker', 'Oil Tanker'])
  const dept = bag<string>('s11.dept', 'Engine')
  const pos = bag<string[]>('s11.pos', ['3rd Engineer'])
  const other = bag<string | false>('s11.other', false)
  const about = bag('s11.about', '')
  const [langSheet, setLangSheet] = useState(false)

  const groups = typesOf(fleets)
  const depts = deptsOf(fleets)
  const positions = dept ? positionsOf(dept) : []

  const toggle = (list: string[], x: string) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x])

  // Флот змінився — прибираємо типи суден і департамент, яких більше немає у списку.
  const toggleFleet = (f: string) => {
    const next = toggle(fleets, f)
    const avail = new Set(typesOf(next).flatMap((g) => g.types))
    setBag('s11.fleets', next)
    setBag(
      's11.types',
      types.filter((t) => avail.has(t)),
    )
    if (dept && !deptsOf(next).includes(dept)) pickDept('')
    if (!next.length) pickDept('')
  }
  // Департамент один; інший департамент — інші посади, тож вибрані скидаємо.
  const pickDept = (d: string) => {
    if (d === dept) d = ''
    setBag('s11.dept', d)
    setBag('s11.pos', [])
    setBag('s11.other', false)
  }

  const addLang = (name: string) => {
    setBag('s11.langs', [...langs, { name, lvl: 'B1' }])
    setLangSheet(false)
  }

  return (
    <StepShell step={11} go={go} optional>
      <ScrollParam />

      <Section id="f-lang" title="Языки">
        <div className="flex flex-col gap-3">
          <ul className="overflow-hidden rounded-xl border border-border bg-surface">
            <LangRow name="Английский" value={eng} onChange={(v) => setBag('s11.eng', v)} />
            {langs.map((l, i) => (
              <LangRow
                key={l.name}
                name={l.name}
                value={l.lvl}
                onChange={(lvl) =>
                  setBag(
                    's11.langs',
                    langs.map((x, j) => (j === i ? { ...x, lvl } : x)),
                  )
                }
                onRemove={() =>
                  setBag(
                    's11.langs',
                    langs.filter((_, j) => j !== i),
                  )
                }
              />
            ))}
          </ul>
          {langs.length < LANGS.length && (
            <button type="button" onClick={() => setLangSheet(true)} className="flex items-center gap-2 self-start py-1 text-[15px] font-medium text-primary">
              <Plus className="size-4" />
              Добавить язык
            </button>
          )}
        </div>
      </Section>

      <Section id="f-pos" title="Желаемая должность">
        <Group title="Флот" hint="можно несколько">
          <ChipWrap>
            {FLEET_NAMES.map((f) => (
              <Chip key={f} on={fleets.includes(f)} onClick={() => toggleFleet(f)}>
                {f}
              </Chip>
            ))}
          </ChipWrap>
        </Group>

        <Group title="Типы судов" hint={fleets.length ? 'можно несколько' : undefined}>
          {fleets.length === 0 ? (
            <Wait>Сначала выберите флот</Wait>
          ) : (
            groups.map((g) => (
              <div key={g.fleet} className="flex flex-col gap-2">
                {groups.length > 1 && <span className="text-sm text-muted-foreground">{g.fleet}</span>}
                <ChipWrap>
                  {g.types.map((t) => (
                    <Chip key={t} on={types.includes(t)} onClick={() => setBag('s11.types', toggle(types, t))}>
                      {t}
                    </Chip>
                  ))}
                </ChipWrap>
              </div>
            ))
          )}
        </Group>

        <Group title="Департамент">
          {fleets.length === 0 ? (
            <Wait>Сначала выберите флот</Wait>
          ) : (
            <ChipWrap>
              {depts.map((d) => (
                <Chip key={d} on={dept === d} onClick={() => pickDept(d)}>
                  {d}
                </Chip>
              ))}
            </ChipWrap>
          )}
        </Group>

        <Group title="Желаемые должности" hint={dept ? 'можно несколько' : undefined}>
          {!dept ? (
            <Wait>Сначала выберите департамент</Wait>
          ) : (
            <>
              <ChipWrap>
                {positions.map((p) => (
                  <Chip key={p} on={pos.includes(p)} onClick={() => setBag('s11.pos', toggle(pos, p))}>
                    {p}
                  </Chip>
                ))}
                <Chip on={other !== false} onClick={() => setBag('s11.other', other === false ? '' : false)}>
                  Other
                </Chip>
              </ChipWrap>
              {other !== false && (
                <TextInput aria-label="Другая должность" value={other} onChange={(e) => setBag('s11.other', e.target.value)} placeholder="Название должности" autoFocus />
              )}
            </>
          )}
        </Group>
      </Section>

      <Section title="Коротко о себе" note="Агентства видят это в начале профиля.">
        <TextArea
          aria-label="Коротко о себе"
          rows={4}
          value={about}
          onChange={(e) => setBag('s11.about', e.target.value)}
          placeholder="Опыт, сильные стороны, чем гордитесь в работе"
        />
      </Section>

      <QSheet open={langSheet} onClose={() => setLangSheet(false)} title="Добавить язык">
        <ul className="overflow-hidden rounded-xl border border-border">
          {LANGS.filter((l) => !langs.some((x) => x.name === l)).map((l) => (
            <li key={l} className="border-t border-border first:border-t-0">
              <button type="button" onClick={() => addLang(l)} className="flex w-full px-4 py-3 text-left text-[15px] active:bg-muted">
                {l}
              </button>
            </li>
          ))}
        </ul>
        <Button size="lg" variant="outline" className="mt-5" onClick={() => setLangSheet(false)}>
          Отмена
        </Button>
      </QSheet>
    </StepShell>
  )
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-medium">{title}</h3>
        {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Wait({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">{children}</p>
}

// Мова й рівень: сегмент A2–C1 (C: .lang .lvl).
function LangRow({ name, value, onChange, onRemove }: { name: string; value: string; onChange: (v: string) => void; onRemove?: () => void }) {
  return (
    <li className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
      <span className="flex min-w-0 flex-1 flex-col items-start">
        <span className="truncate text-[15px] font-medium">{name}</span>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-sm text-muted-foreground">
            Удалить
          </button>
        )}
      </span>
      <div role="radiogroup" aria-label={`Уровень, ${name}`} className="flex gap-1 rounded-md border border-border p-1">
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={value === l}
            onClick={() => onChange(l)}
            className={cn(
              'h-8 w-11 rounded-[9px] font-mono text-sm transition-colors duration-150',
              value === l ? 'bg-primary font-medium text-primary-foreground' : 'text-foreground',
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </li>
  )
}
