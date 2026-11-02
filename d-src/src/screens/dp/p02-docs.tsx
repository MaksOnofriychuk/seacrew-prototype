import { useState } from 'react'
import { Camera, ChevronRight, FolderOpen, HeartPulse, Image, Lock, PenLine, Plus, TriangleAlert } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { ViewState } from '@/components/app/states'
import { TabBar } from '@/components/app/tab-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AddCat } from '@/lib/data-docs-profile'
import type { ScreenProps } from '../types'
import { ActionRow, Note, TabHeader, useDP, type Icon } from './_parts'
import { ADD_START, daysLeft, expiry, GROUPS, remindersLeft, useDocs, type AddState, type Doc, type DocGroup } from './_docs'
import { useAppCounts } from '../m/_parts'

// p02 — документы. Групи: документ моряка, загранпаспорт і визы (правка №36), дипломи, медичні, CV;
// «Прививки» з «+» (відповідь 76); «Подфлажные» і «Другие» — лише коли є. Номер прихований, крім останніх цифр; плашка строку — лише
// в документа, що спливає. «+» — вікно «Добавить документ» (текст за правкою №17) → p18.
// Медичні — окремо, вручну на кроці s5 (ADR-090). ?med=1 показує медичний документ, що спливає.

// Порожня група: що додати.
const ADD_ROW: Partial<Record<DocGroup, { title: string; cat: AddCat }>> = {
  sid: { title: 'Добавить документ моряка', cat: 'sid' },
  passport: { title: 'Добавить загранпаспорт', cat: 'passport' },
  visa: { title: 'Добавить визу', cat: 'visa' },
  dip: { title: 'Добавить диплом или сертификат', cat: 'dip' },
  vac: { title: 'Добавить прививку', cat: 'vac' },
  cv: { title: 'Загрузить CV', cat: 'other' },
}

