import { useState, type ReactNode } from 'react'
import { Check, CircleCheck, EyeOff, UserRoundX } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebField, WebSelect, WebTextarea } from '@/components/web/fields'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { AvailabilityDot, WebAvatar } from '@/components/web/status-badge'
import { useAttachment } from '@/components/web/web-viewer'
import { WebDatePick } from '@/components/web/web-pickers'
import { ruDate } from '@/lib/data'
import { BOUNDS, isoToRu, ruToIso } from '@/lib/dates'
import { ASSIGNMENTS, FORMS, jobById, ME_RECRUITER, seafarerById, WEB_JOBS, type Assignment, type WebSeafarer } from '@/lib/data-web'
import { assignmentsOf, CANDIDATES, chatOf, contractsFor, TODAY } from '@/lib/data-recruiter-1'
import { ANSWERS, SOURCE_LABEL } from '@/lib/data-recruiter-2'
import { yearsMonthsText } from '@/lib/data-recruiter-sf'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { useR2 } from '../r2/_parts'
import { IncompleteMark, useInvites, useSelected, WebDialog } from './_parts'
import { CandidateChat, EmptyChat } from './sf-chat'
import { FilesPanel, type SfFile } from './sf-files'
import { FormsPanel } from './sf-forms'
import { Fold, isPhotoName, KV } from './sf-parts'

// Профиль моряка очима рекрутера — ОДИН экран под двумя адресами (перевірка 03.11, №19):
//   r-seafarer  — из поиска моряков;
//   r-candidate — из списка кандидатов (тот же компонент, меняются «назад», пункт меню и вкладка, с которой открывается).
// Если с моряком уже есть контакт (отклик или принятое приглашение), на странице появляются вкладки на месте:
// «Профиль», «Анкеты», «Переписка», «Файлы» (№9). Вкладки не ведут на другие страницы.
// Видно (правка №30): «Andrii K.», опыт в месяцах, сертификаты, национальность, ближайший аэропорт, визы, дипломы, медицина,
// «о себе», готовность, должность, характеристики/промоушены — галочка. Не видно: фамилия, контакты, фото, файлы документов.
// Файлы документов приходят только от самого моряка — в анкете или в переписке; они открываются в просмотре (№13).
// Правка №34: если моряк скрыл общий стаж, виден только стаж по каждому контракту.

type Tab = 'profile' | 'forms' | 'chat' | 'files'

export type SeafarerEntry = 'search' | 'candidates'

