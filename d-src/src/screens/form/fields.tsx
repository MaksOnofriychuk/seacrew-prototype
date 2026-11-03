import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, Camera, Check, ChevronDown, CircleAlert, FileCheck2, FileText, FolderOpen, History, PenLine, Plus, ShieldCheck, UserRound, X } from 'lucide-react'
import { FieldMsg } from '@/components/app/field-msg'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { SourceSheet, type SourceItem } from '@/components/app/source-sheet'
import { CountryPick, DatePick, MonthRangePick, NumberPick, PhoneField, SIZE_RANGES } from '@/components/app/pickers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { BOUNDS } from '@/lib/dates'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { plural } from '../s/_stepper'
import { ExpandRow } from '../dp/_inline-edit'
import { CheckRow, TextInput } from '../q/_parts'
import { TextArea, XSelect } from '../s/_extra-parts'
import { AirportPick } from '../s/s12'
import { CONTRACT_COLS, FORM_ORG, rowMissing, type ContractRow, type Question } from './data'
import { joinComposite, needsChoice, proofOk, splitComposite, uniqValues, type Answer, type FormState } from './state'

// Питання анкети: напис як у бланку; мітка джерела — НАД полем праворуч від підпису (правка №21:
// «из профиля», «из документа», «исправлено вами»); тап по мітці — вікно вибору джерела (SourceSheet,
// правка №13) з іншим значенням або «Ввести вручную». Під полем — зарезервований рядок (правка №9).
// Різні значення — вибір, нічого не змішується (ADR-077 п. 6). Збережена відповідь з іншим написом
// чи розділом — пропозиція з «Использовать» (ADR-073 п. 16.1). «Нужно подтверждение документом» —
// значення з підтвердженого документа або вручну + фото чи файл (registration-spec §9).

/* ---------- джерело під полем ---------- */

export function sourceText(q: Question, a?: Answer): { text: string; tone: 'auto' | 'edited' | 'manual' } | null {
  if (!a) return null
  if (a.src === 'sugg') return { text: 'Из профиля', tone: 'auto' }
  if (typeof a.src === 'number') return { text: q.sources[a.src]?.label ?? 'Из профиля', tone: 'auto' }
  if (a.base !== undefined) return { text: `Изменено. Было: ${q.sources[a.base]?.value}`, tone: 'edited' }
  return { text: 'Вручную', tone: 'manual' }
}

const KIND_TAG: Record<string, string> = { profile: 'из профиля', doc: 'из документа', cv: 'из CV', past: 'из прошлой анкеты' }

type Tag = { text: string; tone: 'auto' | 'warn' | 'plain'; icon?: typeof Check }

/** Мітка джерела над полем: звідки значення. Порожнє поле мітки не має. */
function tagOf(q: Question, a: Answer | undefined, proved: boolean): Tag | null {
  if (!a?.v) return null
  if (a.src === 'sugg') return { text: 'из профиля', tone: 'plain' }
  if (typeof a.src === 'number') {
    const s = q.sources[a.src]
    if (q.proof && proved && s?.kind === 'doc' && !s.unproved) return { text: 'подтверждено', tone: 'auto', icon: ShieldCheck }
    return { text: KIND_TAG[s?.kind ?? 'profile'], tone: 'plain' }
  }
  if (a.base !== undefined) return { text: 'исправлено вами', tone: 'warn' }
  return { text: 'введено вами', tone: 'plain' }
}

function FieldTag({ tag, onPick }: { tag: Tag | null; onPick?: () => void }) {
  if (!tag) return null
  const Icon = tag.icon
  const badge = (
    <Badge variant={tag.tone === 'warn' ? 'warning' : tag.tone === 'auto' ? 'success' : 'outline'} className={cn('max-w-full font-normal', tag.tone === 'plain' && 'text-muted-foreground')}>
      {Icon && <Icon />}
      {tag.text}
      {onPick && <ChevronDown />}
    </Badge>
  )
  return onPick ? (
    <button type="button" onClick={onPick} aria-label={`Источник значения: ${tag.text}. Изменить`} className="-my-1.5 py-1.5">
      {badge}
    </button>
  ) : (
    badge
  )
}

/* ---------- одне питання: рядок, що розгортається ---------- */

