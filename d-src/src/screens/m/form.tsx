import { useState } from 'react'
import { Check, ChevronDown, CircleAlert, Zap } from 'lucide-react'
import { useAvailability } from '@/components/app/availability'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { Footer, NavBar } from '@/components/app/chrome'
import { ErrorState, LoadingState, useView } from '@/components/app/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JOBS } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { FORM_DEFAULTS, TextInput, useQ, type QForm } from '../q/_parts'
import type { Acct } from '../q/q06'

// m-form — анкета від рекрутера (gaps №2, відповідь 117, код assignment/[id] і FormEditor).
// «Заполнить из профиля» заповнює поля; під кожним полем — звідки значення, і його можна змінити:
// інше джерело (профіль, документ, прежня відповідь) або «Ввести вручную». Де джерел кілька — моряк вибирає сам.
// Анкета — як папір: смуга primary з назвою. Після відправки змінити не можна.

type Src = { from: string; value: string }
type FieldDef = { id: string; label: string; mono?: boolean; required?: boolean; placeholder?: string; sources: Src[]; ask?: string }
type Answer = { v: string; src: number | 'manual' }

function useFields(): { title: string; fields: FieldDef[] }[] {
  const { bag } = useQ()
  const f: QForm = bag<{ v: QForm } | null>('q.form', null)?.v ?? FORM_DEFAULTS
  const email = bag<Acct | null>('q.acct', null)?.email || 'you@example.com'
  const avail = useAvailability().label
  const profile = 'Из профиля'
  const sid = 'Из удостоверения моряка'
  const coc = 'Из диплома'
  return [
    {
      title: 'Личные данные',
      fields: [
        { id: 'last', label: 'Фамилия', required: true, sources: [{ from: sid, value: String(f.last) }] },
        { id: 'first', label: 'Имя', required: true, sources: [{ from: sid, value: String(f.first) }] },
        { id: 'birth', label: 'Дата рождения', mono: true, required: true, placeholder: 'ДД.ММ.ГГГГ', sources: [{ from: sid, value: String(f.birth) }] },
        { id: 'cit', label: 'Гражданство', sources: [{ from: profile, value: String(f.cit) }] },
      ],
    },
    {
      title: 'Контакты',
      fields: [
        { id: 'phone', label: 'Мобильный телефон', mono: true, required: true, sources: [{ from: profile, value: String(f.phone) }] },
        { id: 'email', label: 'Email', sources: [{ from: profile, value: email }] },
        {
          id: 'airport',
          label: 'Ближайший аэропорт',
          ask: 'Есть в профиле и в прежней анкете. Выберите, что отправить:',
          sources: [
            { from: profile, value: 'Одесса, ODS' },
            { from: 'Из вашей анкеты для Nordline', value: 'Киев, KBP' },
          ],
        },
      ],
    },
    {
      title: 'Документы',
      fields: [
        {
          id: 'sid',
          label: 'Номер паспорта моряка',
          mono: true,
          required: true,
          ask: 'Есть в 2 ваших документах. Выберите тот, о котором вопрос:',
          sources: [
            { from: sid, value: String(f.docNum) },
            { from: 'Из мореходной книжки', value: 'MK 004512' },
          ],
        },
        { id: 'sidExp', label: 'Паспорт моряка действует до', mono: true, sources: [{ from: sid, value: String(f.docExp) }] },
        { id: 'coc', label: 'Диплом (CoC)', sources: [{ from: coc, value: `${f.dipRank}, ${f.dipStcw}` }] },
        { id: 'cocExp', label: 'Диплом действует до', mono: true, sources: [{ from: coc, value: String(f.dipExp) }] },
      ],
    },
    {
      title: 'Опыт работы',
      fields: [
        { id: 'vessel', label: 'Последнее судно', sources: [{ from: profile, value: `${f.vessel1}, ${f.rank1}` }] },
        { id: 'chem', label: 'Опыт на Chemical Tanker, мес.', mono: true, sources: [{ from: profile, value: '14' }] },
        { id: 'ready', label: 'Когда готовы приступить', sources: [{ from: profile, value: avail }] },
      ],
    },
    {
      title: 'Вопросы агентства',
      fields: [{ id: 'salary', label: 'Ожидаемая зарплата, $ в месяц', mono: true, required: true, placeholder: 'Например, 4 400', sources: [] }],
    },
  ]
}