export function SeafarerPage({ go, entry }: ScreenProps & { entry: SeafarerEntry }) {
  const fromCandidates = entry === 'candidates'
  const [id] = useSelected(fromCandidates ? 'r1.candidate' : 'r1.seafarer', 'sf01')
  const s = seafarerById(id) ?? seafarerById('sf01')!
  const { bag, setBag, showToast } = useProto()
  const { chats } = useR2()
  const invites = useInvites()
  const cand = CANDIDATES.find((c) => c.seafarerId === s.id)
  const conv = cand ? chatOf(chats, cand) : undefined
  const sentKey = `r1.sent.${s.id}`
  const sent = bag<Assignment[]>(sentKey, [])
  const forms = cand ? [...sent, ...assignmentsOf(s.id)] : []
  const files = cand ? attachmentsOf(forms, conv?.messages ?? []) : []
  const [tab, setTab] = useState<Tab>(fromCandidates && cand && forms.length ? 'forms' : 'profile')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const att = useAttachment()
  const live = invites.list.find((i) => i.seafarerId === s.id && (i.status === 'pending' || i.status === 'accepted'))
  const liveJob = live?.jobId ? jobById(live.jobId) : undefined

  // Переписка и анкеты живут в «Сообщениях» и «Ответе моряка»: открываем именно этого моряка.
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

  const actions = cand ? (
    <>
      <Button variant="outline" className="h-10 text-primary" onClick={openChat}>
        {conv ? 'Открыть переписку' : 'Написать'}
      </Button>
      <Button className="h-10 px-5" onClick={() => setSendOpen(true)}>
        Отправить анкету
      </Button>
    </>
  ) : (
    <>
      {!live ? (
        <Button className="h-10 px-5" onClick={() => setInviteOpen(true)}>
          Позвать на работу
        </Button>
      ) : live.status === 'pending' ? (
        <>
          <span className="flex items-center gap-2 text-sm font-medium">
            <CircleCheck className="size-4.5 text-success" />
            Приглашение отправлено
          </span>
          <Button variant="outline" className="ml-3 h-10 text-primary" onClick={() => go('r-invitations')}>
            Все приглашения
          </Button>
        </>
      ) : (
        <span className="flex items-center gap-2 text-sm font-medium">
          <CircleCheck className="size-4.5 text-success" />
          Моряку интересно
        </span>
      )}
    </>
  )

  return (
    <WebShell variant="recruiter" active={fromCandidates ? 'r-candidates' : 'r-search'} go={go}>
      <ViewState
        loading={{ kind: 'cards' }}
        empty={{
          icon: UserRoundX,
          title: 'Профиль недоступен',
          text: 'Моряк скрыл профиль или удалил аккаунт.',
          action: (
            <Button variant="outline" className="text-primary" onClick={() => go(fromCandidates ? 'r-candidates' : 'r-search')}>
              {fromCandidates ? 'Все кандидаты' : 'К поиску'}
            </Button>
          ),
        }}
      >
        <PageHeader
          back={fromCandidates ? { label: 'Кандидаты', onClick: () => go('r-candidates') } : { label: 'Поиск моряков', onClick: () => go('r-search') }}
          title={
            <span className="flex items-center gap-4">
              <WebAvatar initials={s.initials} size="lg" className="border border-border bg-surface" />
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-3">
                  {s.name}
                  <IncompleteMark id={s.id} />
                </span>
                <span className="text-[15px] font-normal tracking-normal text-muted-foreground">
                  {s.position}, {s.fleet} / {s.department}
                </span>
              </span>
            </span>
          }
          actions={actions}
        />

        {live && !cand && (
          <p className="-mt-2 mb-6 text-sm text-muted-foreground">
            Приглашение от <span className="font-mono">{ruDate(live.date)}</span>
            {liveJob && <> на вакансию {liveJob.position}, {liveJob.vesselName}</>}.{' '}
            {live.status === 'pending' ? 'Моряк увидит его в уведомлениях и ответит одной кнопкой.' : 'Моряк подтвердил интерес, переписка открыта.'}
          </p>
        )}

        {cand && (
          <PageTabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'profile', label: 'Профиль' },
              { id: 'forms', label: 'Анкеты', count: forms.length },
              { id: 'chat', label: 'Переписка' },
              { id: 'files', label: 'Файлы от моряка', count: files.length },
            ]}
          />
        )}

        {tab === 'profile' && (
          <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-4">
            <div className="flex min-w-0 flex-col gap-3">
              <Documents s={s} />
              <Experience s={s} />
            </div>
            <div className="flex flex-col gap-3">
              <Fold title="Готовность" aside={<AvailabilityDot a={s.availability} short />}>
                <dl>
                  {cand && (
                    <KV label="Как связались">
                      {cand.via === 'invitation' ? 'Принял приглашение' : 'Откликнулся на вакансию'} <span className="font-mono text-muted-foreground">{ruDate(cand.since)}</span>
                      {jobById(cand.jobId ?? '') && <span className="block text-muted-foreground">{jobById(cand.jobId!)!.position}, {jobById(cand.jobId!)!.vesselName}</span>}
                    </KV>
                  )}
                  <KV label="Должность">{s.position}</KV>
                  <KV label="Флот, департамент">
                    {s.fleet} / {s.department}
                  </KV>
                  <KV label="Национальность">{s.nationality}</KV>
                  <KV label="Аэропорт">{s.airport}</KV>
                  <KV label="Характеристики">
                    {s.promotions ? (
                      <span className="flex items-center gap-1.5">
                        <Check className="size-4 text-success" /> Есть
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Не указаны</span>
                    )}
                  </KV>
                </dl>
              </Fold>
              <Fold title="О себе">
                <p className="text-sm leading-relaxed">{s.about}</p>
              </Fold>
              <p className="flex items-start gap-2.5 px-1 text-[13px] text-muted-foreground">
                <EyeOff className="mt-0.5 size-4 shrink-0" />
                Фамилию, контакты, фото и файлы документов агентства не видят. Копии документов моряк присылает сам.
              </p>
            </div>
          </div>
        )}

        {tab === 'forms' && <FormsPanel forms={forms} onOpen={openForm} onSend={() => setSendOpen(true)} onFile={(name, title) => att.open(name, isPhotoName(name) ? 'photo' : 'file', `${s.name}, ${title}`)} />}

        {tab === 'chat' &&
          (conv ? (
            <CandidateChat
              chat={conv}
              openAttachment={att.open}
              onOpenForm={(id) => {
                setBag('r2.as', id)
                go('r-assignment')
              }}
              onOpenChat={openChat}
              onFiles={() => setTab('files')}
            />
          ) : (
            <EmptyChat onWrite={openChat} />
          ))}

        {tab === 'files' && <FilesPanel files={files} open={att.open} />}
      </ViewState>

      {att.node}

      <InviteDialog
        s={s}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSend={(jobId, message) => {
          invites.add({ seafarerId: s.id, jobId, message, recruiterId: ME_RECRUITER.id, status: 'pending', date: TODAY })
          setInviteOpen(false)
        }}
      />
      <SendFormDialog
        name={s.name}
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        onSend={(formId) => {
          setBag(sentKey, [{ id: `new-${sent.length + 1}`, formId, seafarerId: s.id, status: 'sent', date: TODAY }, ...sent])
          setSendOpen(false)
          setTab('forms')
        }}
      />
    </WebShell>
  )
}

