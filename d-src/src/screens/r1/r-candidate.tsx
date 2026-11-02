import { useState, type ReactNode } from 'react'
import { ChevronRight, FileText, UserRoundX } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebField, WebInput, WebSelect, WebTextarea } from '@/components/web/fields'
import { PageHeader, WebCard } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { AvailabilityDot, StatusDot, WebAvatar } from '@/components/web/status-badge'
import { ruDate } from '@/lib/data'
import { ASSIGNMENT_STATUS_LABEL, ASSIGNMENTS, FORMS, jobById, seafarerById, type Assignment } from '@/lib/data-web'
import { assignmentsOf, CANDIDATES, chatOf, monthsText, msgPreview, TODAY } from '@/lib/data-recruiter-1'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { useR2 } from '../r2/_parts'
import { IncompleteMark, useSelected, WebDialog } from './_parts'

// r-candidate — картка кандидата (/candidates/[id] у коді): анкети й «Отправить анкету», переписка,
// коротко про моряка (лише поля з правки №30) і перехід на повний профіль.

const TONE = { submitted: 'success', in_progress: 'warning', sent: 'primary' } as const

export function RCandidate({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useProto()
  const { chats } = useR2()
  const [id] = useSelected('r1.candidate', 'sf01')
  const [, selectSeafarer] = useSelected('r1.seafarer', 'sf01')
  const c = CANDIDATES.find((x) => x.seafarerId === id) ?? CANDIDATES[0]
  const s = seafarerById(c.seafarerId)!
  const job = jobById(c.jobId ?? '')
  const conv = chatOf(chats, c)
  const key = `r1.sent.${s.id}`
  const sent = bag<Assignment[]>(key, [])
  const forms = [...sent, ...assignmentsOf(s.id)]
  const [sendOpen, setSendOpen] = useState(false)

  // Переписка й анкети живуть у другій частині вебу (r-chat, r-assignment): відкриваємо саме цього моряка.
  const openChat = () => {
    if (!conv) return showToast('Переписка появится, когда моряк ответит на приглашение')
    setBag('r2.chat', conv.id)
    setBag('r2.read', [...bag<string[]>('r2.read', []).filter((x) => x !== conv.id), conv.id])
    go('r-chat')
  }
  const openForm = (a: Assignment) => {
    if (!ASSIGNMENTS.some((x) => x.id === a.id)) return showToast('Моряк ещё не открыл анкету — ответы появятся после отправки')
    setBag('r2.as', a.id)
    go('r-assignment')
  }

  return (
    <WebShell variant="recruiter" active="r-candidates" go={go}>
      <ViewState
        loading={{ kind: 'cards' }}
        empty={{ icon: UserRoundX, title: 'Кандидат недоступен', text: 'Моряк отозвал доступ или удалил аккаунт.', action: <Button variant="outline" className="text-primary" onClick={() => go('r-candidates')}>Все кандидаты</Button> }}
      >
        <PageHeader
          back={{ label: 'Кандидаты', onClick: () => go('r-candidates') }}
          title={
            <span className="flex items-center gap-4">
              <WebAvatar initials={s.initials} size="lg" className="border border-border bg-surface" />
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-3">
                  {s.name}
                  <IncompleteMark id={s.id} />
                </span>
                <span className="text-[15px] font-normal tracking-normal text-muted-foreground">{s.position}</span>
              </span>
            </span>
          }
          actions={
            <>
              <Button variant="outline" className="h-10 text-primary" onClick={openChat}>
                {conv ? 'Открыть переписку' : 'Написать'}
              </Button>
              <Button className="h-10 px-5" onClick={() => setSendOpen(true)}>
                Отправить анкету
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-[1fr_380px] items-start gap-6">
          <div className="flex min-w-0 flex-col gap-6">
            <WebCard title="Анкеты" aside={forms.length > 0 && <span className="font-mono text-sm text-muted-foreground">{forms.length}</span>} className="[&>div:last-child]:p-0">
              {forms.length === 0 ? (
                <div className="flex flex-col items-start gap-3 px-6 py-5">
                  <p className="text-sm text-muted-foreground">Этому кандидату ещё не отправляли анкет.</p>
                  <Button variant="outline" className="text-primary" onClick={() => setSendOpen(true)}>
                    Отправить анкету
                  </Button>
                </div>
              ) : (
                <ul>
                  {forms.map((a) => {
                    const f = FORMS.find((x) => x.id === a.formId)!
                    return (
                      <li key={a.id} className="border-t border-border first:border-t-0">
                        <button type="button" onClick={() => openForm(a)} className="flex w-full items-center gap-4 px-6 py-3.5 text-left hover:bg-muted">
                          <FileText className="size-4.5 shrink-0 text-primary" />
                          <span className="flex min-w-0 flex-1 flex-col leading-tight">
                            <span className="truncate text-[15px]">{f.title}</span>
                            <span className="text-[13px] text-muted-foreground">
                              отправлена <span className="font-mono">{ruDate(a.date)}</span>
                            </span>
                          </span>
                          <StatusDot tone={TONE[a.status]}>{ASSIGNMENT_STATUS_LABEL[a.status]}</StatusDot>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </WebCard>

            <WebCard
              title="Переписка"
              aside={
                conv && (
                  <button type="button" onClick={openChat} className="text-sm font-medium text-primary hover:underline">
                    Открыть
                  </button>
                )
              }
            >
              {conv ? (
                <div className="flex flex-col gap-2.5">
                  {conv.messages.slice(-3).map((m, i) =>
                    m.from === 'system' ? (
                      <p key={i} className="self-center text-[13px] text-muted-foreground">
                        {m.text}
                      </p>
                    ) : (
                      <div key={i} className={cn('flex max-w-[78%] flex-col gap-1 rounded-xl px-3.5 py-2.5 text-sm', m.from === 'me' ? 'self-end bg-primary text-primary-foreground' : 'self-start bg-muted')}>
                        {msgPreview(m)}
                        <span className={cn('self-end font-mono text-[11px]', m.from === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{m.time}</span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Переписки пока нет. Напишите первым — моряк получит сообщение в приложении.</p>
              )}
            </WebCard>
          </div>

          <WebCard>
            <dl className="flex flex-col gap-4 text-sm">
              <Fact label="Вакансия">{job ? `${job.position}, ${job.vesselName}` : '—'}</Fact>
              <Fact label="Как связались">
                {c.via === 'invitation' ? 'Принял приглашение' : 'Откликнулся на вакансию'} <span className="font-mono text-muted-foreground">{ruDate(c.since)}</span>
              </Fact>
              <Fact label="Готовность">
                <AvailabilityDot a={s.availability} />
              </Fact>
              <Fact label="Опыт">{s.experienceMonths === null ? <span className="text-muted-foreground">только по контрактам</span> : <MonoNums text={monthsText(s.experienceMonths)} />}</Fact>
              <Fact label="Национальность">{s.nationality}</Fact>
              <Fact label="Ближайший аэропорт">{s.airport}</Fact>
            </dl>
            <Button
              variant="outline"
              className="mt-5 h-10 w-full text-primary"
              onClick={() => {
                selectSeafarer(s.id)
                go('r-seafarer')
              }}
            >
              Весь профиль
            </Button>
          </WebCard>
        </div>
      </ViewState>

      <SendFormDialog
        name={s.name}
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        onSend={(formId) => {
          setBag(key, [{ id: `new-${sent.length + 1}`, formId, seafarerId: s.id, status: 'sent', date: TODAY }, ...sent])
          setSendOpen(false)
        }}
      />
    </WebShell>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

// «Отправить анкету» (send-form-panel у коді): анкета, комментарий, срок.
function SendFormDialog({ name, open, onClose, onSend }: { name: string; open: boolean; onClose: () => void; onSend: (formId: string) => void }) {
  const { showToast } = useProto()
  const active = FORMS.filter((f) => f.status === 'active')
  const [formId, setFormId] = useState(active[0]?.id ?? '')
  const [note, setNote] = useState('')
  const [due, setDue] = useState('')
  return (
    <WebDialog
      open={open}
      onClose={onClose}
      title="Отправить анкету"
      description={name}
      footer={
        <>
          <Button variant="ghost" className="h-10" onClick={onClose}>
            Отмена
          </Button>
          <Button
            className="h-10 px-5"
            disabled={!formId}
            onClick={() => {
              onSend(formId)
              setNote('')
              setDue('')
              showToast('Анкета отправлена')
            }}
          >
            Отправить анкету
          </Button>
        </>
      }
    >
      <WebField id="sf-form" label="Анкета" required hint="Отправлять можно только опубликованные анкеты.">
        <WebSelect id="sf-form" value={formId} onChange={setFormId} placeholder="Выберите анкету" options={active.map((f) => ({ value: f.id, label: f.title }))} />
      </WebField>
      <WebField id="sf-note" label="Комментарий для моряка" hint="Необязательно">
        <WebTextarea id="sf-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Например, что заполнить в первую очередь" />
      </WebField>
      <WebField id="sf-due" label="Заполнить до" hint="Моряк увидит анкету в приложении, а в переписке появится её карточка.">
        <WebInput id="sf-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-48 font-mono" />
      </WebField>
    </WebDialog>
  )
}