export function MForm({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useProto()
  const sections = useFields()
  const all = sections.flatMap((s) => s.fields)
  const answers = bag<Record<string, Answer>>('form.answers', {})
  const filled = bag<boolean>('form.filled', false)
  const sent = bag<boolean>('form.sent', false)
  const sentAt = bag<string>('form.sentAt', '')
  const [pick, setPick] = useState<FieldDef | null>(null)
  const [review, setReview] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const job = JOBS[0]
  // «Пусто» для анкети сенсу не має — показуємо звичайний стан
  const view = useView()

  const setAnswer = (id: string, a: Answer) => {
    setBag('form.answers', { ...answers, [id]: a })
    if (errors.includes(id)) setErrors(errors.filter((e) => e !== id))
  }

  const autofill = () => {
    const next: Record<string, Answer> = { ...answers }
    let n = 0
    for (const fd of all) {
      if (next[fd.id]?.src === 'manual' || fd.sources.length !== 1) continue
      next[fd.id] = { v: fd.sources[0].value, src: 0 }
      n++
    }
    setBag('form.answers', next)
    setBag('form.filled', true)
    showToast(`${n} полей заполнено из профиля`)
  }

  const choose = all.filter((fd) => fd.sources.length > 1 && !answers[fd.id])
  const missing = all.filter((fd) => fd.required && !answers[fd.id]?.v.trim())

  const trySend = () => {
    const bad = [...new Set([...choose, ...missing].map((fd) => fd.id))]
    if (bad.length) {
      setErrors(bad)
      showToast(
        `Проверьте ${bad.length} ${bad.length === 1 ? 'поле' : bad.length < 5 ? 'поля' : 'полей'}: ${all
          .filter((fd) => bad.includes(fd.id))
          .map((fd) => fd.label)
          .join(', ')}`,
      )
      return
    }
    setReview(true)
  }

  const doSend = () => {
    setBag('form.sent', true)
    setBag('form.sentAt', new Date().toTimeString().slice(0, 5))
    setReview(false)
    showToast('Анкета отправлена')
  }

  return (
    <div className="relative flex h-full flex-col">
      <NavBar
        title="Анкета"
        onBack={() => {
          setBag('chat.sel', 'bw')
          go('m-chat')
        }}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-6">
        {view === 'loading' ? (
          <LoadingState kind="cards" rows={3} />
        ) : view === 'error' ? (
          <ErrorState title="Не удалось загрузить анкету" />
        ) : (
          <>
            {/* від кого й до коли */}
            <div className="flex flex-col gap-1 px-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-semibold">BlueWave Crewing</span>
                {sent ? (
                  <Badge variant="success" className="font-normal">
                    отправлено
                  </Badge>
                ) : filled ? (
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    черновик
                  </Badge>
                ) : (
                  <Badge className="font-normal">новая</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Для вакансии {job.t}, {job.ship}. Заполнить до <span className="font-mono">08.11.2026</span>
              </p>
            </div>

            {sent ? (
              <p className="mt-4 flex items-start gap-2 rounded-md bg-card px-4 py-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.5} />
                <span>
                  <span className="font-medium text-foreground">
                    Отправлено сегодня в <span className="font-mono">{sentAt}</span>.
                  </span>{' '}
                  Отправленную анкету изменить нельзя.
                </span>
              </p>
            ) : filled ? (
              <p className="mt-4 flex items-start gap-2 rounded-md bg-card px-4 py-3 text-sm text-muted-foreground">
                {choose.length ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" /> : <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.5} />}
                <span>
                  <span className="font-medium text-foreground">Заполнено из профиля.</span> Под каждым полем видно, откуда значение.
                  {choose.length > 0 && <> Выберите значение в {choose.length === 1 ? 'одном поле' : `${choose.length} полях`}.</>}
                </span>
              </p>
            ) : null}

            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
              <div className="bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Анкета BlueWave Crewing</div>
              {sections.map((s) => (
                <section key={s.title} className="border-t border-border px-5 pt-4 pb-5 first-of-type:border-t-0">
                  <h2 className="text-base font-semibold">{s.title}</h2>
                  <div className="mt-3 flex flex-col gap-4">
                    {s.fields.map((fd) => (
                      <FormField
                        key={fd.id}
                        fd={fd}
                        a={answers[fd.id]}
                        readOnly={sent}
                        invalid={errors.includes(fd.id)}
                        onChange={(v) => setAnswer(fd.id, { v, src: 'manual' })}
                        onPick={() => setPick(fd)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer className="border-t border-border bg-background">
        {sent ? (
          <Button
            size="lg"
            variant="outline"
            className="text-primary"
            onClick={() => {
              setBag('chat.sel', 'bw')
              go('m-chat')
            }}
          >
            Вернуться в чат
          </Button>
        ) : filled ? (
          <>
            <Button size="lg" onClick={trySend}>
              Отправить анкету
            </Button>
            <p className="text-center text-sm text-muted-foreground">Ответы сохраняются как черновик</p>
          </>
        ) : (
          <>
            <Button size="lg" onClick={autofill}>
              <Zap /> Заполнить из профиля
            </Button>
            <p className="text-center text-sm text-muted-foreground">Вы проверите каждое поле перед отправкой</p>
          </>
        )}
      </Footer>

      <SourceSheet
        fd={pick}
        current={pick ? answers[pick.id] : undefined}
        onClose={() => setPick(null)}
        onPick={(i) => {
          if (!pick) return
          if (i === 'manual') setAnswer(pick.id, { v: '', src: 'manual' })
          else setAnswer(pick.id, { v: pick.sources[i].value, src: i })
          setPick(null)
        }}
      />

      <BottomSheet
        open={review}
        onClose={() => setReview(false)}
        title="Отправить анкету?"
        description="После отправки агентство увидит именно эти ответы. Изменить их будет нельзя."
        footer={
          <>
            <Button size="lg" onClick={doSend}>
              Отправить
            </Button>
            <Button size="lg" variant="ghost" className="text-primary" onClick={() => setReview(false)}>
              Вернуться к редактированию
            </Button>
          </>
        }
      >
        <dl className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface px-4">
          {all.map((fd) => (
            <div key={fd.id} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-sm text-muted-foreground">{fd.label}</dt>
              <dd className={cn('text-right text-[15px]', fd.mono && 'font-mono text-sm')}>{answers[fd.id]?.v || '—'}</dd>
            </div>
          ))}
        </dl>
      </BottomSheet>
    </div>
  )
}

function FormField({ fd, a, readOnly, invalid, onChange, onPick }: { fd: FieldDef; a?: Answer; readOnly: boolean; invalid: boolean; onChange: (v: string) => void; onPick: () => void }) {
  const needsChoice = fd.sources.length > 1 && !a
  const src = a ? (a.src === 'manual' ? null : fd.sources[a.src]) : null
  const edited = a?.src === 'manual' && fd.sources.length > 0
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`f-${fd.id}`} className="text-[15px] font-medium">
        {fd.label}
        {fd.required && <span className="text-muted-foreground"> *</span>}
      </label>
      {needsChoice && !readOnly ? (
        <button
          type="button"
          onClick={onPick}
          className={cn('flex min-h-12 items-center gap-3 rounded-md border border-dashed px-4 text-left text-[15px]', invalid ? 'border-signal' : 'border-warning')}
        >
          <CircleAlert className="size-4 shrink-0 text-warning" />
          <span className="flex-1">Выберите значение</span>
          <span className="font-mono text-sm text-muted-foreground">{fd.sources.length}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      ) : (
        <TextInput
          id={`f-${fd.id}`}
          mono={fd.mono}
          value={a?.v ?? ''}
          placeholder={fd.placeholder}
          readOnly={readOnly}
          invalid={invalid}
          inputMode={fd.id === 'salary' || fd.id === 'chem' ? 'numeric' : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={readOnly ? 'bg-muted' : undefined}
        />
      )}
      {a && (fd.sources.length > 0 || a.src === 'manual') && (
        <button
          type="button"
          disabled={readOnly || fd.sources.length === 0}
          onClick={onPick}
          className="flex items-center gap-1.5 self-start text-left text-sm text-muted-foreground disabled:pointer-events-none"
        >
          {src ? (
            <>
              <Check className="size-3.5 shrink-0 text-success" strokeWidth={2.5} />
              {src.from}
            </>
          ) : edited ? (
            <Badge variant="warning" className="font-normal">
              {fd.sources.length ? 'Изменено по сравнению с профилем' : 'Введено вами'}
            </Badge>
          ) : (
            'Введено вами'
          )}
          {!readOnly && fd.sources.length > 0 && <ChevronDown className="size-3.5 shrink-0" />}
        </button>
      )}
      {invalid && <p className="text-sm text-signal">{needsChoice ? 'Выберите значение' : 'Обязательное поле'}</p>}
    </div>
  )
}

// Вибір джерела значення: профіль, документ, прежня відповідь — або ввести самому.
function SourceSheet({ fd, current, onClose, onPick }: { fd: FieldDef | null; current?: Answer; onClose: () => void; onPick: (i: number | 'manual') => void }) {
  return (
    <BottomSheet open={!!fd} onClose={onClose} title={fd?.label ?? ''} description={fd?.ask ?? 'Откуда взять значение:'}>
      {fd && (
        <div role="radiogroup" aria-label={fd.label} className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
          {fd.sources.map((s, i) => {
            const on = current?.src === i
            return (
              <button key={i} type="button" role="radio" aria-checked={on} onClick={() => onPick(i)} className="flex items-center gap-3 border-t border-border px-4 py-3.5 text-left first:border-t-0">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn('text-base font-medium', fd.mono && 'font-mono')}>{s.value}</span>
                  <span className="text-sm text-muted-foreground">{s.from}</span>
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
            aria-checked={current?.src === 'manual'}
            onClick={() => onPick('manual')}
            className="flex items-center gap-3 border-t border-border px-4 py-3.5 text-left text-base font-medium text-primary"
          >
            Ввести вручную
          </button>
        </div>
      )}
    </BottomSheet>
  )
}
