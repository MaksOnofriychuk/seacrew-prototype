import { useEffect, useRef, useState } from 'react'
import { Camera, Clock, EyeOff, FileText, FolderOpen, HeartPulse, Image, Lock, Plus, Trash2 } from 'lucide-react'
import { Paper } from '@/components/app/paper'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { CheckRow, Field, QSheet, TextInput } from '../q/_parts'
import { maskDate, RowList, ScrollAnchor, useHashParams, useS } from './_core-parts'
import { StepShell } from './_stepper'

// s5 — крок 5 «Медицинские документы». ADR-090: ИИ медичні документи не читає.
// Правка №18: галочка згоди — НАД блоком додавання; поки її немає, додавання неактивне (ADR-088).
// Текст: «Разрешаю добавить и хранить мои медицинские документы.» + «Подробнее» (вікно знизу).
// Правка №5: медкомісія — название, дата начала, дата конца, место выдачи; додати — фото титульної
// сторінки, файл (3–7 листів) або вручну. Фото чи файл лише прикріплюються, поля моряк заповнює сам.
// Документів може бути кілька. Зняли згоду — збережені медичні документи видаляються.
// ?form=1 відкриває форму, ?more=1 — вікно «Подробнее», ?demo=1 — згода дана і один документ збережено.

type Attach = 'photo' | 'pdf' | null
type MedDoc = { name: string; from: string; to: string; place: string; file: Attach }
type Med = { id: string; d: MedDoc }
type Edit = { id?: string; d: MedDoc }

const EMPTY: MedDoc = { name: '', from: '', to: '', place: '', file: null }

// Вигадані дані.
const DEMO: Med = {
  id: 'demo',
  d: { name: 'Медкомиссия (PEME)', from: '14.11.2024', to: '14.11.2026', place: 'Медцентр «Пример», Одесса', file: 'photo' },
}

const POINTS = [
  { icon: Lock, text: 'Хранятся зашифрованными' },
  { icon: EyeOff, text: 'Агентства видят название и сроки, но не сами файлы' },
  { icon: Clock, text: 'Удаляются автоматически, когда закончится срок действия' },
]