export function RSeafarer({ go }: ScreenProps) {
  return <SeafarerPage go={go} entry="search" />
}

// Файлы, которые моряк прислал: приложенные в ответах на анкеты и фото/файлы из переписки.
function attachmentsOf(forms: Assignment[], messages: { photo?: { name: string }; file?: { name: string; size: string }; from: string }[]): SfFile[] {
  const out: SfFile[] = []
  const add = (a: SfFile) => !out.some((x) => x.name === a.name) && out.push(a)
  for (const a of forms) {
    const title = FORMS.find((x) => x.id === a.formId)?.title ?? 'Анкета'
    for (const [k, v] of Object.entries(ANSWERS[a.id] ?? {})) {
      if (v.file) add({ key: `${a.id}.${k}`, name: v.file.name, size: v.file.size, kind: /\.(jpe?g|png|heic)$/i.test(v.file.name) ? 'photo' : 'file', from: `«${title}», ${SOURCE_LABEL[v.source].toLowerCase()}` })
      if (v.proof) add({ key: `${a.id}.${k}.proof`, name: v.proof.file.name, size: v.proof.file.size, kind: /\.(jpe?g|png|heic)$/i.test(v.proof.file.name) ? 'photo' : 'file', from: `«${title}», подтверждение` })
    }
  }
  for (const m of messages) {
    if (m.from !== 'them') continue
    if (m.photo) add({ key: `chat.${m.photo.name}`, name: m.photo.name, kind: 'photo', from: 'Из переписки' })
    if (m.file) add({ key: `chat.${m.file.name}`, name: m.file.name, size: m.file.size, kind: 'file', from: 'Из переписки' })
  }
  return out
}

// Документы — свёртываемый блок со строками по типам (№30: названия и сроки, без файлов).
function Documents({ s }: { s: WebSeafarer }) {
  const rows: { title: string; items: { text: string; aside?: ReactNode }[]; empty: string }[] = [
    { title: 'Дипломы', items: s.diplomas.map((d) => ({ text: d })), empty: 'Не указаны' },
    { title: 'Сертификаты', items: s.certificates.map((c) => ({ text: c })), empty: 'Не указаны' },
    { title: 'Медицина', items: s.medical ? [{ text: s.medical.title, aside: <>до <span className="font-mono">{ruDate(s.medical.until)}</span></> }] : [], empty: 'Не указана' },
    { title: 'Визы', items: s.visas.map((v) => ({ text: v })), empty: 'Нет виз' },
  ]
  const total = rows.reduce((n, r) => n + r.items.length, 0)
  return (
    <Fold title="Документы моряка" aside={<span className="font-mono">{total}</span>} flush>
      {rows.map((r) => (
        <Fold key={r.title} level={2} title={r.title} defaultOpen={false} aside={r.items.length ? <span className="font-mono">{r.items.length}</span> : <span>{r.empty}</span>}>
          {r.items.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {r.items.map((it) => (
                <li key={it.text} className="flex items-baseline justify-between gap-4 text-sm">
                  <span>{it.text}</span>
                  {it.aside && <span className="shrink-0 text-muted-foreground">{it.aside}</span>}
                </li>
              ))}
            </ul>
          )}
        </Fold>
      ))}
    </Fold>
  )
}

