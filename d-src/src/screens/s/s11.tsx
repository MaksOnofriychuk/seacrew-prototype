import { useState } from 'react'
import { Plus } from 'lucide-react'
import { FleetPicker, fleetSummary, type FleetValue } from '@/components/app/fleet-picker'
import { StepShell } from './_stepper'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { QSheet } from '../q/_parts'
import { ScrollParam, Section, TextArea, useBag } from './_extra-parts'

// s11 — «О себе» (C: step 11): языки с уровнем, желаемая должность, коротко о себе.
// Правки №2, №25: желаемая должность — спільний FleetPicker: Флот (кілька) → Департамент (один) →
// Должность (кілька); кожен наступний список — лише під вибране. Списки — FLEET_TREE у lib/data.
// Як у C, частина вже вибрана: Merchant → Engine → 3rd Engineer (посада з диплома).

const LEVELS = ['A2', 'B1', 'B2', 'C1'] as const
// «Коротко о себе» — не більше 1000 символів (відповідь замовника 44).
const ABOUT_MAX = 1000
const LANGS = ['Русский', 'Украинский', 'Польский', 'Немецкий', 'Испанский', 'Французский']
type Lang = { name: string; lvl: string }

export function S11About({ go }: ScreenProps) {
  const { bag, setBag } = useBag()
  const eng = bag('s11.eng', 'B1')
  const langs = bag<Lang[]>('s11.langs', [])
  const pos = bag<FleetValue>('s11.fleet', { fleets: ['Merchant'], department: 'Engine', positions: ['3rd Engineer'] })
  const about = bag('s11.about', '')
  const [langSheet, setLangSheet] = useState(false)

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

      <Section id="f-pos" title="Желаемая должность" note={pos.positions.length ? fleetSummary(pos) : undefined}>
        <FleetPicker value={pos} onChange={(v) => setBag('s11.fleet', v)} multiFleet multiPosition labels={{ position: 'Желаемые должности' }} />
      </Section>

      <Section title="Коротко о себе" note="Агентства видят это в начале профиля.">
        <div className="flex flex-col gap-1.5">
          <TextArea
            aria-label="Коротко о себе"
            aria-describedby="s11-about-count"
            rows={4}
            maxLength={ABOUT_MAX}
            value={about}
            onChange={(e) => setBag('s11.about', e.target.value.slice(0, ABOUT_MAX))}
            placeholder="Опыт, сильные стороны, чем гордитесь в работе"
          />
          <span id="s11-about-count" className={cn('self-end font-mono text-sm', about.length >= ABOUT_MAX ? 'text-warning' : 'text-muted-foreground')}>
            {about.length} / {ABOUT_MAX}
          </span>
        </div>
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
