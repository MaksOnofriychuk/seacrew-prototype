import { useEffect, useState } from 'react'
import { Clock, HeartPulse, Lock, Plus, UserRound } from 'lucide-react'
import { StepShell } from '@/components/app/stepper'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from '../registry'
import { CheckRow, QSheet } from '../q/_parts'
import { DocForm, docMeta, EMPTY_DOC, RowList, ScrollAnchor, useHashParams, useS, type DocData } from './_core-parts'

// s5 — крок 5 «Медицинские документы». Правка п. 10 і ADR-090: ИИ медичні документи не читає —
// немає ні зони сканування, ні чипів «Обычно просят агентства», ні картки з трьома рядками.
// Лише «Добавить вручную» → форма-папір з полями і «Прикрепить фото или файл»; документів може
// бути кілька. Під блоком — галочка згоди; поки її немає, додавання неактивне (ADR-088).
// «Подробнее» в кінці тексту згоди — вікно знизу з трьома пунктами.
// Зняли згоду — збережені медичні документи видаляються (як toggle-med у C).
// ?form=1 відкриває форму, ?more=1 — вікно «Подробнее», ?demo=1 — згода дана і один документ збережено (для скріншотів).

type Med = { id: string; d: DocData }
type Edit = { id?: string; d: DocData }

// Тимчасові поля, доки замовник не надасть перелік (registration-c-redesign, відкрите питання):
// назва, номер, дата видачі, дійсний до / без строку, країна видачі + файл. Це ті самі поля, що
// в DocForm, тому окремої форми немає. Коли перелік прийде — тут буде своя форма.
const DEMO: Med = {
  id: 'demo',
  d: {
    ...EMPTY_DOC,
    name: 'Медосмотр (PEME)',
    num: 'MC-0001',
    issue: '14.11.2024',
    exp: '14.11.2026',
    file: true,
  },
}

const POINTS = [
  { icon: Lock, text: 'Хранятся зашифрованными' },
  {
    icon: UserRound,
    text: 'Видят только агентства, которым вы откроете доступ',
  },
  {
    icon: Clock,
    text: 'Удаляются автоматически, когда закончится срок действия',
  },
]

export function S5Medical({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useS()
  const params = useHashParams()
  const demo = params.get('demo') === '1'
  const consent = bag<boolean>('s5.consent', false)
  const docs = bag<Med[]>('s5.docs', [])
  const [edit, setEdit] = useState<Edit | null>(() => (params.get('form') === '1' ? { d: { ...EMPTY_DOC } } : null))
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
  const onSave = (d: DocData) => {
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

  return (
    <StepShell step={5} go={go} optional>
      <ScrollAnchor />
      <RowList
        rows={docs.map((m) => ({
          key: m.id,
          icon: HeartPulse,
          title: m.d.name,
          meta: docMeta(m.d),
          badge: { text: 'вручную', variant: 'warning' as const },
          onClick: () => setEdit({ id: m.id, d: m.d }),
        }))}
      />

      <div id="f-up5">
        {edit ? (
          <DocForm
            key={edit.id ?? 'new'}
            id="s5-man"
            initial={edit.d}
            namePh="Например, Медосмотр (PEME)"
            fallbackTitle="Медицинский документ"
            onSave={onSave}
            onCancel={() => setEdit(null)}
            onDelete={edit.id ? onDelete : undefined}
          />
        ) : (
          <button
            type="button"
            disabled={!consent}
            onClick={() => setEdit({ d: { ...EMPTY_DOC } })}
            className="flex w-full items-center gap-4 rounded-xl border border-dashed border-primary/60 bg-surface px-4 py-4 text-left active:scale-[0.99] disabled:border-border disabled:opacity-60"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
              <Plus className="size-5" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-medium">{docs.length ? 'Добавить ещё документ' : 'Добавить вручную'}</span>
              <span className="text-sm text-muted-foreground">Медосмотр, прививки, тест на алкоголь и наркотики</span>
            </span>
          </button>
        )}
      </div>

      <CheckRow id="s5-consent" checked={consent} onChange={toggleConsent} className="mt-1 px-1">
        Разрешаю хранить мои медицинские документы для трудоустройства.{' '}
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
