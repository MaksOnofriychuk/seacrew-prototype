import { Camera, ScanLine } from 'lucide-react'
import { CountryPick, DatePick, PhoneField } from '@/components/app/pickers'
import { BOUNDS } from '@/lib/dates'
import { FleetPicker, FLEET_EMPTY, fleetSummary, type FleetValue } from '@/components/app/fleet-picker'
import { StepShell } from './_stepper'
import type { ScreenProps } from '../registry'
import { Field, TextInput } from '../q/_parts'
import { ScrollAnchor, useS } from './_core-parts'

// s2 — крок 2 «Личные данные». «Заполнить из документа» — тост (дані візьмемо з документа
// моряка на наступному кроці). Фото — тап по колу (у C — перемикач S.photo). Ім'я і прізвище
// заповнені вигаданими значеннями з C; решта — порожні. Крок можна пропустити.
// DOM id f-birth, f-cit, f-phone — для «Показать» у пропущених полях.
// Должность — правки №2, №25: спільний FleetPicker, Флот → Департамент → Должность, по одному (як у контракті).

type Form = {
  first: string
  last: string
  birth: string
  cit: string
  phone: string
  photo: boolean
}


export function S2Personal({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useS()
  const f = bag<Form>('s2.form', {
    first: 'Andrii',
    last: 'Koval',
    birth: '',
    cit: '',
    phone: '',
    photo: false,
  })
  const put = (p: Partial<Form>) => setBag('s2.form', { ...f, ...p })
  const pos = bag<FleetValue>('s2.fleet', FLEET_EMPTY)
  const initials = ((f.first[0] ?? '') + (f.last[0] ?? '')).toUpperCase()

  return (
    <StepShell step={2} go={go} optional>
      <ScrollAnchor />
      <button
        type="button"
        onClick={() => showToast('Данные возьмём из документа моряка на следующем шаге')}
        className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-4 text-left"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
          <ScanLine className="size-5" />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-medium">Заполнить из документа</span>
          <span className="text-sm text-muted-foreground">Имя, фамилия и дата рождения — из удостоверения или диплома</span>
        </span>
      </button>

      <div className="mt-2 flex items-center gap-4">
        <button
          type="button"
          onClick={() => put({ photo: !f.photo })}
          aria-label={f.photo ? 'Убрать фото' : 'Добавить фото'}
          className={
            f.photo
              ? 'flex size-16 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xl font-semibold text-primary active:scale-[0.98]'
              : 'flex size-16 shrink-0 items-center justify-center rounded-full border border-dashed border-primary/50 bg-surface text-primary active:scale-[0.98]'
          }
        >
          {f.photo ? initials || '?' : <Camera className="size-6" />}
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-medium">Фото профиля</span>
          {f.photo ? (
            <span className="flex gap-4 text-sm">
              <button type="button" className="text-primary" onClick={() => put({ photo: true })}>
                Заменить
              </button>
              <button type="button" className="text-muted-foreground" onClick={() => put({ photo: false })}>
                Убрать
              </button>
            </span>
          ) : (
            <button type="button" className="text-left text-sm text-primary" onClick={() => put({ photo: true })}>
              Добавить фото
            </button>
          )}
        </div>
      </div>
      <Field id="s2-first" label="Имя">
        <TextInput id="s2-first" value={f.first} placeholder="Как в документе" autoComplete="given-name" onChange={(e) => put({ first: e.target.value })} />
      </Field>
      <Field id="s2-last" label="Фамилия">
        <TextInput id="s2-last" value={f.last} placeholder="Как в документе" autoComplete="family-name" onChange={(e) => put({ last: e.target.value })} />
      </Field>
      <Field id="f-birth" label="Дата рождения">
        <DatePick id="f-birth" title="Дата рождения" value={f.birth} onChange={(birth) => put({ birth })} {...BOUNDS.birth} initial={new Date(1998, 5, 15)} />
      </Field>
      <div id="f-cit">
        <Field id="s2-cit" label="Гражданство">
          <CountryPick id="s2-cit" title="Гражданство" value={f.cit} onChange={(cit) => put({ cit })} />
        </Field>
      </div>
      <Field id="f-phone" label="Телефон">
        <PhoneField id="f-phone" value={f.phone} onChange={(phone) => put({ phone })} />
      </Field>
      <section className="mt-2 flex flex-col gap-4 border-t border-border pt-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Должность</h2>
          <p className="text-sm text-muted-foreground">{pos.positions.length ? fleetSummary(pos) : 'Флот, департамент, затем должность'}</p>
        </div>
        <FleetPicker value={pos} onChange={(v) => setBag('s2.fleet', v)} />
      </section>
    </StepShell>
  )
}
