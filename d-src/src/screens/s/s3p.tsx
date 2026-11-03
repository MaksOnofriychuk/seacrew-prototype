import { useEffect, useRef, useState } from 'react'
import { CountryPick, DatePick } from '@/components/app/pickers'
import { BOUNDS } from '@/lib/dates'
import { Camera, FolderOpen, Image, LoaderCircle, Lock, Pencil, PenLine, Plus, Stamp, Trash2 } from 'lucide-react'
import { Paper } from '@/components/app/paper'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from '../registry'
import { Field, QSheet, TextInput } from '../q/_parts'
import { AddPanel, RowList, ScrollAnchor, SectionTitle, useBusy, useHashParams, useS } from './_core-parts'
import { PASS, StepShell } from './_stepper'

// s3p — «Загранпаспорт и визы» (правка №36), крок «Основного» після документа моряка.
// Паспорт один: номер, страна выдачи, дата выдачи, действителен до, фото страницы с данными.
// Візи — скільки завгодно: страна, тип (C1/D, Schengen…), номер, дата выдачи, действительна до, фото.
// Додати — як решту документів: фото, файл (ИИ розпізнає, у прототипі — пауза) або вручную.
// Рекрутер бачить візи, файлів паспорта й віз не бачить (№30) — про це підзаголовок кроку.
// ?form=1 відкриває ручну форму паспорта, ?demo=1 — паспорт і одна віза вже є (для скріншотів).

export type Pass = { num: string; country: string; issue: string; exp: string; file: boolean; manual?: boolean }
export type Visa = Pass & { id: string; type: string }

// Вигадані дані.
export const DEMO_PASS: Pass = { num: 'EX0000123', country: 'Украина', issue: '12.03.2022', exp: '12.03.2032', file: true }

const FOUND_VISAS: Visa[] = [
  { id: 'v-us', country: 'США', type: 'C1/D', num: 'V0004521', issue: '05.06.2024', exp: '04.06.2029', file: true },
  { id: 'v-nl', country: 'Нидерланды', type: 'Schengen', num: 'NLD0001187', issue: '10.01.2025', exp: '09.01.2027', file: true },
]

const EMPTY_PASS: Pass = { num: '', country: 'Украина', issue: '', exp: '', file: false }
const EMPTY_VISA: Visa = { id: '', country: '', type: '', num: '', issue: '', exp: '', file: false }

type VisaEdit = { v: Visa; isNew: boolean }

