import { useState, type ComponentType } from 'react'
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Building2,
  Calendar,
  Camera,
  FileCheck2,
  FileText,
  GripVertical,
  Hash,
  ListChecks,
  Paperclip,
  PenLine,
  Plus,
  Rows3,
  ScanText,
  ShieldCheck,
  SquareCheck,
  Trash2,
  Type,
  UserRound,
} from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebCheckbox, WebField, WebInput, WebSelect } from '@/components/web/fields'
import { WebShell } from '@/components/web/shell'
import { StatusDot } from '@/components/web/status-badge'
import { FORMS } from '@/lib/data-web'
import { AUDIENCE_LABEL, FIELD_TYPE_LABEL, FORM_DEFS, formTitle, IMPORTED_FORM_ID, type Audience, type FieldType, type FormField, type FormSection } from '@/lib/data-recruiter-2'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { plural, useR2 } from './_parts'

type Icon = ComponentType<{ className?: string }>
const TYPE_ICON: Record<FieldType, Icon> = {
  profile: UserRound,
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  date: Calendar,
  select: ListChecks,
  checkbox: SquareCheck,
  photo: Camera,
  file: Paperclip,
  documentRequest: FileText,
  consent: ShieldCheck,
  signature: PenLine,
  group: Rows3,
}
// Типи, які можна додати; в секції «Только агентство» — лише прості (contract §4).
const ALL_TYPES = Object.keys(FIELD_TYPE_LABEL) as FieldType[]
const AGENCY_TYPES: FieldType[] = ['text', 'textarea', 'number', 'date', 'select', 'checkbox', 'file']
const PROFILE_KEYS = ['Фамилия', 'Имя', 'Дата рождения', 'Гражданство', 'Телефон', 'Аэропорт', 'Ближайший родственник', 'Должность', 'Опыт работы']
const DOC_CATEGORIES = ['Удостоверение личности', 'Дипломы', 'Сертификаты', 'Медицина', 'Визы']

const AUDIENCE_HINT: Record<Audience, string> = {
  SEAFARER: 'Моряк заполняет эти поля в приложении.',
  AGENCY_ONLY: 'Поля видит и заполняет только ваше агентство, моряк их не получает.',
}

type Sel = { s: string; f: string | null }