export function P02Docs({ go }: ScreenProps) {
  const { setBag } = useDP()
  const { docs, demoMed } = useDocs()
  const counts = useAppCounts()
  // Відкрите вікно: тип документа, якщо прийшли з рядка «Добавить визу» тощо.
  const [add, setAdd] = useState<{ cat: AddCat | null } | null>(null)
  const warn = docs.filter((d) => {
    const e = expiry(d.exp)
    return e && e.variant !== 'success'
  })

  const open = (id: string) => {
    setBag('doc.sel', id)
    if (demoMed) setBag('docs.demoMed', true)
    go('p11')
  }
  const start = (st: AddState) => {
    setBag('dp.add', st)
    setAdd(null)
    go('p18')
  }
  const picked = () => start({ ...ADD_START, cat: add?.cat ?? null })
  // Тип уже відомий (рядок «Добавить визу», «+» у прививках) — одразу до полів; ні — спершу вибір типу на p18.
  const manual = () => {
    const cat = add?.cat ?? null
    if (!cat) return start({ cat, pages: [], manual: true })
    setBag('dp.add', { cat, pages: [], manual: true })
    setAdd(null)
    go('p19')
  }

  const plus = (
    <button type="button" aria-label="Добавить документ" onClick={() => setAdd({ cat: null })} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95">
      <Plus className="size-5" strokeWidth={2.25} />
    </button>
  )

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <TabHeader title="Документы" go={go} action={plus} here="p02" />
        <ViewState
          loading={{ kind: 'list', rows: 7 }}
          empty={{
            icon: Lock,
            title: 'Документов пока нет',
            text: 'Добавьте документ моряка, паспорт, визы и дипломы. Данные с фото заполнятся сами — вы только проверите.',
            action: (
              <Button size="lg" className="w-auto" onClick={() => setAdd({ cat: null })}>
                <Plus /> Добавить документ
              </Button>
            ),
          }}
          error={{ title: 'Не удалось загрузить документы' }}
        >
          <div className="flex flex-col px-4 pt-3">
            <p className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
              <Lock className="size-3.5 shrink-0 text-success" />
              Файлы зашифрованы. Агентства видят данные, но не сами файлы.
            </p>
            {warn.map((d) => (
              <Note key={d.id} icon={TriangleAlert} tone="warning" className="mt-4 border border-border bg-surface">
                <span className="font-medium">
                  {d.title}: {expiry(d.exp)?.text.toLowerCase()}.
                </span>{' '}
                <Reminders n={daysLeft(d.exp ?? '') ?? 0} />
              </Note>
            ))}
            <ul className="mt-5 overflow-hidden rounded-xl border border-border bg-surface">
              {GROUPS.map((g) => {
                const items = docs.filter((d) => d.group === g.id)
                if (!items.length && !g.always) return null
                const addRow = ADD_ROW[g.id]
                return (
                  <li key={g.id} className="border-t border-border first:border-t-0">
                    {g.id === 'vac' ? (
                      // Відповідь 76: блок прививок з «+» — додати будь-яку.
                      <div className="-mb-1 flex items-center justify-between pt-1.5 pr-2 pl-4">
                        <h2 className="text-sm text-muted-foreground">{g.title}</h2>
                        <button type="button" aria-label="Добавить прививку" onClick={() => setAdd({ cat: 'vac' })} className="flex size-9 items-center justify-center rounded-full text-primary active:bg-muted/60">
                          <Plus className="size-5" />
                        </button>
                      </div>
                    ) : (
                      <h2 className="-mb-1 px-4 pt-3.5 text-sm text-muted-foreground">{g.title}</h2>
                    )}
                    <ul>
                      {items.map((d) => (
                        <DocRow key={d.id} d={d} onClick={() => open(d.id)} />
                      ))}
                      {!items.length && g.id === 'med' && <AddRow icon={HeartPulse} title="Добавить медицинский документ" sub="Вводится вручную, с отдельным согласием" onClick={() => go('s5')} />}
                      {!items.length && addRow && <AddRow icon={Plus} title={addRow.title} onClick={() => setAdd({ cat: g.id === 'cv' ? null : addRow.cat })} />}
                    </ul>
                  </li>
                )
              })}
            </ul>
          </div>
        </ViewState>
      </div>
      <TabBar active="docs" go={go} counts={{ msg: counts.messages }} />
      <BottomSheet open={!!add} onClose={() => setAdd(null)} title="Добавить документ" description="Сфотографируйте или загрузите страницу с фото и данными.">
        <ActionRow icon={Camera} title="Сфотографировать" onClick={picked} />
        <ActionRow icon={Image} title="Выбрать из галереи" onClick={picked} />
        <ActionRow icon={FolderOpen} title="Выбрать файл" sub="PDF или изображение" onClick={picked} />
        <ActionRow icon={PenLine} title="Ввести вручную" onClick={manual} />
        <ActionRow icon={HeartPulse} title="Медицинский документ" sub="Вводится вручную" onClick={() => go('s5')} />
        <Button size="lg" variant="ghost" className="mt-3 text-primary" onClick={() => setAdd(null)}>
          Отмена
        </Button>
      </BottomSheet>
    </div>
  )
}

function DocRow({ d, onClick }: { d: Doc; onClick: () => void }) {
  const ex = expiry(d.exp)
  const urgent = ex && ex.variant !== 'success' ? ex : null
  return (
    <li className="border-t border-border first:border-t-0">
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted/60">
        <d.icon className="size-5 shrink-0 text-primary" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-medium">{d.title}</span>
          <span className="text-sm text-muted-foreground">
            {d.group === 'vac' && 'от '}
            <span className={d.group === 'cv' || d.group === 'visa' ? undefined : 'font-mono'}>{d.sub}</span>
            {d.exp && (
              <>
                , до <span className="font-mono">{d.exp}</span>
              </>
            )}
          </span>
          {urgent && (
            <Badge variant={urgent.variant} className="mt-1 font-normal">
              {urgent.text}
            </Badge>
          )}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </li>
  )
}

function AddRow({ icon: I, title, sub, onClick }: { icon: Icon; title: string; sub?: string; onClick: () => void }) {
  return (
    <li className="border-t border-border first:border-t-0">
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted/60">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
          <I className="size-4.5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-medium text-primary">{title}</span>
          {sub && <span className="text-sm text-muted-foreground">{sub}</span>}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </li>
  )
}

// «Напомним ещё раз за 90 и 30 дней» — лише ті нагадування (180/90/30), що ще попереду.
function Reminders({ n }: { n: number }) {
  const left = remindersLeft(n)
  if (!left.length) return <>Продлите документ, чтобы не пропустить контракт.</>
  return (
    <>
      Напомним ещё раз за{' '}
      {left.map((d, i) => (
        <span key={d}>
          {i > 0 && ' и '}
          <span className="font-mono">{d}</span>
        </span>
      ))}{' '}
      дней до конца срока.
    </>
  )
}