export function S3pPassport({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useS()
  const params = useHashParams()
  const pass = bag<Pass | null>('s3p.pass', null)
  const visas = bag<Visa[]>('s3p.visas', [])
  const [passForm, setPassForm] = useState<Pass | null>(() => (params.get('form') === '1' ? EMPTY_PASS : null))
  const [visaForm, setVisaForm] = useState<VisaEdit | null>(null)
  const [visaSheet, setVisaSheet] = useState(false)
  const p = useBusy()
  const v = useBusy()

  useEffect(() => {
    if (params.get('demo') !== '1') return
    setBag('s3p.pass', DEMO_PASS)
    setBag('s3p.visas', [FOUND_VISAS[0]])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const uploadPass = () =>
    p.run(() => {
      setBag('s3p.pass', DEMO_PASS)
      showToast('Паспорт распознан — проверьте данные')
    })
  const savePass = ({ num, country, issue, exp, file }: Pass) => {
    setBag('s3p.pass', { num, country, issue, exp, file, manual: pass?.manual ?? !pass })
    setPassForm(null)
    showToast('Паспорт сохранён')
  }
  const removePass = () => {
    setBag('s3p.pass', null)
    setPassForm(null)
    showToast('Паспорт удалён')
  }

  const uploadVisa = () =>
    v.run(() => {
      const next = FOUND_VISAS.find((x) => !visas.some((y) => y.id === x.id))
      if (!next) return showToast('Виза распознана (пример)')
      setBag('s3p.visas', [...visas, next])
      showToast(`Распознана виза: ${next.country}, ${next.type}`)
    })
  const saveVisa = (d: Visa) => {
    if (visaForm?.isNew) setBag('s3p.visas', [...visas, { ...d, id: 'v' + Date.now(), manual: true }])
    else setBag('s3p.visas', visas.map((x) => (x.id === d.id ? d : x)))
    setVisaForm(null)
    showToast('Виза сохранена')
  }
  const removeVisa = () => {
    setBag(
      's3p.visas',
      visas.filter((x) => x.id !== visaForm?.v.id),
    )
    setVisaForm(null)
    showToast('Виза удалена')
  }

  return (
    <StepShell step={PASS} go={go} optional>
      <ScrollAnchor />

      <section id="f-pass" className="flex flex-col gap-3">
        {!passForm && !pass && <SectionTitle>Загранпаспорт</SectionTitle>}
        {passForm ? (
          <DocPaper
            id="s3p-pass"
            title="Загранпаспорт"
            initial={passForm}
            photo="Фото страницы с данными"
            saveLabel="Сохранить паспорт"
            onSave={savePass}
            onCancel={() => setPassForm(null)}
            onDelete={pass ? removePass : undefined}
          />
        ) : pass ? (
          <PassCard pass={pass} onEdit={() => setPassForm(pass)} />
        ) : (
          <AddPanel title="Сфотографируйте или загрузите страницу с фото и данными." busy={p.busy} onUpload={uploadPass} onManual={() => setPassForm(EMPTY_PASS)} />
        )}
      </section>

      <section id="f-visa" className="mt-2 flex flex-col gap-3">
        <SectionTitle aside={<span className="text-sm text-muted-foreground">можно несколько</span>}>Визы</SectionTitle>
        <RowList
          rows={visas.map((x) => ({
            key: x.id,
            icon: Stamp,
            title: `${x.country}, ${x.type}`,
            meta: x.exp ? (
              <span>
                до <span className="font-mono">{x.exp}</span>
              </span>
            ) : (
              'Срок не указан'
            ),
            badge: x.manual ? { text: 'вручную', variant: 'warning' as const } : undefined,
            onClick: () => setVisaForm({ v: x, isNew: false }),
          }))}
        />
        {visaForm ? (
          <DocPaper
            key={visaForm.v.id || 'new'}
            id="s3p-visa"
            title="Виза"
            visa
            initial={visaForm.v}
            photo="Фото визы"
            saveLabel="Сохранить визу"
            onSave={(d) => saveVisa({ ...visaForm.v, ...d })}
            onCancel={() => setVisaForm(null)}
            onDelete={visaForm.isNew ? undefined : removeVisa}
          />
        ) : (
          <button
            type="button"
            disabled={v.busy}
            onClick={() => setVisaSheet(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left active:scale-[0.99]"
          >
            {v.busy ? <LoaderCircle className="size-5 shrink-0 animate-spin text-primary" /> : <Plus className="size-5 shrink-0 text-primary" />}
            <span className="flex flex-col">
              <span className="text-[15px] font-medium text-primary">{visas.length ? 'Добавить ещё визу' : 'Добавить визу'}</span>
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {v.busy ? 'Распознаём…' : 'Фото, файл или вручную'}
              </span>
            </span>
          </button>
        )}
      </section>

      <QSheet open={visaSheet} onClose={() => setVisaSheet(false)} title="Добавить визу">
        <ul className="overflow-hidden rounded-xl border border-border">
          {(
            [
              [Camera, 'Сфотографировать страницу с визой', uploadVisa],
              [FolderOpen, 'Загрузить файл', uploadVisa],
              [PenLine, 'Ввести вручную', () => setVisaForm({ v: EMPTY_VISA, isNew: true })],
            ] as const
          ).map(([Icon, label, act]) => (
            <li key={label} className="border-t border-border first:border-t-0">
              <button
                type="button"
                onClick={() => {
                  setVisaSheet(false)
                  act()
                }}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] active:bg-muted"
              >
                <Icon className="size-5 shrink-0 text-primary" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </QSheet>
    </StepShell>
  )
}

/* ---------- паспорт як папір: смуга з назвою, реквізити, файл ---------- */

function PassCard({ pass, onEdit }: { pass: Pass; onEdit: () => void }) {
  const rows: [string, string, boolean][] = [
    ['Номер', pass.num, true],
    ['Страна выдачи', pass.country, false],
    ['Дата выдачи', pass.issue, true],
    ['Действителен до', pass.exp, true],
  ]
  return (
    <Paper
      title={
        <span className="flex items-center justify-between gap-3">
          <span>Загранпаспорт</span>
          {pass.manual && <span className="font-normal opacity-80">введён вручную</span>}
        </span>
      }
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 py-1">
        {rows.map(([k, val, mono]) => (
          <div key={k} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className={mono && val ? 'truncate font-mono text-[15px]' : 'truncate text-[15px]'}>{val || '—'}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center gap-3 border-t border-border pt-3">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="size-3 shrink-0 text-success" aria-hidden="true" />
          {pass.file ? 'Страница с данными, зашифровано' : 'Фото не прикреплено'}
        </span>
        <Button variant="ghost" className="-mr-3 h-9 text-[15px] text-primary" onClick={onEdit}>
          <Pencil className="size-4" />
          Изменить
        </Button>
      </div>
    </Paper>
  )
}

/* ---------- ручна форма паспорта або візи (папір, як DocForm) ---------- */

function DocPaper({
  id,
  title,
  visa,
  initial,
  photo,
  saveLabel,
  onSave,
  onCancel,
  onDelete,
}: {
  id: string
  title: string
  visa?: boolean
  initial: Pass & { type?: string }
  photo: string
  saveLabel: string
  onSave: (d: Pass & { type: string }) => void
  onCancel: () => void
  onDelete?: () => void
}) {
  const [d, setD] = useState({ ...initial, type: initial.type ?? '' })
  const put = (x: Partial<typeof d>) => setD((s) => ({ ...s, ...x }))
  const f = (k: string) => `${id}-${k}`
  const ref = useRef<HTMLDivElement>(null)
  const ok = visa ? !!(d.country.trim() && d.type.trim()) : !!d.num.trim()

  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    return () => window.clearTimeout(t)
  }, [])

  const title2 = visa ? [d.country.trim(), d.type.trim()].filter(Boolean).join(', ') || title : title

  return (
    <div ref={ref} className="scroll-mt-4">
      <Paper title={title2}>
        <div className="flex flex-col gap-5 py-1">
          {visa && (
            <div className="grid grid-cols-2 gap-3">
              <Field id={f('country')} label="Страна">
                <CountryPick id={f('country')} title="Страна визы" value={d.country} onChange={(v) => put({ country: v })} />
              </Field>
              <Field id={f('type')} label="Тип визы">
                <TextInput id={f('type')} value={d.type} placeholder="C1/D" onChange={(e) => put({ type: e.target.value })} />
              </Field>
            </div>
          )}
          <Field id={f('num')} label="Номер">
            <TextInput id={f('num')} mono value={d.num} placeholder="Как в документе" className="placeholder:font-sans" autoComplete="off" onChange={(e) => put({ num: e.target.value })} />
          </Field>
          {!visa && (
            <Field id={f('country')} label="Страна выдачи">
              <CountryPick id={f('country')} title="Страна выдачи" value={d.country} onChange={(v) => put({ country: v })} />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field id={f('issue')} label="Дата выдачи">
              <DatePick id={f('issue')} title="Дата выдачи" value={d.issue} onChange={(v) => put({ issue: v })} {...BOUNDS.issue} />
            </Field>
            <Field id={f('exp')} label={visa ? 'Действительна до' : 'Действителен до'}>
              <DatePick id={f('exp')} title={visa ? 'Действительна до' : 'Действителен до'} value={d.exp} onChange={(v) => put({ exp: v })} {...BOUNDS.expiry(d.issue)} />
            </Field>
          </div>

          <div className="border-t border-border pt-4">
            {d.file ? (
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                  <Image className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-medium">{photo}.jpg</span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Lock className="size-3 text-success" aria-hidden="true" />
                    JPG, <span className="font-mono">0,9 МБ</span>
                  </span>
                </span>
                <Button variant="ghost" size="icon-lg" aria-label="Удалить файл" className="text-muted-foreground" onClick={() => put({ file: false })}>
                  <Trash2 className="size-5" />
                </Button>
              </div>
            ) : (
              <button
                id={f('file')}
                type="button"
                onClick={() => put({ file: true })}
                className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-3 text-left active:scale-[0.99]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                  <Camera className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[15px] font-medium">{photo}</span>
                  <span className="text-sm text-muted-foreground">Сфотографируйте или прикрепите файл</span>
                </span>
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" className="h-11 text-[15px] text-muted-foreground" onClick={onCancel}>
              Отмена
            </Button>
            <Button variant="secondary" className="h-11 flex-1 text-[15px] text-primary" disabled={!ok} onClick={() => onSave({ ...d, country: d.country.trim(), type: d.type.trim(), num: d.num.trim() })}>
              {saveLabel}
            </Button>
          </div>
          {onDelete && (
            <button type="button" onClick={onDelete} className="-mt-1 flex items-center gap-2 self-start text-sm font-medium text-signal">
              <Trash2 className="size-4" />
              {visa ? 'Удалить визу' : 'Удалить паспорт'}
            </button>
          )}
        </div>
      </Paper>
    </div>
  )
}

