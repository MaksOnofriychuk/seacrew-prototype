import { useState } from 'react'
import { AlertTriangle, Camera, Check, ChevronDown, CircleAlert, FileCheck2, FileText, FolderOpen, PenLine, Plus, ShieldCheck, X } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { CountryPick, DatePick, MonthRangePick, PhoneField } from '@/components/app/pickers'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { BOUNDS } from '@/lib/dates'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { CheckRow, TextInput } from '../q/_parts'
import { plural } from '../s/_stepper'
import { TextArea } from '../s/_extra-parts'
import { CONTRACT_COLS, FORM_ORG, rowMissing, type ContractRow, type Question } from './data'
import { needsChoice, proofOk, uniqValues, type Answer, type FormState } from './state'

// Питання анкети: напис як у бланку; під полем — звідки значення («Из профиля», «Из документа: …»,
// «Из вашей анкеты для …», «Вручную»); тап по джерелу — інше джерело або «Ввести вручную».
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

function SourceLine({ q, a, proved, readOnly, onPick }: { q: Question; a?: Answer; proved: boolean; readOnly?: boolean; onPick: () => void }) {
  const s = sourceText(q, a)
  if (!s) return null
  const canPick = !readOnly && q.sources.length > 0
  const Icon = s.tone === 'auto' ? (q.proof && proved ? ShieldCheck : Check) : PenLine
  return (
    <button type="button" disabled={!canPick} onClick={onPick} className="flex items-center gap-1.5 self-start text-left text-sm text-muted-foreground disabled:pointer-events-none">
      <Icon className={cn('size-4 shrink-0', s.tone === 'auto' && typeof a?.src === 'number' && q.sources[a.src]?.unproved ? 'text-muted-foreground' : s.tone === 'auto' ? 'text-success' : s.tone === 'edited' ? 'text-warning' : 'text-muted-foreground')} strokeWidth={2.25} />
      <span>
        {s.text}
        {q.proof && proved && s.tone === 'auto' && ', подтверждено'}
      </span>
      {canPick && <ChevronDown className="size-3.5 shrink-0" />}
    </button>
  )
}

/* ---------- одне питання ---------- */