// Правило Макса (№42): поля розділу — рядки, що розгортаються, як у «Проверьте документ» (p19) і в профілі.
// Згорнутий рядок: підпис ліворуч, значення праворуч, мітка стану («из документа», «выберите», «введено
// вами», «Заполните»), шеврон. Розгорнутий — контрол, вибір джерела, «В документе: …», «Готово» / «Отмена».
// Відкритий один рядок (стежить розділ). Лише перегляд (після відправки) — той самий рядок без контролів.

const IN_DOC = { profile: 'В профиле', doc: 'В документе', cv: 'В CV', past: 'В прошлой анкете' } as const

/** Значення в згорнутому рядку. */
export function rowValue(q: Question, st: FormState): string {
  const a = st.answers[q.id]
  if (q.kind === 'photo') return a ? (a.src === 'manual' ? 'photo_3x4.jpg' : 'Фото 3×4') : ''
  if (q.kind === 'table') {
    const n = st.rows?.list.length ?? 0
    return n ? `${n} ${plural(n, 'запись', 'записи', 'записей')}` : ''
  }
  if (q.kind === 'consent') return a ? 'Согласен' : ''
  return a?.v ?? ''
}

export function QuestionField({
  q,
  st,
  showError,
  readOnly,
  go,
  open,
  onToggle,
}: {
  q: Question
  st: FormState
  showError: boolean
  readOnly?: boolean
  go: (id: string) => void
  open: boolean
  onToggle: () => void
}) {
  const { showToast, state, bag, setBag } = useProto()
  // Правка №12: запобіжник від неправильних документів діє і тут. Сценарій панелі «Это не документ моряка»
  // = прикріпили не той документ: перший раз — попередження, другий поспіль — e08. Лічильник спільний з q04/e02.
  const [wrong, setWrong] = useState(false)
  const [pick, setPick] = useState(false)
  const snap = useRef<ReturnType<typeof st.snapshot> | null>(null)
  useEffect(() => {
    if (open) snap.current = st.snapshot(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const a = st.answers[q.id]
  const err = showError && !readOnly ? st.issue(q) : null
  const choice = needsChoice(q, a)
  const proved = proofOk(q, a, st.proof)
  const value = rowValue(q, st)
  const hasValue = !!value || (q.kind === 'signature' && !!a?.v)
  const shown = q.kind === 'signature' ? (a?.v ?? '') : value
  const multi = uniqValues(q).length > 1 && q.kind !== 'table'
  const mono = q.kind === 'phone' || q.kind === 'date' || q.kind === 'size' || q.kind === 'doc' || q.mono

  // мітка в рядку: помилка → вибір → потрібен документ → джерело
  let tag: ReactNode = null
  if (err) tag = <span className="text-sm font-medium text-signal">{hasValue ? 'Исправьте' : 'Заполните'}</span>
  else if (choice && !readOnly) tag = <Badge variant="warning" className="font-normal">выберите</Badge>
  else if (q.proof && hasValue && !proved) tag = <Badge variant="warning" className="font-normal">нужен документ</Badge>
  else if (q.kind === 'table') tag = st.rows?.list.length ? <FieldTag tag={st.rows.edited ? { text: 'исправлено вами', tone: 'warn' } : { text: 'из профиля', tone: 'plain' }} /> : null
  else if (q.suggestion && !hasValue) tag = <FieldTag tag={{ text: 'прошлый ответ', tone: 'plain' }} />
  else tag = <FieldTag tag={tagOf(q, a, proved && !st.proof[q.id])} />

  // порожнє обов'язкове після автозаповнення — легка підсвітка рядка
  const hint = st.filled && !readOnly && !hasValue && !open && !err

  const detail = a?.base !== undefined && a.v ? `${IN_DOC[q.sources[a.base]?.kind ?? 'profile']}: ${q.sources[a.base]?.value}` : null

  const finish = () => onToggle()
  const cancel = () => {
    if (snap.current) st.restore(q, snap.current)
    onToggle()
  }

  const body = readOnly ? (
    <ReadBody q={q} st={st} a={a} />
  ) : (
    <div className="flex flex-col gap-3">
      {q.proof && (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <FileCheck2 className="size-4 shrink-0 text-primary" />
          Нужно подтверждение документом
        </span>
      )}
      {choice ? (
        <div className="flex flex-col gap-2">
          {q.ask && <p className="text-sm text-muted-foreground">{q.ask}</p>}
          <button type="button" onClick={() => setPick(true)} className="flex min-h-12 items-center gap-3 rounded-md border border-dashed border-warning bg-surface px-4 text-left text-[15px]">
            <CircleAlert className="size-4 shrink-0 text-warning" />
            <span className="flex-1">Выберите значение</span>
            <span className="text-sm text-muted-foreground">
              <span className="font-mono">{uniqValues(q).length}</span> варианта
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <>
          <Control q={q} st={st} a={a} err={err} go={go} />
          {multi && (
            <button type="button" onClick={() => setPick(true)} className="flex w-fit items-center gap-1.5 text-sm font-medium text-primary">
              Другой источник <ChevronDown className="size-4" />
            </button>
          )}
        </>
      )}

      {/* збережена відповідь з іншим написом або розділом — лише пропозиція */}
      {q.suggestion && !a?.v && (
        <div className="flex items-center gap-3 rounded-md bg-card px-4 py-3">
          <p className="flex-1 text-sm text-muted-foreground">
            Ваш ответ на «{q.suggestion.question}» (раздел «{q.suggestion.section}»):{' '}
            <span className={cn('text-[15px] font-medium text-foreground', q.mono && 'font-mono')}>{q.suggestion.value}</span>
          </p>
          <Button size="sm" variant="outline" className="text-primary" onClick={() => st.setAnswer(q.id, { v: q.suggestion!.value, src: 'sugg' })}>
            Использовать
          </Button>
        </div>
      )}

      {q.proof && a?.v && !proved && (
        <ProofBox
          q={q}
          st={st}
          invalid={!!err}
          wrong={wrong}
          onAttach={(kind, name) => {
            if (state.scenario === 'notSeafarer') {
              if (bag<number>('q.wrongDocs', 0) >= 1) return go('e08')
              setBag('q.wrongDocs', 1)
              setWrong(true)
              return
            }
            setBag('q.wrongDocs', null)
            setWrong(false)
            st.setProof(q.id, kind === 'photo' ? { name: 'medical_photo.jpg', size: '1,2 МБ' } : kind === 'doc' ? { name: name ?? 'Документ', size: 'из профиля' } : { name: 'Medical_certificate.pdf', size: '480 КБ' })
            showToast('Подтверждение прикреплено')
          }}
        />
      )}
      {q.proof && st.proof[q.id] && <Attached p={st.proof[q.id]} onRemove={() => st.setProof(q.id, null)} />}

      {/* единственный зарезервированный ряд — здесь, в раскрытом блоке (правка №9) */}
      <FieldMsg error={choice ? null : err} note={detail} />
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="h-11 flex-1 text-[15px]" onClick={cancel}>
          Отмена
        </Button>
        <Button type="button" className="h-11 flex-1 text-[15px]" onClick={finish}>
          Готово
        </Button>
      </div>

      <FieldSources
        q={pick ? q : null}
        a={a}
        onClose={() => setPick(false)}
        onPick={(i) => {
          setPick(false)
          if (i === 'manual') {
            st.setAnswer(q.id, { v: '', src: 'manual', base: a && typeof a.src === 'number' ? a.src : a?.base })
            window.setTimeout(() => document.getElementById(`fi-${q.id}`)?.focus(), 260)
          } else st.setAnswer(q.id, { v: q.sources[i].value, src: i })
        }}
      />
    </div>
  )

  return (
    <div id={`fq-${q.id}`} className="border-t border-border first:border-t-0">
      <ExpandRow
        className={cn('border-t-0', hint && 'bg-warning/10')}
        title={
          // Мітка джерела — над назвою поля, однаково в кожному рядку (перевірка 03.11, №50).
          <span className="flex min-w-0 flex-col items-start gap-1 overflow-hidden">
            {tag}
            <span className="text-muted-foreground">{q.label}</span>
          </span>
        }
        value={
          !hasValue ? (
            <span className="text-muted-foreground">Не заполнено</span>
          ) : q.kind === 'doc' || q.kind === 'nok' ? (
            <span className="flex min-w-0 max-w-full flex-col items-end text-right leading-snug">
              <span className={cn('max-w-full text-sm text-foreground [overflow-wrap:anywhere]', q.kind === 'doc' && 'font-mono')}>{splitComposite(q.kind, shown).a || '—'}</span>
              <span className={cn('max-w-full text-sm [overflow-wrap:anywhere]', splitComposite(q.kind, shown).b ? 'font-mono text-muted-foreground' : 'text-signal')}>
                {splitComposite(q.kind, shown).b ? (q.kind === 'doc' ? 'до ' : '') + splitComposite(q.kind, shown).b : q.kind === 'doc' ? 'нет срока' : 'нет телефона'}
              </span>
            </span>
          ) : (
            <span className={cn('block max-w-full text-sm text-foreground [overflow-wrap:anywhere]', mono && 'font-mono text-[13px] tracking-tight')}>{shown}</span>
          )
        }
        open={open}
        onToggle={onToggle}
      >
        {body}
      </ExpandRow>
    </div>
  )
}

/** Контрол розгорнутого рядка — за типом питання. */
function Control({ q, st, a, err, go }: { q: Question; st: FormState; a?: Answer; err: string | null; go: (id: string) => void }) {
  void go
  const id = `fi-${q.id}`
  const set = (v: string) => st.type(q, v)
  if (q.kind === 'photo') return <PhotoValue a={a} onAdd={() => st.setAnswer(q.id, { v: 'photo_3x4.jpg', src: 'manual' })} />
  if (q.kind === 'table') return <ContractsBody q={q} st={st} err={err} />
  if (q.kind === 'consent' || q.kind === 'signature') return <SignBody q={q} st={st} err={err} />
  if (q.kind === 'textarea') return <TextArea id={id} value={a?.v ?? ''} placeholder={q.placeholder} onChange={(e) => set(e.target.value)} />
  if (q.kind === 'phone') return <PhoneField id={id} value={a?.v ?? ''} invalid={!!err} onChange={set} />
  if (q.kind === 'choice') return <XSelect id={id} value={a?.v ?? ''} options={q.options ?? []} placeholder="Выбрать" onChange={set} />
  if (q.kind === 'airport') return <AirportPick id={id} value={a?.v ?? ''} invalid={!!err} onChange={set} />
  if (q.kind === 'doc' || q.kind === 'nok') return <Composite q={q} a={a} err={err} onChange={set} />
  if (q.kind === 'country') return <CountryPick id={id} title={q.label} value={a?.v ?? ''} invalid={!!err} onChange={set} />
  if (q.kind === 'size') return <NumberPick id={id} title={q.label} value={a?.v ?? ''} invalid={!!err} onChange={set} {...SIZE_RANGES[q.size ?? 'shoe']} />
  if (q.kind === 'date')
    return <DatePick id={id} title={q.label} value={a?.v ?? ''} invalid={!!err} initial={q.bound === 'birth' ? new Date(1998, 5, 15) : undefined} onChange={set} {...BOUNDS[q.bound ?? 'issue']} />
  return (
    <TextInput id={id} mono={q.mono} value={a?.v ?? ''} placeholder={q.placeholder} invalid={!!err} inputMode={q.numeric ? 'numeric' : undefined} className={cn(q.mono && 'placeholder:font-sans')} onChange={(e) => set(e.target.value)} />
  )
}

/** Розгорнутий рядок у режимі «лише перегляд»: повне значення, джерело, таблиця. */
function ReadBody({ q, st, a }: { q: Question; st: FormState; a?: Answer }) {
  const src = sourceText(q, a)
  const proof = st.proof[q.id]
  if (q.kind === 'table')
    return (
      <ul className="flex flex-col gap-3">
        {(st.rows?.list ?? []).map((r) => {
          const miss = rowMissing(r)
          return (
            <li key={r.id} className="flex flex-col">
              <span className="text-[15px] font-medium">{r.vessel}</span>
              <span className="font-mono text-sm text-muted-foreground">{r.period}</span>
              <span className="text-sm text-muted-foreground">{[r.type, r.rank, r.engine].filter(Boolean).join(', ')}</span>
              {miss.length > 0 && (
                <span className="mt-0.5 flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="size-3.5 text-warning" /> Неполная запись, в черновике
                </span>
              )}
            </li>
          )
        })}
      </ul>
    )
  return (
    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
      <span className={cn('text-[15px] break-words text-foreground', (q.kind === 'phone' || q.kind === 'date' || q.kind === 'doc') && 'font-mono')}>{rowValue(q, st) || a?.v || '—'}</span>
      {src && <span>Источник: {src.text.replace(/^Изменено\. Было:/, 'исправлено вами, было:')}</span>}
      {proof && <span>Подтверждение прикреплено: {proof.name}</span>}
    </div>
  )
}

/* ---------- підтвердження документом ---------- */

// «Медицинский сертификат, действует до» → «медицинский сертификат»; абревіатури лишаються.
const docName = (label: string) => {
  const t = label.split(',')[0]
  return t[0].toLowerCase() + t.slice(1)
}

function ProofBox({ q, st, invalid, wrong, onAttach }: { q: Question; st: FormState; invalid: boolean; wrong: boolean; onAttach: (k: 'photo' | 'file' | 'doc', name?: string) => void }) {
  const a = st.answers[q.id]
  const [docs, setDocs] = useState(false)
  const fromProfile = a && typeof a.src === 'number' && q.sources[a.src]?.unproved
  return (
    <div className={cn('flex flex-col gap-3 rounded-md border border-dashed px-4 py-3', invalid ? 'border-signal' : 'border-warning')}>
      <p className="flex items-start gap-2 text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <span>
          {fromProfile ? 'В профиле это введено без документа.' : 'Значение введено вручную.'} Прикрепите подтверждение.
        </span>
      </p>
      {wrong && (
        <div role="alert" className="flex flex-col gap-1 rounded-md bg-warning/10 px-3 py-2.5 text-sm">
          <span className="font-medium">Это не {docName(q.label)}. Прикрепите документ, который подтверждает это поле.</span>
          <span>Ещё одна ошибка — и аккаунт будет заблокирован</span>
        </div>
      )}
      {/* Три кнопки в сітку на всю ширину — без виходу за межі блоку (перевірка 03.11, №49). */}
      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="outline" className="h-14 min-w-0 flex-col gap-1 px-1 text-[13px] text-primary" onClick={() => onAttach('photo')}>
          <Camera /> Фото
        </Button>
        <Button size="sm" variant="outline" className="h-14 min-w-0 flex-col gap-1 px-1 text-[13px] text-primary" onClick={() => onAttach('file')}>
          <FolderOpen /> Файл
        </Button>
        <Button size="sm" variant="outline" className="h-14 min-w-0 flex-col gap-1 px-1 text-[13px] text-primary" onClick={() => setDocs(true)}>
          <FileCheck2 /> Документ
        </Button>
      </div>
      <SourceSheet
        open={docs}
        onClose={() => setDocs(false)}
        title="Из моих документов"
        description="Документ из профиля прикрепится к этому полю как подтверждение."
        items={PROOF_DOCS.map((d) => ({
          icon: FileText,
          title: d.title,
          sub: d.sub,
          onClick: () => {
            setDocs(false)
            onAttach('doc', d.title)
          },
        }))}
      />
    </div>
  )
}

// Документи з профілю, які можна прикріпити як підтвердження (приклад).
const PROOF_DOCS = [
  { title: 'Медицинский сертификат', sub: 'Фото, 1 стр.' },
  { title: 'Удостоверение личности моряка', sub: 'Фото, 1 стр.' },
  { title: 'Диплом (CoC)', sub: 'PDF, 2 стр.' },
  { title: 'Загранпаспорт', sub: 'Фото, 1 стр.' },
]

function Attached({ p, readOnly, onRemove }: { p: { name: string; size: string }; readOnly?: boolean; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5">
      <FileText className="size-5 shrink-0 text-primary" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{p.name}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" /> Подтверждение, <span className="font-mono">{p.size}</span>
        </span>
      </span>
      {!readOnly && (
        <button type="button" onClick={onRemove} aria-label="Убрать файл" className="flex size-9 items-center justify-center rounded-md text-muted-foreground">
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

/* ---------- фото ---------- */

function PhotoValue({ a, readOnly, onAdd }: { a?: Answer; readOnly?: boolean; onAdd: () => void }) {
  if (!a)
    return (
      <div className="flex gap-2">
        <Button variant="outline" className="h-12 flex-1 text-[15px] text-primary" disabled={readOnly} onClick={onAdd}>
          <Camera /> Добавить фото
        </Button>
        <Button variant="outline" className="h-12 flex-1 text-[15px] text-primary" disabled={readOnly} onClick={onAdd}>
          <FolderOpen /> Из файлов
        </Button>
      </div>
    )
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-[72px] w-[54px] shrink-0 items-center justify-center rounded-md border border-border bg-muted text-lg font-semibold text-primary">AK</span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px]">{a.src === 'manual' ? 'photo_3x4.jpg' : 'Фото 3×4'}</span>
        <span className="text-sm text-muted-foreground">{a.src === 'manual' ? 'Загружено для этой анкеты' : 'Светлый фон, анфас'}</span>
      </span>
      {!readOnly && (
        <Button size="sm" variant="ghost" className="ml-auto text-primary" onClick={onAdd}>
          Заменить
        </Button>
      )}
    </div>
  )
}

/* ---------- згода й підпис ---------- */

function SignBody({ q, st, err }: { q: Question; st: FormState; err: string | null }) {
  const a = st.answers[q.id]
  if (q.kind === 'consent')
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-md bg-card px-4 py-3 text-sm text-muted-foreground">
          {FORM_ORG} обрабатывает ваши данные, чтобы подобрать вас на судно, и передаёт их судовладельцу этой вакансии.
        </p>
        <CheckRow id={`fi-${q.id}`} checked={!!a} onChange={(v) => st.setAnswer(q.id, v ? { v: 'Согласен', src: 'manual' } : null)}>
          Я согласен / согласна
        </CheckRow>
      </div>
    )
  const ok = !!st.answers[q.id + '.ok']
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Введите полное имя и подтвердите — это будет вашей подписью.</p>
      <TextInput id={`fi-${q.id}`} value={a?.v ?? ''} placeholder="Полное имя" invalid={!!err && !a?.v} onChange={(e) => st.setAnswer(q.id, e.target.value ? { v: e.target.value, src: 'manual' } : null)} />
      <CheckRow id={`fi-${q.id}-ok`} checked={ok} onChange={(v) => st.setAnswer(q.id + '.ok', v ? { v: 'yes', src: 'manual' } : null)}>
        Подтверждаю, что это моя подпись
      </CheckRow>
    </div>
  )
}

/* ---------- таблиця бланка: рядки зі списку контрактів профілю ---------- */

function ContractsBody({ q, st, err }: { q: Question; st: FormState; err: string | null }) {
  void q
  const [edit, setEdit] = useState<{ i: number; row: ContractRow } | null>(null)
  const list = st.rows?.list ?? []
  const blank: ContractRow = { id: '', vessel: '', type: '', rank: '', period: '', engine: '' }

  return (
    <div className="flex flex-col gap-2">
      <ul className={cn('overflow-hidden rounded-xl border bg-surface', err ? 'border-signal' : 'border-border')}>
        {list.map((r, i) => {
          const miss = rowMissing(r)
          return (
            <li key={r.id} className="border-t border-border first:border-t-0">
              <button type="button" onClick={() => setEdit({ i, row: r })} className="flex w-full flex-col gap-1 px-4 py-3 text-left">
                <span className="text-[15px] font-medium">{r.vessel || 'Без названия'}</span>
                <span className="font-mono text-sm text-muted-foreground">{r.period}</span>
                <span className="text-sm text-muted-foreground">{[r.type, r.rank, r.engine].filter(Boolean).join(', ')}</span>
                {miss.length > 0 && (
                  <span className="mt-1 flex items-start gap-2 text-sm">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <span className="flex-1">
                      Неполная запись, останется в черновике. Нет: {miss.map((m) => m.toLowerCase()).join(', ')}
                    </span>
                    <span className="font-medium text-primary">Дополнить</span>
                  </span>
                )}
              </button>
            </li>
          )
        })}
        {!list.length && <li className="px-4 py-3 text-sm text-muted-foreground">Записей пока нет. Добавьте запись или подставьте контракты из профиля.</li>}
        <li className="border-t border-border">
          <button type="button" onClick={() => setEdit({ i: -1, row: { ...blank, id: 'n' + Date.now() } })} className="flex w-full items-center gap-2 px-4 py-3 text-[15px] font-medium text-primary">
            <Plus className="size-4" /> Добавить запись
          </button>
        </li>
      </ul>
      <RowSheet
        edit={edit}
        onClose={() => setEdit(null)}
        onSave={(row) => {
          st.setRows(edit!.i < 0 ? [...list, row] : list.map((x, j) => (j === edit!.i ? row : x)))
          setEdit(null)
        }}
        onDelete={() => {
          st.setRows(list.filter((_, j) => j !== edit!.i))
          setEdit(null)
        }}
      />
    </div>
  )
}

function RowSheet({ edit, onClose, onSave, onDelete }: { edit: { i: number; row: ContractRow } | null; onClose: () => void; onSave: (r: ContractRow) => void; onDelete: () => void }) {
  const [row, setRow] = useState<ContractRow | null>(null)
  const cur = row && edit && row.id === edit.row.id ? row : edit?.row
  const miss = cur ? rowMissing(cur) : []
  return (
    <BottomSheet
      open={!!edit}
      onClose={() => {
        setRow(null)
        onClose()
      }}
      title={edit && edit.i >= 0 ? `Запись ${edit.i + 1}` : 'Новая запись'}
      description="Колонки — как в таблице бланка."
      footer={
        <>
          <Button
            size="lg"
            onClick={() => {
              if (cur) onSave(cur)
              setRow(null)
            }}
          >
            Готово
          </Button>
          <p className="min-h-5 text-center text-sm text-muted-foreground">{miss.length > 0 && cur ? 'Неполную запись сохраним в черновике' : null}</p>
          {edit && edit.i >= 0 && (
            <Button
              size="lg"
              variant="ghost"
              className="text-signal"
              onClick={() => {
                setRow(null)
                onDelete()
              }}
            >
              Удалить
            </Button>
          )}
        </>
      }
    >
      {cur && (
        <div className="flex flex-col gap-4">
          {CONTRACT_COLS.map((c) => (
            <div key={c.key} className="flex flex-col gap-2">
              <Label htmlFor={`row-${c.key}`} className="text-[15px] font-medium">
                {c.label}
              </Label>
              {c.key === 'period' ? (
                <MonthRangePick id={`row-${c.key}`} value={cur.period} onChange={(v) => setRow({ ...cur, period: v })} />
              ) : (
                <TextInput
                  id={`row-${c.key}`}
                  mono={c.mono}
                  value={cur[c.key]}
                  placeholder={c.placeholder}
                  className={cn(c.mono && 'placeholder:font-sans', !cur[c.key] && 'border-warning')}
                  onChange={(e) => setRow({ ...cur, [c.key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  )
}

/* ---------- вибір джерела ---------- */

// Те саме вікно, що й усі «Добавить …» (правка №13): сгруппированный список, иконка слева, подпись серым.
const SRC_ICON = { profile: UserRound, doc: FileText, cv: FileText, past: History } as const

function FieldSources({ q, a, onClose, onPick }: { q: Question | null; a?: Answer; onClose: () => void; onPick: (i: number | 'manual') => void }) {
  // однакові значення з різних джерел — один рядок (вищий пріоритет)
  const opts = q ? q.sources.map((s, i) => ({ s, i })).filter((o, k, arr) => arr.findIndex((x) => x.s.value === o.s.value) === k) : []
  const items: SourceItem[] = q
    ? [
        ...opts.map(({ s, i }) => ({ icon: SRC_ICON[s.kind], title: s.value, sub: s.label, selected: a?.src === i, onClick: () => onPick(i) })),
        { icon: PenLine, title: 'Ввести вручную', sub: 'Своё значение вместо этих', selected: a?.src === 'manual', onClick: () => onPick('manual') },
      ]
    : []
  return <SourceSheet open={!!q} onClose={onClose} title={q?.label ?? ''} description={q?.ask ?? 'Откуда взять значение:'} items={items} />
}

/* ---------- складені поля: документ (номер + дата), близька людина (ім'я + телефон) ---------- */

function Composite({ q, a, err, readOnly, onChange }: { q: Question; a?: Answer; err: string | null; readOnly?: boolean; onChange: (v: string) => void }) {
  const kind = q.kind as 'doc' | 'nok'
  const { a: first, b: second } = splitComposite(kind, a?.v ?? '')
  const bad = !!err
  const sub = (t: string) => <span className="text-sm text-muted-foreground">{t}</span>
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        {sub(q.part ?? '')}
        <TextInput id={`fi-${q.id}`} value={first} readOnly={readOnly} invalid={bad && !first.trim()} onChange={(e) => onChange(joinComposite(kind, e.target.value, second))} className={cn(readOnly && 'bg-muted')} />
      </div>
      <div className="flex flex-col gap-1.5">
        {sub(kind === 'doc' ? 'Действителен до' : 'Телефон')}
        {kind === 'doc' ? (
          <DatePick id={`fi-${q.id}-b`} title={`${q.label}: действителен до`} value={second} invalid={bad && !second} disabled={readOnly} onChange={(v) => onChange(joinComposite(kind, first, v))} {...BOUNDS.expiry()} />
        ) : (
          <PhoneField id={`fi-${q.id}-b`} value={second} invalid={bad && !second} disabled={readOnly} onChange={(v) => onChange(joinComposite(kind, first, v))} />
        )}
      </div>
    </div>
  )
}
