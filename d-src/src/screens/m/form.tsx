import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, ChevronRight, FileCheck2, Info, Sparkles } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { Footer, NavBar } from '@/components/app/chrome'
import { ErrorState, LoadingState, useView } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { JOBS } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { Note } from '../q/_parts'
import { plural } from '../s/_stepper'
import { FORM_DUE, FORM_ORG, FORM_TITLE, PROFILE_CONTRACTS, useFormDef, type Section } from '../form/data'
import { QuestionField } from '../form/fields'
import { FormPaper, SaveToProfile } from '../form/review'
import { flash, useFormState, type Answer, type FormState } from '../form/state'
import { FormStepShell, type FStep } from '../form/stepper'

// m-form — анкета від рекрутера (seafarer-registration-v2: «степер спільний для реєстрації й форми
// рекрутера»; ADR-004, ADR-051, ADR-073 п. 6, 7, 16, 16.1; ADR-077 п. 4–6; registration-spec §9;
// відповідь 117). Покроково: кроки = розділи бланка BlueWave з їхніми назвами й написами; «Заполнить
// из профиля» на старті й на кожному кроці; «Проверка» в кінці; «Отправить» → підтвердження → чат.
// Після відправки — лише перегляд. Адреса для скріншотів: ?s=<0…5> — розділ, ?fill=1 — заповнити.

type Preset = 'review' | 'sent'

export function MForm({ go }: ScreenProps) {
  return <FormFlow go={go} />
}
/** Панель: анкета вже заповнена, відкрита «Проверка». */
export function MFormReview({ go }: ScreenProps) {
  return <FormFlow go={go} preset="review" />
}
/** Панель: анкету надіслано — лише перегляд. */
export function MFormSent({ go }: ScreenProps) {
  return <FormFlow go={go} preset="sent" />
}