export function QuestionField({ q, st, showError, readOnly, go }: { q: Question; st: FormState; showError: boolean; readOnly?: boolean; go: (id: string) => void }) {
  const { showToast, state, bag, setBag } = useProto()
  // Правка №12: запобіжник від неправильних документів діє і тут. Сценарій панелі «Это не документ моряка»
  // = прикріпили не той документ: перший раз — попередження, другий поспіль — e08. Лічильник спільний з q04/e02.
  const [wrong, setWrong] = useState(false)
  const [pick, setPick] = useState(false)
  const a = st.answers[q.id]
  const err = showError ? st.issue(q) : null
  const choice = needsChoice(q, a)
  const proved = proofOk(q, a, st.proof)

  const head = (
    <div className="flex flex-col gap-1">
      <Label htmlFor={`fi-${q.id}`} className="text-[15px] font-medium">
        {q.label}
        {q.required && <span className="font-normal text-muted-foreground"> *</span>}
      </Label>
      {q.proof && (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <FileCheck2 className="size-4 shrink-0 text-primary" />
          Нужно подтверждение документом
        </span>
      )}
    </div>
  )

  if (q.kind === 'table') return <ContractsTable q={q} st={st} showError={showError} readOnly={readOnly} head={head} />
  if (q.kind === 'consent' || q.kind === 'signature') return <SignField q={q} st={st} err={err} readOnly={readOnly} head={head} />

  return (
    <div id={`fq-${q.id}`} className="flex flex-col gap-2">
      {head}
      {q.kind === 'photo' ? (
        <PhotoValue a={a} readOnly={readOnly} onAdd={() => st.setAnswer(q.id, { v: 'photo_3x4.jpg', src: 'manual' })} />
      ) : choice && !readOnly ? (
        <button
          type="button"
          onClick={() => setPick(true)}
          className={cn('flex min-h-12 items-center gap-3 rounded-md border border-dashed bg-surface px-4 text-left text-[15px]', err ? 'border-signal' : 'border-warning')}
        >
          <CircleAlert className="size-4 shrink-0 text-warning" />
          <span className="flex-1">Выберите значение</span>
          <span className="text-sm text-muted-foreground">
            <span className="font-mono">{uniqValues(q).length}</span> варианта
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      ) : q.kind === 'textarea' ? (
        <TextArea id={`fi-${q.id}`} value={a?.v ?? ''} placeholder={q.placeholder} readOnly={readOnly} onChange={(e) => st.type(q, e.target.value)} />
      ) : q.kind === 'phone' ? (
        <PhoneField id={`fi-${q.id}`} value={a?.v ?? ''} invalid={!!err} disabled={readOnly} onChange={(v) => st.type(q, v)} />
      ) : q.kind === 'country' ? (
        <CountryPick id={`fi-${q.id}`} title={q.label} value={a?.v ?? ''} invalid={!!err} disabled={readOnly} onChange={(v) => st.type(q, v)} />
      ) : q.kind === 'date' ? (
        <DatePick
          id={`fi-${q.id}`}
          title={q.label}
          value={a?.v ?? ''}
          invalid={!!err}
          disabled={readOnly}
          initial={q.bound === 'birth' ? new Date(1998, 5, 15) : undefined}
          onChange={(v) => st.type(q, v)}
          {...BOUNDS[q.bound ?? 'issue']}
        />
      ) : (
        <TextInput
          id={`fi-${q.id}`}
          mono={q.mono}
          value={a?.v ?? ''}
          placeholder={q.placeholder}
          readOnly={readOnly}
          invalid={!!err}
          inputMode={q.numeric ? 'numeric' : undefined}
          className={cn(q.mono && 'placeholder:font-sans', readOnly && 'bg-muted')}
          onChange={(e) => st.type(q, e.target.value)}
        />
      )}

      <SourceLine q={q} a={a} proved={proved && !st.proof[q.id]} readOnly={readOnly} onPick={() => setPick(true)} />

      {/* збережена відповідь з іншим написом або розділом — лише пропозиція */}
      {q.suggestion && !a?.v && !readOnly && (
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

      {q.proof && a?.v && !proved && !readOnly && (
        <ProofBox
          q={q}
          st={st}
          invalid={!!err}
          wrong={wrong}
          onAttach={(kind) => {
            if (state.scenario === 'notSeafarer') {
              if (bag<number>('q.wrongDocs', 0) >= 1) return go('e08')
              setBag('q.wrongDocs', 1)
              setWrong(true)
              return
            }
            setBag('q.wrongDocs', null)
            setWrong(false)
            st.setProof(q.id, kind === 'photo' ? { name: 'medical_photo.jpg', size: '1,2 МБ' } : { name: 'Medical_certificate.pdf', size: '480 КБ' })
            showToast('Подтверждение прикреплено')
          }}
        />
      )}
      {q.proof && st.proof[q.id] && <Attached p={st.proof[q.id]} readOnly={readOnly} onRemove={() => st.setProof(q.id, null)} />}

      {err && <p className="text-sm text-signal">{err}</p>}

      <SourceSheet
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
}

/* ---------- підтвердження документом ---------- */

// «Медицинский сертификат, действует до» → «медицинский сертификат»; абревіатури лишаються.
const docName = (label: string) => {
  const t = label.split(',')[0]
  return t[0].toLowerCase() + t.slice(1)
}

function ProofBox({ q, st, invalid, wrong, onAttach }: { q: Question; st: FormState; invalid: boolean; wrong: boolean; onAttach: (k: 'photo' | 'file') => void }) {
  const a = st.answers[q.id]
  const fromProfile = a && typeof a.src === 'number' && q.sources[a.src]?.unproved
  return (
    <div className={cn('flex flex-col gap-3 rounded-md border border-dashed px-4 py-3', invalid ? 'border-signal' : 'border-warning')}>
      <p className="flex items-start gap-2 text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <span>
          {fromProfile ? 'В профиле это введено без документа.' : 'Значение введено вручную.'} Прикрепите фото или файл, который это подтверждает.
        </span>
      </p>
      {wrong && (
        <div role="alert" className="flex flex-col gap-1 rounded-md bg-warning/10 px-3 py-2.5 text-sm">
          <span className="font-medium">Это не {docName(q.label)}. Прикрепите документ, который подтверждает это поле.</span>
          <span>Ещё одна ошибка — и аккаунт будет заблокирован</span>
        </div>
      )}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 text-primary" onClick={() => onAttach('photo')}>
          <Camera /> Фото
        </Button>
        <Button size="sm" variant="outline" className="flex-1 text-primary" onClick={() => onAttach('file')}>
          <FolderOpen /> Файл
        </Button>
      </div>
    </div>
  )
}

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

function SignField({ q, st, err, readOnly, head }: { q: Question; st: FormState; err: string | null; readOnly?: boolean; head: React.ReactNode }) {
  const a = st.answers[q.id]
  if (q.kind === 'consent')
    return (
      <div id={`fq-${q.id}`} className="flex flex-col gap-3">
        {head}
        <p className="rounded-md bg-card px-4 py-3 text-sm text-muted-foreground">
          {FORM_ORG} обрабатывает ваши данные, чтобы подобрать вас на судно, и передаёт их судовладельцу этой вакансии.
        </p>
        <CheckRow id={`fi-${q.id}`} checked={!!a} onChange={(v) => !readOnly && st.setAnswer(q.id, v ? { v: 'Согласен', src: 'manual' } : null)}>
          Я согласен / согласна
        </CheckRow>
        {err && <p className="text-sm text-signal">{err}</p>}
      </div>
    )
  const ok = !!st.answers[q.id + '.ok']
  return (
    <div id={`fq-${q.id}`} className="flex flex-col gap-3">
      {head}
      <p className="text-sm text-muted-foreground">Введите полное имя и подтвердите — это будет вашей подписью.</p>
      <TextInput id={`fi-${q.id}`} value={a?.v ?? ''} placeholder="Полное имя" readOnly={readOnly} invalid={!!err && !a?.v} onChange={(e) => st.setAnswer(q.id, e.target.value ? { v: e.target.value, src: 'manual' } : null)} />
      <CheckRow id={`fi-${q.id}-ok`} checked={ok} onChange={(v) => !readOnly && st.setAnswer(q.id + '.ok', v ? { v: 'yes', src: 'manual' } : null)}>
        Подтверждаю, что это моя подпись
      </CheckRow>
      {err && <p className="text-sm text-signal">{err}</p>}
    </div>
  )
}

/* ---------- таблиця бланка: рядки зі списку контрактів профілю ---------- */

function ContractsTable({ q, st, showError, readOnly, head }: { q: Question; st: FormState; showError: boolean; readOnly?: boolean; head: React.ReactNode }) {
  const [edit, setEdit] = useState<{ i: number; row: ContractRow } | null>(null)
  const list = st.rows?.list ?? []
  const err = showError ? st.issue(q) : null
  const blank: ContractRow = { id: '', vessel: '', type: '', rank: '', period: '', engine: '' }

  return (
    <div id={`fq-${q.id}`} className="flex flex-col gap-2">
      {head}
      <ul className={cn('overflow-hidden rounded-xl border bg-surface', err ? 'border-signal' : 'border-border')}>
        {list.map((r, i) => {
          const miss = rowMissing(r)
          return (
            <li key={r.id} className="border-t border-border first:border-t-0">
              <button type="button" disabled={readOnly} onClick={() => setEdit({ i, row: r })} className="flex w-full flex-col gap-1 px-4 py-3 text-left disabled:opacity-100">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-medium">{r.vessel || 'Без названия'}</span>
                  <span className="font-mono text-sm text-muted-foreground">{r.period}</span>
                </span>
                <span className="text-sm text-muted-foreground">{[r.type, r.rank, r.engine].filter(Boolean).join(', ')}</span>
                {miss.length > 0 && (
                  <span className="mt-1 flex items-start gap-2 text-sm">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <span className="flex-1">
                      Неполная запись, останется в черновике. Нет: {miss.map((m) => m.toLowerCase()).join(', ')}
                    </span>
                    {!readOnly && <span className="font-medium text-primary">Дополнить</span>}
                  </span>
                )}
              </button>
            </li>
          )
        })}
        {!list.length && <li className="px-4 py-3 text-sm text-muted-foreground">Записей пока нет. Нажмите «Заполнить из профиля» или добавьте вручную.</li>}
        {!readOnly && (
          <li className="border-t border-border">
            <button type="button" onClick={() => setEdit({ i: -1, row: { ...blank, id: 'n' + Date.now() } })} className="flex w-full items-center gap-2 px-4 py-3 text-[15px] font-medium text-primary">
              <Plus className="size-4" /> Добавить запись
            </button>
          </li>
        )}
      </ul>
      {list.length > 0 && (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {st.rows?.edited ? <PenLine className="size-4 text-warning" /> : <Check className="size-4 text-success" strokeWidth={2.25} />}
          {st.rows?.edited ? 'Изменено вами' : `Из профиля: ${list.length} ${plural(list.length, 'запись', 'записи', 'записей')}`}
        </span>
      )}
      {err && <p className="text-sm text-signal">{err}</p>}

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
          {miss.length > 0 && cur && <p className="text-center text-sm text-muted-foreground">Неполную запись сохраним в черновике</p>}
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

function SourceSheet({ q, a, onClose, onPick }: { q: Question | null; a?: Answer; onClose: () => void; onPick: (i: number | 'manual') => void }) {
  // однакові значення з різних джерел — один рядок (вищий пріоритет)
  const opts = q ? q.sources.map((s, i) => ({ s, i })).filter((o, k, arr) => arr.findIndex((x) => x.s.value === o.s.value) === k) : []
  return (
    <BottomSheet open={!!q} onClose={onClose} title={q?.label ?? ''} description={q?.ask ?? 'Откуда взять значение:'}>
      {q && (
        <div role="radiogroup" aria-label={q.label} className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
          {opts.map(({ s, i }) => {
            const on = a?.src === i
            return (
              <button key={i} type="button" role="radio" aria-checked={on} onClick={() => onPick(i)} className="flex items-center gap-3 border-t border-border px-4 py-3.5 text-left first:border-t-0">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn('text-base font-medium', q.mono && 'font-mono')}>{s.value}</span>
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                </span>
                <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border-2', on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground')}>
                  {on && <Check className="size-3" strokeWidth={3} />}
                </span>
              </button>
            )
          })}
          <button
            type="button"
            role="radio"
            aria-checked={a?.src === 'manual'}
            onClick={() => onPick('manual')}
            className="flex items-center gap-3 border-t border-border px-4 py-3.5 text-left text-base font-medium text-primary"
          >
            <PenLine className="size-4" /> Ввести вручную
          </button>
        </div>
      )}
    </BottomSheet>
  )
}
