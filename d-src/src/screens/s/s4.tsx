import { useState } from 'react'
import { FileText } from 'lucide-react'
import { StepShell } from '@/components/app/stepper'
import type { ScreenProps } from '../registry'
import { FORM_DEFAULTS } from '../q/_parts'
import { AddPanel, DocForm, docMeta, EMPTY_DOC, RowList, ScrollAnchor, SectionTitle, useBusy, useHashParams, useS, type DocData } from './_core-parts'

// s4 — крок 4 «Дипломы и сертификаты» (docStep у C). Завантажити — ИИ розкладе по типах
// (у прототипі кожне завантаження дає «Endorsement — 3rd Engineer»), або «Ввести вручную».
// Чипів «Обычно просят агентства» немає (прибрано 27.10). Тап по документу в списку
// відкриває його форму: для диплома (CoC) після «Должность по диплому» — «Правило STCW» і «Уровень»
// (правка п. 6). ?form=coc відкриває форму диплома одразу (для скріншотів).

type Item = { id: string; src: 'ai' | 'manual'; coc?: boolean; d: DocData }
type Edit = { id?: string; coc?: boolean; d: DocData }

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
    </StepShell>
  )
}
