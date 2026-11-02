import { useEffect, useState } from 'react'
import { IdCard, Lock, Plus, ShieldAlert, Trash2, TriangleAlert } from 'lucide-react'
import type { Scenario } from '@/lib/proto-state'
import { StepShell } from './_stepper'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { DOC_TYPES, otherType, useToast, type DocTypeId } from '../q/_parts'
import { AddPanel, DocForm, EMPTY_DOC, ScrollAnchor, useBusy, useHashParams, useS, type DocData } from './_core-parts'

// s3 — крок 3 «Документ моряка», обов'язковий. Текст завантаження — правка №17. Один із двох: удостоверение або диплом
// (правка п. 4: підпис «Diploma / CoC | CoP»); другий — за бажанням. Завантаження — ИИ розпізнає
// (у прототипі — коротка пауза), або «Ввести вручную»: форма-папір, «Название документа» першим,
// для диплома — ще «Должность по диплому», «Правило STCW», «Уровень» (правки пп. 5–6).
// Сценарій «Документ в бан-листе» — після завантаження помилка, «Продолжить» неактивна.
// Сценарії панелі для завантаження (як q04 у швидкому потоці, але без переходу на екрани e*, щоб
// не випасти з кроків): помилка під блоком завантаження. «Это не документ моряка» — правка №12:
// перший раз попередження, другий поспіль — блокування (e08). «Документ уже зарегистрирован» — №11.
// ?form=1 відкриває ручну форму одразу, ?type=diploma — вибирає диплом,
// ?demo=1 — документ уже завантажено (для скріншотів).

type Doc = { has: boolean; manual?: DocData }

// Помилки завантаження за сценарієм панелі: [заголовок, пояснення, кнопка підтримки].
const UPLOAD_ERR: Partial<Record<Scenario, [string, string, boolean]>> = {
  blur: ['Не получилось прочитать документ', 'Фото размыто, обрезано или с бликом. Снимите ещё раз или введите вручную.', false],
  notSeafarer: ['Это не документ моряка', 'Загрузите удостоверение или диплом.', false],
  offline: ['Нет интернета', 'Файл не отправлен. Попробуйте, когда появится связь.', false],
  rate: ['Слишком много попыток', 'Попробуйте чуть позже.', true],
  docTaken: ['Этот документ уже привязан к другому аккаунту', 'Свяжитесь с поддержкой.', true],
}

