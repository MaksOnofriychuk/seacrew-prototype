import { Camera, ScanLine } from 'lucide-react'
import { StepShell } from '@/components/app/stepper'
import type { ScreenProps } from '../registry'
import { Field, TextInput } from '../q/_parts'
import { maskDate, Pick, ScrollAnchor, useS } from './_core-parts'

// s2 — крок 2 «Личные данные». «Заполнить из документа» — тост (дані візьмемо з документа
// моряка на наступному кроці). Фото — тап по колу (у C — перемикач S.photo). Ім'я і прізвище
// заповнені вигаданими значеннями з C; решта — порожні. Крок можна пропустити.
// DOM id f-birth, f-cit, f-phone — для «Показать» у пропущених полях.

type Form = {
  first: string
  last: string
  birth: string
  cit: string
  phone: string
  rank: string
  photo: boolean
}

const COUNTRIES = ['Украина', 'Филиппины', 'Индия', 'Польша']
const RANKS = ['3rd Engineer', '2nd Engineer', 'Chief Officer', 'AB Seaman']

export function S2Personal({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useS()
  const f = bag<Form>('s2.form', {
    first: 'Andrii',
    last: 'Koval',
    birth: '',
    cit: '',
    phone: '',
    rank: '',
    photo: false,
  })
  const put = (p: Partial<Form>) => setBag('s2.form', { ...f, ...p })
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
              ? 'flex size-20 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-2xl font-semibold text-primary'
              : 'flex size-20 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border border-border bg-surface text-xs leading-tight font-medium text-primary'
          }
        >
          {f.photo ? (
            initials || '?'
          ) : (
            <>
              <Camera className="size-5" />
              Добавить
              <br />
              фото
            </>
          )}
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Field id="s2-first" label="Имя">
            <TextInput id="s2-first" value={f.first} placeholder="Как в документе" autoComplete="given-name" onChange={(e) => put({ first: e.target.value })} />
          </Field>
          <Field id="s2-last" label="Фамилия">
            <TextInput id="s2-last" value={f.last} placeholder="Как в документе" autoComplete="family-name" onChange={(e) => put({ last: e.target.value })} />
          </Field>
        </div>
      </div>
      <Field id="f-birth" label="Дата рождения">
        <TextInput id="f-birth" mono inputMode="numeric" value={f.birth} placeholder="ДД.ММ.ГГГГ" onChange={(e) => put({ birth: maskDate(e.target.value) })} />
      </Field>
      <div id="f-cit">
        <Pick id="s2-cit" label="Гражданство" value={f.cit} options={COUNTRIES} placeholder="Выберите страну" onChange={(cit) => put({ cit })} />
      </div>
      <Field id="f-phone" label="Телефон">
        <TextInput id="f-phone" type="tel" mono value={f.phone} placeholder="+380 …" className="placeholder:font-sans" onChange={(e) => put({ phone: e.target.value })} />
      </Field>
      <Pick id="s2-rank" label="Должность" value={f.rank} options={RANKS} placeholder="Выберите должность" onChange={(rank) => put({ rank })} />
    </StepShell>
  )
}
