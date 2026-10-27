import { useState } from 'react'
import { Check, FileText, Plus } from 'lucide-react'
import { StepShell } from '@/components/app/stepper'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { FORM_DEFAULTS } from '../q/_parts'
import { AddPanel, DocForm, docMeta, EMPTY_DOC, RowList, ScrollAnchor, SectionTitle, useBusy, useHashParams, useS, type DocData } from './_core-parts'

// s4 — крок 4 «Дипломы и сертификаты» (docStep у C). Завантажити — ИИ розкладе по типах
// (у прототипі кожне завантаження дає «Endorsement — 3rd Engineer»), або «Ввести вручную».
// Чипи «Обычно просят агентства» відкривають ручну форму з назвою. Тап по документу в списку
// відкриває його форму: для диплома (CoC) після «Должность по диплому» — «Правило STCW» і «Уровень»
// (правка п. 6). ?form=coc відкриває форму диплома одразу (для скріншотів).

type Item = { id: string; src: 'ai' | 'manual'; coc?: boolean; d: DocData }
type Edit = { id?: string; coc?: boolean; d: DocData }

const SUG = ['Endorsement', 'Basic Safety Training', 'Advanced Fire Fighting', 'PSCRB', 'Medical First Aid', 'Security Awareness', 'GMDSS']
const REC = 'Endorsement — 3rd Engineer'

// Диплом, уже розпізнаний ИИ (вигадані значення з C: dip*).
const COC: Item = {
  id: 'coc',
  src: 'ai',
  coc: true,
  d: {
    name: String(FORM_DEFAULTS.dipName),
    num: String(FORM_DEFAULTS.dipNum),
    issue: String(FORM_DEFAULTS.dipIssue),
    exp: String(FORM_DEFAULTS.dipExp),
    noExp: false,
    country: String(FORM_DEFAULTS.dipCountry),
    file: true,
    rank: String(FORM_DEFAULTS.dipRank),
    stcw: String(FORM_DEFAULTS.dipStcw),
    level: String(FORM_DEFAULTS.dipLevel),
  },
}

const title = (it: Item) => (it.coc ? `CoC — ${it.d.rank || 'без должности'}${it.d.stcw ? ` (${it.d.stcw})` : ''}` : it.d.name)

export function S4Diplomas({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useS()
  const params = useHashParams()
  const items = bag<Item[]>('s4.items', [COC])
  const [edit, setEdit] = useState<Edit | null>(() => (params.get('form') === 'coc' ? { id: COC.id, coc: true, d: COC.d } : null))
  const { busy, run } = useBusy()
  const save = (list: Item[]) => setBag('s4.items', list)

  const upload = () =>
    run(() => {
      save([...items, { id: 'rec' + Date.now(), src: 'ai', d: { ...EMPTY_DOC, name: REC } }])
      showToast('Распознано: ' + REC + ' — проверьте данные')
    })

  const onSave = (d: DocData) => {
    if (edit?.id) save(items.map((it) => (it.id === edit.id ? { ...it, d } : it)))
    else save([...items, { id: 'man' + Date.now(), src: 'manual', d }])
    setEdit(null)
    showToast('Сохранено: ' + d.name)
  }
  const onDelete = () => {
    save(items.filter((it) => it.id !== edit?.id))
    setEdit(null)
    showToast('Документ удалён')
  }

  const have = (x: string) => items.some((it) => it.d.name === x)

  return (
    <StepShell step={4} go={go} optional>
      <ScrollAnchor />
      <div id="f-up4">
        {!edit && (
          <AddPanel
            title="Загрузите диплом или сертификат"
            sub="Можно сразу несколько файлов — ИИ разложит по типам"
            busy={busy}
            onUpload={upload}
            onManual={() => setEdit({ d: { ...EMPTY_DOC } })}
          />
        )}

        {edit && (
          <DocForm
            key={edit.id ?? 'new'}
            id="s4-man"
            initial={edit.d}
            coc={edit.coc}
            fallbackTitle="Ввести вручную"
            onSave={onSave}
            onCancel={() => setEdit(null)}
            onDelete={edit.id ? onDelete : undefined}
          />
        )}
      </div>

      {items.length > 0 && (
        <>
          <SectionTitle>Ваши документы</SectionTitle>
          <RowList
            rows={items.map((it) => ({
              key: it.id,
              icon: FileText,
              title: title(it),
              meta: it.src === 'manual' ? 'Проверит администратор' : it.d.exp || it.d.noExp ? docMeta(it.d) : 'Проверьте данные',
              badge: it.src === 'manual' ? { text: 'вручную', variant: 'warning' as const } : { text: 'распознан', variant: 'success' as const },
              onClick: () => setEdit({ id: it.id, coc: it.coc, d: it.d }),
            }))}
          />
        </>
      )}

      <div id="f-sug4" className="flex flex-col gap-3">
        <SectionTitle>Обычно просят агентства</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {SUG.map((x) => {
            const on = have(x)
            return (
              <button
                key={x}
                type="button"
                disabled={on}
                onClick={() => setEdit({ d: { ...EMPTY_DOC, name: x } })}
                className={cn(
                  'flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium',
                  on ? 'border-success text-success' : 'border-border bg-surface text-foreground',
                )}
              >
                {on ? <Check className="size-3.5" /> : <Plus className="size-3.5 text-primary" />}
                {x}
              </button>
            )
          })}
        </div>
      </div>
    </StepShell>
  )
}