// r-form-edit — конструктор анкети: розділи, поля, «кто заполняет» (contract-recruiter-web §4).
// Сильний елемент — сама анкета як папір по центру; ліворуч розділи, праворуч властивості вибраного.
export function RFormEdit({ go }: ScreenProps) {
  const r = useR2()
  const id = r.formId
  const isNew = !FORM_DEFS[id]
  const imported = id === IMPORTED_FORM_ID
  const meta = FORMS.find((x) => x.id === id)
  const [title, setTitle] = useState(isNew ? '' : imported ? r.importTitle || formTitle(id) : formTitle(id))
  const { bag } = useProto()
  // Після імпорту — позначки «Нужно подтверждение документом», які рекрутер поставив на кроці перевірки полів.
  const importProof = bag<string[] | null>('r2.importProof', null)
  const [sections, setSections] = useState<FormSection[]>(() => {
    const base: FormSection[] = structuredClone(FORM_DEFS[id] ?? [{ id: 's1', title: 'Раздел 1', audience: 'SEAFARER', fields: [] }])
    if (!imported || !importProof) return base
    return base.map((sec) => ({ ...sec, fields: sec.fields.map((x) => (x.pdf ? { ...x, proof: importProof.includes(x.pdf) } : x)) }))
  })
  const [sel, setSel] = useState<Sel>({ s: sections[0].id, f: sections[0].fields[0]?.id ?? null })
  const [adding, setAdding] = useState<string | null>(null)
  const [review, setReview] = useState<string[]>(imported ? ['s1.nok', 's3.dpclass'] : [])
  const [tried, setTried] = useState(false)

  const section = sections.find((s) => s.id === sel.s) ?? sections[0]
  const field = section.fields.find((x) => x.id === sel.f) ?? null
  const fieldCount = sections.reduce((n, s) => n + s.fields.length, 0)
  // поля, які не дають віддати розділ агентству
  const blocked = section.fields.filter((x) => !AGENCY_TYPES.includes(x.type))

  const putSection = (sid: string, p: Partial<FormSection>) => setSections((all) => all.map((s) => (s.id === sid ? { ...s, ...p } : s)))
  const putField = (p: Partial<FormField>) => {
    if (!field) return
    putSection(section.id, { fields: section.fields.map((x) => (x.id === field.id ? { ...x, ...p } : x)) })
    setReview((v) => v.filter((k) => k !== `${section.id}.${field.id}`))
  }
  const addField = (sid: string, type: FieldType) => {
    const s = sections.find((x) => x.id === sid)!
    const fid = `${type}-${Date.now().toString(36)}`
    putSection(sid, { fields: [...s.fields, { id: fid, label: FIELD_TYPE_LABEL[type], type, required: false }] })
    setSel({ s: sid, f: fid })
    setAdding(null)
  }
  const addSection = () => {
    const sid = `s${Date.now().toString(36)}`
    setSections((all) => [...all, { id: sid, title: `Раздел ${all.length + 1}`, audience: 'SEAFARER', fields: [] }])
    setSel({ s: sid, f: null })
  }
  const move = (dir: -1 | 1) => {
    if (!field) return
    const i = section.fields.indexOf(field)
    const j = i + dir
    if (j < 0 || j >= section.fields.length) return
    const next = [...section.fields]
    ;[next[i], next[j]] = [next[j], next[i]]
    putSection(section.id, { fields: next })
  }
  // Порядок: стрелки у строк и перетаскивание (поля — между разделами, разделы — в списке слева).
  const [drag, setDrag] = useState<{ s: string; f: string } | null>(null)
  const [dragSec, setDragSec] = useState<string | null>(null)
  const shiftField = (sid: string, fid: string, dir: -1 | 1) => {
    const sec = sections.find((x) => x.id === sid)!
    const i = sec.fields.findIndex((x) => x.id === fid)
    const j = i + dir
    if (j < 0 || j >= sec.fields.length) return
    const next = [...sec.fields]
    ;[next[i], next[j]] = [next[j], next[i]]
    putSection(sid, { fields: next })
  }
  const shiftSection = (sid: string, dir: -1 | 1) => {
    const i = sections.findIndex((x) => x.id === sid)
    const j = i + dir
    if (j < 0 || j >= sections.length) return
    const next = [...sections]
    ;[next[i], next[j]] = [next[j], next[i]]
    setSections(next)
  }
  const dropField = (toS: string, beforeF: string | null) => {
    if (!drag) return
    const src = sections.find((x) => x.id === drag.s)!
    const item = src.fields.find((x) => x.id === drag.f)!
    const target = sections.find((x) => x.id === toS)!
    if (target.audience === 'AGENCY_ONLY' && !AGENCY_TYPES.includes(item.type)) {
      r.showToast('В раздел «Только агентство» нельзя перенести такое поле')
      setDrag(null)
      return
    }
    setSections((all) => {
      const without = all.map((x) => (x.id === drag.s ? { ...x, fields: x.fields.filter((y) => y.id !== drag.f) } : x))
      return without.map((x) => {
        if (x.id !== toS) return x
        const at = beforeF ? x.fields.findIndex((y) => y.id === beforeF) : x.fields.length
        const next = [...x.fields]
        next.splice(at < 0 ? next.length : at, 0, item)
        return { ...x, fields: next }
      })
    })
    setSel({ s: toS, f: drag.f })
    setDrag(null)
  }
  const dropSection = (beforeId: string) => {
    if (!dragSec || dragSec === beforeId) return
    setSections((all) => {
      const item = all.find((x) => x.id === dragSec)!
      const rest = all.filter((x) => x.id !== dragSec)
      rest.splice(rest.findIndex((x) => x.id === beforeId), 0, item)
      return rest
    })
    setDragSec(null)
  }
  const removeField = () => {
    if (!field) return
    putSection(section.id, { fields: section.fields.filter((x) => x !== field) })
    setSel({ s: section.id, f: null })
  }
  const removeSection = () => {
    if (sections.length < 2) return
    const rest = sections.filter((s) => s.id !== section.id)
    setSections(rest)
    setSel({ s: rest[0].id, f: null })
  }

  const save = (publish: boolean) => {
    setTried(true)
    if (!title.trim()) return
    if (publish && review.length) {
      r.showToast(`Проверьте поля с пометкой «Проверьте»: ${review.length}`)
      return
    }
    r.showToast(publish ? 'Анкета опубликована — её можно отправлять морякам' : 'Анкета сохранена как черновик')
    go('r-forms')
  }

  return (
    <WebShell variant="recruiter" active="r-forms" go={go} className="flex flex-col p-0">
      <div className="flex h-[72px] shrink-0 items-center gap-4 border-b border-border bg-surface px-8">
        <button type="button" onClick={() => go('r-forms')} className="text-sm font-medium text-primary">
          Анкеты
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-[15px] font-semibold">{isNew ? 'Новая анкета' : imported ? 'Распознанная анкета' : 'Конструктор анкеты'}</span>
        {meta && <StatusDot tone={meta.status === 'active' ? 'success' : 'muted'}>{meta.status === 'active' ? 'Опубликована' : 'Черновик'}</StatusDot>}
        <span className="ml-auto text-sm text-muted-foreground">
          <span className="font-mono">{sections.length}</span> {plural(sections.length, 'раздел', 'раздела', 'разделов')}, <span className="font-mono">{fieldCount}</span> {plural(fieldCount, 'поле', 'поля', 'полей')}
        </span>
        <Button variant="outline" onClick={() => save(false)}>
          Сохранить черновик
        </Button>
        <Button onClick={() => save(true)}>Опубликовать</Button>
      </div>

      <ViewState loading={{ kind: 'cards', className: 'p-8' }} empty={{ icon: FileText, title: 'В анкете нет разделов', text: 'Добавьте первый раздел и поля в нём.', action: <Button onClick={addSection}>Добавить раздел</Button> }}>
        <div className="flex min-h-0 flex-1">
          {/* Розділи */}
          <nav className="flex w-[220px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border bg-surface px-2.5 py-4" aria-label="Разделы анкеты">
            <span className="px-3 pb-1 text-xs font-medium text-muted-foreground">Разделы</span>
            {sections.map((s, i) => (
              <div
                key={s.id}
                draggable
                onDragStart={() => setDragSec(s.id)}
                onDragEnd={() => setDragSec(null)}
                onDragOver={(e) => dragSec && e.preventDefault()}
                onDrop={() => dropSection(s.id)}
                className={cn('group flex items-center rounded-md', s.id === section.id ? 'bg-muted' : 'hover:bg-muted', dragSec === s.id && 'opacity-50')}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSel({ s: s.id, f: null })
                    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    document.getElementById('sec-' + s.id)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
                  }}
                  className={cn('flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm', s.id === section.id && 'font-medium text-primary')}
                >
                  <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground/60" aria-hidden="true" />
                  <span className="w-3 shrink-0 font-mono text-xs text-muted-foreground">{i + 1}</span>
                  <span className="flex-1 truncate">{s.title}</span>
                  {s.audience === 'AGENCY_ONLY' && <Building2 className="size-3.5 shrink-0 text-muted-foreground" aria-label="Только агентство" />}
                  <span className="font-mono text-xs text-muted-foreground">{s.fields.length}</span>
                </button>
                <span className="mr-1 hidden shrink-0 group-hover:flex">
                  <button type="button" aria-label="Раздел выше" disabled={i === 0} onClick={() => shiftSection(s.id, -1)} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button type="button" aria-label="Раздел ниже" disabled={i === sections.length - 1} onClick={() => shiftSection(s.id, 1)} className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowDown className="size-3.5" />
                  </button>
                </span>
              </div>
            ))}
            <button type="button" onClick={addSection} className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-muted">
              <Plus className="size-4" /> Добавить раздел
            </button>
          </nav>

          {/* Анкета як папір */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-background px-8 py-6">
            {imported && (
              <div className="mx-auto mb-4 flex max-w-[760px] gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <ScanText className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="flex flex-col gap-0.5 text-sm">
                  <span className="font-medium">Распознано с вашего бланка</span>
                  <span className="text-muted-foreground">
                    Проверьте поля с пометкой «Проверьте» — их осталось <span className="font-mono">{review.length}</span>. Привязки к полям PDF сохранятся: заполненный PDF соберётся сам.
                  </span>
                </div>
              </div>
            )}
            <div className="mx-auto max-w-[760px] overflow-hidden rounded-xl border border-border bg-surface">
              <div className="bg-primary px-6 py-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Название анкеты"
                  aria-label="Название анкеты"
                  className={cn('w-full bg-transparent text-[17px] font-semibold text-primary-foreground outline-none placeholder:text-primary-foreground/60', tried && !title.trim() && 'placeholder:text-primary-foreground')}
                />
              </div>
              <p className="min-h-5 px-6 pt-3 text-sm text-signal box-content">{tried && !title.trim() ? 'Укажите название анкеты.' : null}</p>
              {sections.map((s) => (
                <section key={s.id} id={'sec-' + s.id} className={cn('scroll-mt-6 border-t border-border px-6 py-4 first:border-t-0', s.audience === 'AGENCY_ONLY' && 'bg-muted/60')}>
                  <button type="button" onClick={() => setSel({ s: s.id, f: null })} className="flex w-full items-baseline justify-between gap-4 text-left">
                    <h3 className={cn('text-base font-semibold', s.id === section.id && !field && 'text-primary')}>{s.title}</h3>
                    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      {s.audience === 'AGENCY_ONLY' ? <Building2 className="size-3.5" /> : <UserRound className="size-3.5" />}
                      {AUDIENCE_LABEL[s.audience]}
                    </span>
                  </button>
                  <ul className="mt-2 flex flex-col" onDragOver={(e) => drag && e.preventDefault()} onDrop={() => dropField(s.id, null)}>
                    {s.fields.map((x, fi) => {
                      const I = TYPE_ICON[x.type]
                      const on = s.id === section.id && x.id === field?.id
                      const check = review.includes(`${s.id}.${x.id}`)
                      return (
                        <li
                          key={x.id}
                          draggable
                          onDragStart={() => setDrag({ s: s.id, f: x.id })}
                          onDragEnd={() => setDrag(null)}
                          onDragOver={(e) => drag && (e.preventDefault(), e.stopPropagation())}
                          onDrop={(e) => (e.stopPropagation(), dropField(s.id, x.id))}
                          className={cn('group/row -mx-3 flex items-center rounded-md', on ? 'bg-primary/8 ring-1 ring-primary' : 'hover:bg-muted', drag?.f === x.id && 'opacity-40')}
                        >
                          <button type="button" onClick={() => setSel({ s: s.id, f: x.id })} className="flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pr-1 pl-2 text-left">
                            <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground/50" aria-hidden="true" />
                            <I className="size-4 shrink-0 text-muted-foreground" />
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate text-[15px] leading-snug">{x.label}</span>
                              <span className="flex items-center gap-2 truncate text-[12px] leading-tight text-muted-foreground">
                                {x.type === 'profile' && x.profileKey ? `Из профиля: ${x.profileKey}` : x.type === 'documentRequest' && x.category ? `Документ: ${x.category}` : FIELD_TYPE_LABEL[x.type]}
                                {x.repeatable && ', можно повторять'}
                                {x.proof && (
                                  <span className="flex items-center gap-1 text-primary">
                                    <FileCheck2 className="size-3.5 shrink-0" /> Нужно подтверждение
                                  </span>
                                )}
                              </span>
                            </span>
                            {check && <StatusDot tone="warning">Проверьте</StatusDot>}
                            {x.pdf && <span className="shrink-0 font-mono text-xs text-muted-foreground">{x.pdf}</span>}
                          </button>
                          <span className="mr-1 hidden shrink-0 group-hover/row:flex">
                            <button type="button" aria-label="Поле выше" disabled={fi === 0} onClick={() => shiftField(s.id, x.id, -1)} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30">
                              <ArrowUp className="size-4" />
                            </button>
                            <button type="button" aria-label="Поле ниже" disabled={fi === s.fields.length - 1} onClick={() => shiftField(s.id, x.id, 1)} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30">
                              <ArrowDown className="size-4" />
                            </button>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  {s.fields.length === 0 && <p className="py-1 text-sm text-muted-foreground">Полей пока нет. Добавьте первое.</p>}
                  {/* Быстрое добавление: частые типы — в один клик, остальные — в «Ещё». */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[13px] text-muted-foreground">Добавить:</span>
                    {(s.audience === 'AGENCY_ONLY' ? (['text', 'select', 'date', 'file'] as FieldType[]) : (['profile', 'text', 'select', 'date', 'documentRequest', 'file'] as FieldType[])).map((t) => {
                      const I = TYPE_ICON[t]
                      return (
                        <button key={t} type="button" onClick={() => addField(s.id, t)} className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[13px] hover:bg-muted">
                          <I className="size-3.5 text-muted-foreground" /> {FIELD_TYPE_LABEL[t]}
                        </button>
                      )
                    })}
                    <button type="button" onClick={() => setAdding(adding === s.id ? null : s.id)} aria-expanded={adding === s.id} className="flex h-8 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-primary hover:bg-muted">
                      <Plus className="size-3.5" /> Ещё
                    </button>
                  </div>
                  {adding === s.id && (
                    <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1.5">
                      {(s.audience === 'AGENCY_ONLY' ? AGENCY_TYPES : ALL_TYPES).map((t) => {
                        const I = TYPE_ICON[t]
                        return (
                          <button key={t} type="button" onClick={() => addField(s.id, t)} className="flex h-9 items-center gap-2 rounded-md px-2.5 text-left text-sm hover:bg-muted">
                            <I className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{FIELD_TYPE_LABEL[t]}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>

          {/* Властивості */}
          <aside className="flex w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-border bg-surface px-5 py-5">
            {field ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold">Поле</h2>
                  <span className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Переместить вверх" onClick={() => move(-1)}>
                      <ArrowUp />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Переместить вниз" onClick={() => move(1)}>
                      <ArrowDown />
                    </Button>
                  </span>
                </div>
                <WebField id="fe-label" label="Название">
                  <WebInput id="fe-label" value={field.label} onChange={(e) => putField({ label: e.target.value })} />
                </WebField>
                <WebField id="fe-type" label="Тип поля">
                  <WebSelect className="data-[size=default]:h-10" id="fe-type" value={field.type} onChange={(t) => putField({ type: t as FieldType })} options={(section.audience === 'AGENCY_ONLY' ? AGENCY_TYPES : ALL_TYPES).map((t) => ({ value: t, label: FIELD_TYPE_LABEL[t] }))} />
                </WebField>
                {field.type === 'profile' && (
                  <WebField id="fe-key" label="Поле профиля" hint="Подставится из профиля моряка, он может поправить.">
                    <WebSelect className="data-[size=default]:h-10" id="fe-key" value={field.profileKey ?? ''} onChange={(profileKey) => putField({ profileKey })} options={PROFILE_KEYS} />
                  </WebField>
                )}
                {field.type === 'documentRequest' && (
                  <WebField id="fe-cat" label="Категория документа" hint="Приложение предложит подходящий документ моряка.">
                    <WebSelect className="data-[size=default]:h-10" id="fe-cat" value={field.category ?? ''} onChange={(category) => putField({ category })} options={DOC_CATEGORIES} />
                  </WebField>
                )}
                {field.pdf && (
                  <WebField label="Поле в PDF">
                    <span className="flex h-10 items-center rounded-md bg-muted px-3 font-mono text-sm">{field.pdf}</span>
                  </WebField>
                )}
                <p className="text-[13px] text-muted-foreground">Моряк заполнит все поля — из профиля или вручную.</p>
                {section.audience === 'SEAFARER' && (
                  <div className="flex flex-col gap-1.5">
                    <WebCheckbox id="fe-proof" checked={!!field.proof} onChange={(proof) => putField({ proof })}>
                      Нужно подтверждение
                    </WebCheckbox>
                    <p className="pl-[26px] text-[13px] text-muted-foreground">Фото, файл или документ из профиля моряка рядом с данными. Без подтверждения поле не примется.</p>
                  </div>
                )}
                <div className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">Заполняет: {AUDIENCE_LABEL[section.audience]}</span>
                  <Button variant="ghost" className="self-start px-0 text-signal hover:bg-transparent" onClick={removeField}>
                    <Trash2 /> Удалить поле
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold">Раздел</h2>
                <WebField id="fe-st" label="Название раздела">
                  <WebInput id="fe-st" value={section.title} onChange={(e) => putSection(section.id, { title: e.target.value })} />
                </WebField>
                <WebField
                  label="Кто заполняет"
                  hint={blocked.length && section.audience === 'SEAFARER' ? `Агентство не заполняет поля «${FIELD_TYPE_LABEL[blocked[0].type]}». Уберите их, чтобы отдать раздел агентству.` : AUDIENCE_HINT[section.audience]}
                >
                  <div role="radiogroup" className="flex flex-col gap-1">
                    {(['SEAFARER', 'AGENCY_ONLY'] as Audience[]).map((a) => (
                      <button
                        key={a}
                        type="button"
                        role="radio"
                        aria-checked={section.audience === a}
                        disabled={a === 'AGENCY_ONLY' && blocked.length > 0}
                        onClick={() => putSection(section.id, { audience: a })}
                        className={cn('flex h-10 items-center gap-3 rounded-md border px-3 text-left text-sm disabled:opacity-50', section.audience === a ? 'border-primary text-primary' : 'border-border hover:bg-muted')}
                      >
                        {a === 'AGENCY_ONLY' ? <Building2 className="size-4" /> : <UserRound className="size-4" />}
                        {AUDIENCE_LABEL[a]}
                      </button>
                    ))}
                  </div>
                </WebField>
                <p className="text-sm text-muted-foreground">Выберите поле в анкете, чтобы изменить его.</p>
                {sections.length > 1 && (
                  <Button variant="ghost" className="mt-auto self-start px-0 text-signal hover:bg-transparent" onClick={removeSection}>
                    <Trash2 /> Удалить раздел
                  </Button>
                )}
              </>
            )}
          </aside>
        </div>
      </ViewState>
    </WebShell>
  )
}