export function S5Medical({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useS()
  const params = useHashParams()
  const demo = params.get('demo') === '1'
  const consent = bag<boolean>('s5.consent', false)
  const docs = bag<Med[]>('s5.docs', [])
  const [edit, setEdit] = useState<Edit | null>(() => (params.get('form') === '1' ? { d: EMPTY } : null))
  const [more, setMore] = useState(params.get('more') === '1')

  useEffect(() => {
    if (!demo) return
    setBag('s5.consent', true)
    setBag('s5.docs', [DEMO])
    setBag('s5.has', true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const store = (list: Med[]) => {
    setBag('s5.docs', list)
    setBag('s5.has', list.length > 0)
  }
  const toggleConsent = (v: boolean) => {
    setBag('s5.consent', v)
    if (!v) {
      setEdit(null)
      if (docs.length) {
        store([])
        showToast('Медицинские документы удалены')
      }
    }
  }
  const onSave = (d: MedDoc) => {
    if (edit?.id) store(docs.map((m) => (m.id === edit.id ? { ...m, d } : m)))
    else store([...docs, { id: 'm' + Date.now(), d }])
    setEdit(null)
    showToast('Сохранено: ' + d.name)
  }
  const onDelete = () => {
    store(docs.filter((m) => m.id !== edit?.id))
    setEdit(null)
    showToast('Документ удалён')
  }
  const open = (file: Attach) => setEdit({ d: { ...EMPTY, file } })

  return (
    <StepShell step={5} go={go} optional>
      <ScrollAnchor />
      <RowList
        rows={docs.map((m) => ({
          key: m.id,
          icon: HeartPulse,
          title: m.d.name,
          meta: m.d.to ? (
            <span>
              до <span className="font-mono">{m.d.to}</span>
            </span>
          ) : (
            'Срок не указан'
          ),
          badge: { text: 'вручную', variant: 'warning' as const },
          onClick: () => setEdit({ id: m.id, d: m.d }),
        }))}
      />

      <CheckRow id="s5-consent" checked={consent} onChange={toggleConsent} className="px-1">
        Разрешаю добавить и хранить мои медицинские документы.{' '}
        <button
          type="button"
          className="font-medium text-primary"
          onClick={(e) => {
            e.preventDefault()
            setMore(true)
          }}
        >
          Подробнее
        </button>
      </CheckRow>

      <div id="f-up5">
        {edit ? (
          <MedForm key={edit.id ?? 'new'} initial={edit.d} onSave={onSave} onCancel={() => setEdit(null)} onDelete={edit.id ? onDelete : undefined} />
        ) : (
          <AddMed disabled={!consent} again={docs.length > 0} onManual={() => open(null)} onPhoto={() => open('photo')} onFile={() => open('pdf')} />
        )}
      </div>

      <QSheet open={more} onClose={() => setMore(false)} title="Медицинские документы">
        <ul className="flex flex-col">
          {POINTS.map((p) => (
            <li key={p.text} className="flex items-start gap-4 border-t border-border py-3 first:border-t-0">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                <p.icon className="size-5" />
              </span>
              <span className="pt-2 text-[15px]">{p.text}</span>
            </li>
          ))}
        </ul>
        <Button size="lg" className="mt-6" onClick={() => setMore(false)}>
          Понятно
        </Button>
      </QSheet>
    </StepShell>
  )
}

/* ---------- додати: вручну, фото титульної сторінки або файл; неактивно без згоди ---------- */

function AddMed({ disabled, again, onManual, onPhoto, onFile }: { disabled: boolean; again: boolean; onManual: () => void; onPhoto: () => void; onFile: () => void }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-surface transition-opacity duration-200', disabled && 'opacity-60')}>
      <button type="button" disabled={disabled} onClick={onManual} className="flex w-full items-center gap-4 px-4 py-4 text-left">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
          <Plus className="size-5" />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-medium">{again ? 'Добавить ещё документ' : 'Добавить вручную'}</span>
          <span className="text-sm text-muted-foreground">Название, сроки и место выдачи</span>
        </span>
      </button>
      <div className="grid grid-cols-2 border-t border-border">
        <button type="button" disabled={disabled} onClick={onPhoto} className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary">
          <Camera className="size-4" />
          Фото титульной
        </button>
        <button type="button" disabled={disabled} onClick={onFile} className="flex items-center justify-center gap-2 border-l border-border py-3 text-sm font-medium text-primary">
          <FolderOpen className="size-4" />
          Файл
        </button>
      </div>
    </div>
  )
}

/* ---------- медкомісія: папір з чотирма полями і вкладенням ---------- */

function MedForm({ initial, onSave, onCancel, onDelete }: { initial: MedDoc; onSave: (d: MedDoc) => void; onCancel: () => void; onDelete?: () => void }) {
  const [d, setD] = useState<MedDoc>(initial)
  const put = (p: Partial<MedDoc>) => setD((x) => ({ ...x, ...p }))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div ref={ref} className="scroll-mt-4">
      <Paper title={d.name.trim() || 'Медицинский документ'}>
        <div className="flex flex-col gap-5 py-1">
          <Field id="s5-name" label="Название">
            <TextInput id="s5-name" value={d.name} placeholder="Например, Offshore medical" onChange={(e) => put({ name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="s5-from" label="Дата начала">
              <TextInput id="s5-from" mono inputMode="numeric" value={d.from} placeholder="ДД.ММ.ГГГГ" onChange={(e) => put({ from: maskDate(e.target.value) })} />
            </Field>
            <Field id="s5-to" label="Дата конца">
              <TextInput id="s5-to" mono inputMode="numeric" value={d.to} placeholder="ДД.ММ.ГГГГ" onChange={(e) => put({ to: maskDate(e.target.value) })} />
            </Field>
          </div>
          <Field id="s5-place" label="Место выдачи">
            <TextInput id="s5-place" value={d.place} placeholder="Клиника, город" onChange={(e) => put({ place: e.target.value })} />
          </Field>

          <div className="border-t border-border pt-4">
            {d.file ? (
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                  {d.file === 'photo' ? <Image className="size-5" /> : <FileText className="size-5" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-medium">{d.file === 'photo' ? 'Титульная страница.jpg' : 'Медкомиссия.pdf'}</span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Lock className="size-3 text-success" aria-hidden="true" />
                    {d.file === 'photo' ? (
                      <>
                        JPG, <span className="font-mono">1,2 МБ</span>
                      </>
                    ) : (
                      <>
                        PDF, <span className="font-mono">5</span> стр.
                      </>
                    )}
                  </span>
                </span>
                <Button variant="ghost" size="icon-lg" aria-label="Удалить файл" className="text-muted-foreground" onClick={() => put({ file: null })}>
                  <Trash2 className="size-5" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Вся информация обычно на титульной странице</span>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => put({ file: 'photo' })} className="flex items-center gap-2 rounded-md border border-border px-3 py-3 text-left text-[15px] font-medium active:scale-[0.99]">
                    <Camera className="size-5 shrink-0 text-primary" />
                    Фото титульной
                  </button>
                  <button type="button" onClick={() => put({ file: 'pdf' })} className="flex items-center gap-2 rounded-md border border-border px-3 py-3 text-left text-[15px] font-medium active:scale-[0.99]">
                    <FolderOpen className="size-5 shrink-0 text-primary" />
                    Файл
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" className="h-11 text-[15px] text-muted-foreground" onClick={onCancel}>
              Отмена
            </Button>
            <Button variant="secondary" className="h-11 flex-1 text-[15px] text-primary" disabled={!d.name.trim()} onClick={() => onSave({ ...d, name: d.name.trim(), place: d.place.trim() })}>
              Сохранить документ
            </Button>
          </div>
          {onDelete && (
            <button type="button" onClick={onDelete} className="-mt-1 flex items-center gap-2 self-start text-sm font-medium text-signal">
              <Trash2 className="size-4" />
              Удалить документ
            </button>
          )}
        </div>
      </Paper>
    </div>
  )
}