function FormFlow({ go, preset }: { go: (id: string) => void; preset?: Preset }) {
  const { setBag, showToast } = useProto()
  const view = useView()
  const sections = useFormDef(view === 'empty')
  const st = useFormState(sections)
  const [params] = useState(() => new URLSearchParams(location.hash.split('?')[1] ?? ''))
  const once = useRef(false)

  useEffect(() => {
    if (once.current) return
    once.current = true
    // після першого монтування (у dev StrictMode прибирає таймер тосту, поставлений під час монтування)
    window.setTimeout(() => {
      if (preset) return applyPreset(preset, st, setBag)
      const s = params.get('s')
      if (params.get('fill') === '1') st.autofill()
      if (s !== null) st.setStep(Math.min(Number(s), sections.length))
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toChat = () => {
    setBag('chat.sel', 'bw')
    go('m-chat')
  }

  if (view === 'loading' || view === 'error')
    return (
      <div className="flex h-full flex-col">
        <NavBar title="Анкета" onBack={toChat} />
        <div className="min-h-0 flex-1 overflow-y-auto pt-2">
          {view === 'loading' ? <LoadingState kind="cards" rows={3} /> : <ErrorState title="Не удалось загрузить анкету" />}
        </div>
      </div>
    )

  if (st.sent) return <SentView sections={sections} st={st} onChat={toChat} />
  if (st.step === null) return <StartView sections={sections} st={st} go={go} onChat={toChat} />
  if (st.step >= sections.length) return <ReviewStep sections={sections} st={st} go={go} onChat={toChat} />
  return <SectionStep key={st.step} i={st.step} sections={sections} st={st} go={go} onChat={toChat} toast={showToast} />
}

/* ---------- кроки степера ---------- */

function useSteps(sections: Section[], st: FormState): FStep[] {
  return sections.map((s) => ({ key: s.id, t: s.title, state: st.done[s.id] ?? 'todo', issues: st.sectionIssues(s).length }))
}

function shellProps(st: FormState, steps: FStep[], onChat: () => void, toast: (t: string) => void) {
  return {
    nav: 'Анкета',
    steps,
    pct: st.pct,
    onJump: (i: number) => st.setStep(i),
    onLater: () => {
      toast('Черновик анкеты сохранён')
      onChat()
    },
  }
}

// «Заполнить из профиля» на кожному кроці — та сама картка, що «Заполнить из документа» у s2.
function AutofillCard({ st, empty }: { st: FormState; empty: boolean }) {
  return (
    <button type="button" onClick={() => st.autofill()} className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-4 text-left">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
        <Sparkles className="size-5" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-medium">Заполнить из профиля</span>
        <span className="text-sm text-muted-foreground">
          {empty ? 'В профиле пока нет данных для этой анкеты' : st.filled ? 'Подтянем новое из профиля. Ваши правки не тронем' : 'Профиль, документы и прежние анкеты. Всё можно поменять'}
        </span>
      </span>
    </button>
  )
}

function SectionStep({ i, sections, st, go, onChat, toast }: { i: number; sections: Section[]; st: FormState; go: (id: string) => void; onChat: () => void; toast: (t: string) => void }) {
  const s = sections[i]
  const steps = useSteps(sections, st)
  const view = useView()
  // помилки показуємо після «Продолжить» або якщо розділ уже пройдено / пропущено
  const [showErr, setShowErr] = useState(!!st.done[s.id])

  const next = () => {
    const bad = st.sectionIssues(s)
    if (bad.length) {
      setShowErr(true)
      toast(`Проверьте ${bad.length} ${plural(bad.length, 'поле', 'поля', 'полей')}: ${bad.map((q) => q.label).join(', ')}`)
      flash(`fq-${bad[0].id}`)
      return
    }
    st.mark(s.id, 'done')
    st.setStep(i + 1)
  }

  return (
    <FormStepShell
      {...shellProps(st, steps, onChat, toast)}
      cur={i}
      title={s.title}
      sub={s.sub}
      onBack={() => st.setStep(i > 0 ? i - 1 : null)}
      footer={
        <Footer className="border-t border-border bg-surface">
          <Button size="lg" onClick={next}>
            Продолжить
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-primary"
            onClick={() => {
              if (st.done[s.id] !== 'done') st.mark(s.id, 'skip')
              toast('Пропущено — вернуться можно в любой момент')
              st.setStep(i + 1)
            }}
          >
            Пропустить
          </Button>
        </Footer>
      }
    >
      <AutofillCard st={st} empty={view === 'empty'} />
      {s.questions.map((q) => (
        <QuestionField key={q.id} q={q} st={st} showError={showErr} go={go} />
      ))}
    </FormStepShell>
  )
}

/* ---------- «Проверка» ---------- */

function ReviewStep({ sections, st, go, onChat }: { sections: Section[]; st: FormState; go: (id: string) => void; onChat: () => void }) {
  const { showToast, setBag } = useProto()
  const steps = useSteps(sections, st)
  const [confirm, setConfirm] = useState(false)
  const issues = sections.flatMap((s, i) => st.sectionIssues(s, true).map((q) => ({ q, s, i })))
  const saving = st.saveCandidates.filter((q) => st.save.includes(q.id))

  const open = (i: number, qid?: string) => {
    st.setStep(i)
    if (qid) flash(`fq-${qid}`)
  }

  const send = () => {
    st.send()
    setConfirm(false)
    setBag('chat.sel', 'bw')
    showToast('Анкета отправлена')
    go('m-chat')
  }

  return (
    <FormStepShell
      {...shellProps(st, steps, onChat, showToast)}
      cur={sections.length}
      title="Проверка"
      sub="Так анкету увидит агентство. Нажмите раздел, чтобы исправить."
      onBack={() => st.setStep(sections.length - 1)}
      footer={
        <Footer className="border-t border-border bg-surface">
          <Button size="lg" disabled={issues.length > 0} onClick={() => setConfirm(true)}>
            Отправить
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {issues.length ? (
              <>
                Осталось исправить: <span className="font-mono">{issues.length}</span>
              </>
            ) : (
              'До отправки ответы — черновик'
            )}
          </p>
        </Footer>
      }
    >
      {issues.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-medium text-muted-foreground">Чтобы отправить, исправьте</h2>
          <ul className="overflow-hidden rounded-xl border border-border bg-surface">
            {issues.map(({ q, s, i }) => (
              <li key={q.id} className="border-t border-border first:border-t-0">
                <button type="button" onClick={() => open(i, q.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <AlertTriangle className="size-4 shrink-0 text-warning" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[15px]">{q.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {s.title}: {st.issue(q, true)?.toLowerCase()}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <FormPaper sections={sections} st={st} onOpen={(i) => open(i)} />
      <SaveToProfile st={st} />

      <BottomSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Отправить анкету?"
        description={`${FORM_ORG} увидит именно эти ответы. После отправки изменить их нельзя.`}
        footer={
          <>
            <Button size="lg" onClick={send}>
              Отправить
            </Button>
            <Button size="lg" variant="ghost" className="text-primary" onClick={() => setConfirm(false)}>
              Вернуться к проверке
            </Button>
          </>
        }
      >
        <p className="flex items-start gap-3 rounded-md bg-card px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          {saving.length ? (
            <span>
              В профиль сохраним: <span className="text-foreground">{saving.map((q) => q.label).join(', ')}</span>. Остальное уйдёт только в эту анкету.
            </span>
          ) : (
            <span>Профиль не изменится: вы не отметили ответы для сохранения.</span>
          )}
        </p>
      </BottomSheet>
    </FormStepShell>
  )
}

/* ---------- початок ---------- */

function StartView({ sections, st, go, onChat }: { sections: Section[]; st: FormState; go: (id: string) => void; onChat: () => void }) {
  const view = useView()
  const empty = view === 'empty'
  const job = JOBS[0]
  const proofs = sections.flatMap((s) => s.questions).filter((q) => q.proof).length
  const draft = st.filled || Object.keys(st.answers).length > 0
  const firstOpen = Math.max(
    0,
    sections.findIndex((s) => st.done[s.id] !== 'done'),
  )

  return (
    <div className="flex h-full flex-col">
      <NavBar title="Анкета" onBack={onChat} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-6 pt-1">
          <h1 className="text-[30px] leading-[1.1] font-semibold tracking-tight">Анкета агентства</h1>
          <p className="mt-2 text-base text-muted-foreground">
            {FORM_ORG}, вакансия {job.t} на {job.ship}. Заполнить до <span className="font-mono">{FORM_DUE}</span>.
          </p>
        </div>
        <div className="flex flex-col gap-4 px-6 pt-5 pb-6">
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">{FORM_TITLE}</div>
            <ol className="flex flex-col px-5 py-2">
              {sections.map((s, i) => (
                <li key={s.id} className="flex items-baseline gap-3 border-t border-border py-2.5 first:border-t-0">
                  <span className="w-4 font-mono text-sm text-muted-foreground">{i + 1}</span>
                  <span className="flex-1 text-[15px]">{s.title}</span>
                  {st.done[s.id] === 'done' ? (
                    <Check className="size-4 text-success" strokeWidth={2.25} />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      <span className="font-mono">{s.questions.length}</span> {plural(s.questions.length, 'поле', 'поля', 'полей')}
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <p className="flex items-center gap-2 border-t border-border px-5 py-3 text-sm text-muted-foreground">
              <FileCheck2 className="size-4 shrink-0 text-primary" />
              <span>
                <span className="font-mono">{proofs}</span> {plural(proofs, 'поле', 'поля', 'полей')} — с подтверждением документом
              </span>
            </p>
          </div>
          {empty ? (
            <Note icon={AlertTriangle} tone="warning">
              В профиле пока нет данных для этой анкеты. Заполните вручную или сначала дополните профиль — тогда анкета заполнится сама.
            </Note>
          ) : (
            <Note icon={Info}>Каждый раздел вы проверите перед отправкой. Пока не отправите, агентство ответов не видит.</Note>
          )}
        </div>
      </div>
      <Footer className="border-t border-border bg-surface">
        {empty ? (
          <>
            <Button size="lg" onClick={() => st.setStep(0)}>
              Заполнить вручную
            </Button>
            <Button size="lg" variant="ghost" className="text-primary" onClick={() => go('p14')}>
              Дополнить профиль
            </Button>
          </>
        ) : draft ? (
          <>
            <Button size="lg" onClick={() => st.setStep(firstOpen)}>
              Продолжить заполнение
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-primary"
              onClick={() => {
                st.autofill()
                st.setStep(firstOpen)
              }}
            >
              <Sparkles /> Заполнить из профиля
            </Button>
          </>
        ) : (
          <>
            <Button
              size="lg"
              onClick={() => {
                st.autofill()
                st.setStep(0)
              }}
            >
              <Sparkles /> Заполнить из профиля
            </Button>
            <Button size="lg" variant="ghost" className="text-primary" onClick={() => st.setStep(0)}>
              Заполнить вручную
            </Button>
          </>
        )}
      </Footer>
    </div>
  )
}

/* ---------- надіслано: лише перегляд ---------- */

function SentView({ sections, st, onChat }: { sections: Section[]; st: FormState; onChat: () => void }) {
  const saved = st.saveCandidates.filter((q) => st.save.includes(q.id))
  return (
    <div className="flex h-full flex-col">
      <NavBar title="Анкета" onBack={onChat} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-6 pt-1">
          <h1 className="text-[30px] leading-[1.1] font-semibold tracking-tight">Анкета отправлена</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Сегодня в <span className="font-mono">{st.sentAt || '12:05'}</span>. {FORM_ORG} видит эти ответы, изменить их уже нельзя.
          </p>
        </div>
        <div className="flex flex-col gap-4 px-6 pt-5 pb-6">
          {saved.length > 0 && <Note icon={Check}>В профиль сохранено: {saved.map((q) => q.label).join(', ')}.</Note>}
          <FormPaper sections={sections} st={st} />
        </div>
      </div>
      <Footer className="border-t border-border bg-surface">
        <Button size="lg" variant="outline" className="text-primary" onClick={onChat}>
          Вернуться в чат
        </Button>
      </Footer>
    </div>
  )
}

/* ---------- готові стани для панелі ---------- */

// Уся анкета заповнена: усе з профілю й документів, телефон змінено вручну, двигун у неповному
// рядку дописано, медичний сертифікат — з прикріпленим підтвердженням, «Размер обуви» — через «Использовать».
function applyPreset(kind: Preset, st: FormState, setBag: (k: string, v: unknown) => void) {
  const answers: Record<string, Answer> = {}
  for (const q of st.all) if (q.sources.length && q.kind !== 'table') answers[q.id] = { v: q.sources[0].value, src: 0 }
  const shoes = st.all.find((q) => q.id === 'shoes')?.suggestion
  if (shoes) answers.shoes = { v: shoes.value, src: 'sugg' }
  answers.phone = { v: '+380 00 000 0002', src: 'manual', base: 0 }
  answers.engines = { v: 'MAN B&W, Wärtsilä', src: 'manual' }
  answers.gdpr = { v: 'Согласен', src: 'manual' }
  answers.signature = { v: 'Andrii Koval', src: 'manual' }
  answers['signature.ok'] = { v: 'yes', src: 'manual' }
  setBag('form.answers', answers)
  setBag('form.rows', { list: PROFILE_CONTRACTS.map((r) => (r.engine ? r : { ...r, engine: 'Wärtsilä 6RT-flex50' })), edited: true })
  setBag('form.proof', { medical: { name: 'Medical_certificate.pdf', size: '480 КБ' } })
  setBag('form.done', Object.fromEntries(['personal', 'contacts', 'docs', 'service', 'sign'].map((id) => [id, 'done'])))
  setBag('form.filled', true)
  setBag('form.step', 5)
  setBag('form.save', kind === 'sent' ? ['phone'] : [])
  setBag('form.sent', kind === 'sent')
  if (kind === 'sent') setBag('form.sentAt', '12:05')
}