export function S3SeafarerDoc({ go }: ScreenProps) {
  const { state, set, bag, setBag, showToast } = useS()
  const params = useHashParams()
  const type = state.docType as DocTypeId
  const doc = bag<Doc>('s3.doc', { has: false })
  const doc2 = bag('s3.doc2', false)
  const [form, setForm] = useState(params.get('form') === '1')
  const [err, setErr] = useState<Scenario | null>(null)
  const { busy, run } = useBusy()
  const { toast, toastNode } = useToast()
  const ban = state.scenario === 'ban'
  const other = DOC_TYPES[otherType(type)]

  useEffect(() => {
    if (params.get('type') === 'diploma') set({ docType: 'diploma' })
    if (params.get('demo') === '1') setBag('s3.doc', { has: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const choose = (t: DocTypeId) => {
    set({ docType: t })
    setBag('s3.doc2', false)
    setErr(null)
  }
  const upload = () => {
    setErr(null)
    run(() => {
      const sc = state.scenario
      if (sc === 'notSeafarer') {
        const n = bag<number>('q.wrongDocs', 0) + 1
        setBag('q.wrongDocs', n)
        if (n >= 2) return go('e08')
      }
      if (UPLOAD_ERR[sc]) return setErr(sc)
      setBag('q.wrongDocs', null)
      setBag('s3.doc', { has: true })
    })
  }
  const support = () => go('m-support')
  const remove = () => {
    const bak = doc
    setBag('s3.doc', { has: false })
    setBag('s3.doc2', false)
    toast('Документ удалён', () => setBag('s3.doc', bak))
  }
  const save = (d: DocData) => {
    setBag('s3.doc', { has: true, manual: d })
    setForm(false)
    showToast('Сохранено: ' + d.name)
  }

  // Як у C: назва документа підставлена з вибраного типу, решта — порожня.
  const initial: DocData = { ...EMPTY_DOC, name: DOC_TYPES[type].n }

  return (
    <div className="relative h-full">
      <StepShell step={3} go={go} canNext={doc.has && !ban}>
        <ScrollAnchor />
        <div id="f-sid" className="flex flex-col gap-3">
          <h2 className="px-1 text-base font-semibold">Какой документ загружаете?</h2>

          <div role="tablist" className="grid grid-cols-2 gap-1 rounded-md border border-border bg-surface p-1">
            {(Object.keys(DOC_TYPES) as DocTypeId[]).map((id) => {
              const on = id === type
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => choose(id)}
                  className={cn('flex flex-col items-start rounded-[9px] border px-3 py-2 text-left transition-colors', on ? 'border-primary bg-muted' : 'border-transparent')}
                >
                  <span className={cn('text-[15px] font-medium', on ? 'text-primary' : 'text-foreground')}>{DOC_TYPES[id].b}</span>
                  <span className="text-sm text-muted-foreground">{DOC_TYPES[id].s}</span>
                </button>
              )
            })}
          </div>

          {doc.has ? (
            <div className="mt-1 overflow-hidden rounded-xl border border-border bg-surface">
              <DocLine
                name={doc.manual?.name ?? DOC_TYPES[type].n}
                meta={doc.manual ? 'Проверит администратор' : 'Распознан'}
                badge={doc.manual ? 'вручную' : undefined}
                onRemove={remove}
              />
              {doc2 ? (
                <DocLine name={other.n} meta="1 стр., зашифровано" onRemove={() => setBag('s3.doc2', false)} />
              ) : (
                <button type="button" onClick={() => setBag('s3.doc2', true)} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left">
                  <Plus className="size-5 shrink-0 text-primary" />
                  <span className="flex flex-col">
                    <span className="text-[15px] font-medium text-primary">Добавить ещё: {other.b.toLowerCase()}</span>
                    <span className="text-sm text-muted-foreground">Необязательно — можно позже</span>
                  </span>
                </button>
              )}
            </div>
          ) : form ? null : (
            <AddPanel title="Сфотографируйте или загрузите страницу с фото и данными." busy={busy} onUpload={upload} onManual={() => setForm(true)} />
          )}

          {err && !doc.has && !form && !busy && (
            <div role="alert" className="flex flex-col gap-2 rounded-md border border-signal bg-surface px-4 py-3">
              <p className="flex items-start gap-2 text-[15px] font-medium text-signal">
                <ShieldAlert className="mt-0.5 size-5 shrink-0" />
                {UPLOAD_ERR[err]![0]}
              </p>
              <p className="text-[15px] text-muted-foreground">{UPLOAD_ERR[err]![1]}</p>
              {err === 'notSeafarer' && (
                <p className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-[15px] leading-snug">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                  Ещё одна ошибка — и аккаунт будет заблокирован
                </p>
              )}
              {UPLOAD_ERR[err]![2] && (
                <button type="button" onClick={support} className="self-start text-[15px] font-medium text-primary">
                  Написать в поддержку
                </button>
              )}
            </div>
          )}

          {ban && doc.has && (
            <div role="alert" className="flex flex-col gap-2 rounded-md border border-signal bg-surface px-4 py-3 text-[15px]">
              <span className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-signal" />
                <span>С этим документом нельзя продолжить регистрацию.</span>
              </span>
              <button type="button" onClick={support} className="self-start pl-8 font-medium text-primary">
                Написать в поддержку
              </button>
            </div>
          )}
        </div>

        {form && !doc.has && <DocForm key={type} id="s3-man" initial={initial} coc={type === 'diploma'} namePh={DOC_TYPES[type].n} onSave={save} onCancel={() => setForm(false)} />}
      </StepShell>
      {toastNode}
    </div>
  )
}

function DocLine({ name, meta, badge, onRemove }: { name: string; meta: string; badge?: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
      <IdCard className="size-5 shrink-0 text-primary" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-medium">{name}</span>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="size-3 text-success" aria-hidden="true" />
          {meta}
        </span>
      </span>
      {badge && (
        <Badge variant="warning" className="font-normal">
          {badge}
        </Badge>
      )}
      <Button variant="ghost" size="icon" aria-label="Удалить" onClick={onRemove} className="text-muted-foreground">
        <Trash2 className="size-5" />
      </Button>
    </div>
  )
}