// Стаж — «N лет M мес.». Сховав загальний (№34) — лише рядки контрактів.
function Experience({ s }: { s: WebSeafarer }) {
  const rows = contractsFor(s.id)
  const hidden = s.experienceMonths === null
  return (
    <Fold
      title="Опыт работы"
      aside={
        hidden ? (
          'Общий стаж скрыт'
        ) : (
          <span>
            всего <span className="font-medium text-foreground"><MonoNums text={yearsMonthsText(s.experienceMonths!)} /></span>
          </span>
        )
      }
      flush
    >
      {hidden && <p className="px-5 pt-3 text-sm text-muted-foreground">Моряк скрыл общий стаж. Агентствам виден стаж по каждому контракту.</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[13px] text-muted-foreground">
            <th className="w-16 py-2 pl-5 font-normal">Год</th>
            <th className="py-2 font-normal">Должность</th>
            <th className="py-2 font-normal">Тип судна</th>
            <th className="py-2 pr-5 text-right font-normal">Стаж</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={i} className="border-t border-border">
              <td className="py-2 pl-5 font-mono text-muted-foreground">{c.year}</td>
              <td className="py-2">{c.position}</td>
              <td className="py-2">{c.vesselType}</td>
              <td className="py-2 pr-5 text-right"><MonoNums text={yearsMonthsText(c.months)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Fold>
  )
}

// «Позвать на работу»: вакансія + повідомлення. Моряк отримає запит у «Рабочих» сповіщеннях (№22).
function InviteDialog({ s, open, onClose, onSend }: { s: WebSeafarer; open: boolean; onClose: () => void; onSend: (jobId: string, message: string) => void }) {
  const { showToast } = useProto()
  const jobs = WEB_JOBS.filter((j) => j.status === 'open')
  const first = s.name.split(' ')[0]
  const [jobId, setJobId] = useState(() => jobs.find((j) => j.position === s.position)?.id ?? '')
  const job = jobById(jobId)
  const [message, setMessage] = useState<string | null>(null)
  const text = message ?? (job ? `Здравствуйте, ${first}! Ищем ${job.position} на ${job.vesselType}, посадка ${ruDate(job.board)}. Интересно?` : '')

  return (
    <WebDialog
      open={open}
      onClose={onClose}
      title="Позвать на работу"
      description={`${s.name}, ${s.position}`}
      footer={
        <>
          <Button variant="ghost" className="h-10" onClick={onClose}>
            Отмена
          </Button>
          <Button
            className="h-10 px-5"
            disabled={!job}
            onClick={() => {
              onSend(jobId, text)
              showToast('Приглашение отправлено')
            }}
          >
            Отправить приглашение
          </Button>
        </>
      }
    >
      <WebField id="inv-job" label="Вакансия" required>
        <WebSelect
          id="inv-job"
          value={jobId}
          onChange={(v) => {
            setJobId(v)
            setMessage(null)
          }}
          placeholder="Выберите вакансию"
          options={jobs.map((j) => ({ value: j.id, label: `${j.position}, ${j.vesselName}` }))}
        />
      </WebField>
      <WebField id="inv-msg" label="Сообщение" hint="Моряк увидит предложение в уведомлениях и ответит одной кнопкой. Ответит — откроется чат.">
        <WebTextarea id="inv-msg" rows={4} value={text} onChange={(e) => setMessage(e.target.value)} placeholder="Несколько слов о вакансии" />
      </WebField>
    </WebDialog>
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
        <WebDatePick id="sf-due" value={isoToRu(due)} onChange={(v) => setDue(ruToIso(v))} {...BOUNDS.future} className="w-48" />
      </WebField>
    </WebDialog>
  )
}
