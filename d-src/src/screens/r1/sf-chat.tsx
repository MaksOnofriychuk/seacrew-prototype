import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, CheckCheck, Download, ExternalLink, FileText, ImageIcon, Link2, MessageSquare, Paperclip, SendHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusDot } from '@/components/web/status-badge'
import { ApplicationStatusDot } from '@/components/web/status-badge'
import { FORMS } from '@/lib/data-web'
import type { Chat, ChatMsg } from '@/lib/data-recruiter-2'
import { formTitle } from '@/lib/data-recruiter-2'
import { cn } from '@/lib/utils'
import { useR2 } from '../r2/_parts'
import { isPhotoName } from './sf-parts'

// Переписка внутри карточки кандидата (правка №52, п. 4): на всё доступное место, как r-chat —
// сообщения, фото и файлы с просмотром, поле ответа. Справа — сводка: вакансия, отклик, файлы из переписки.

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const dayLabel = (t: string) => (t.slice(0, 5) === '02.11' ? 'Сегодня' : `${Number(t.slice(0, 2))} ${MONTHS[Number(t.slice(3, 5)) - 1]}`)

export function CandidateChat({
  chat,
  openAttachment,
  onOpenForm,
  onOpenChat,
  onFiles,
}: {
  chat: Chat
  openAttachment: (name: string, kind: 'photo' | 'file', subtitle?: string) => void
  onOpenForm: (assignmentId: string) => void
  onOpenChat: () => void
  onFiles: () => void
}) {
  const r = useR2()
  const [text, setText] = useState('')
  const [menu, setMenu] = useState<'closed' | 'main' | 'forms'>('closed')
  const [seenAll, setSeenAll] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [chat.messages.length])

  const job = r.jobs.find((x) => x.id === chat.jobId)
  const app = r.apps.find((a) => a.id === chat.id)
  const media = chat.messages.filter((m) => m.photo || m.file)

  const now = () => {
    const d = new Date()
    return `02.11 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  const push = (m: Omit<ChatMsg, 'from' | 'time'>) => {
    r.send(chat.id, { from: 'me', time: now(), read: false, ...m })
    setSeenAll(false)
    setMenu('closed')
    window.clearTimeout(timer.current)
    if (chat.online) timer.current = window.setTimeout(() => setSeenAll(true), 1800)
  }
  const sendText = () => {
    const t = text.trim()
    if (!t) return
    push({ text: t })
    setText('')
  }
  const lastMine = chat.messages.map((m) => m.from).lastIndexOf('me')
  let prevDay = ''

  return (
    <div className="grid h-[590px] grid-cols-[minmax(0,1fr)_300px] gap-6">
      <section className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-5">
          <span className="text-[15px] font-semibold">Переписка</span>
          <span className={cn('text-sm', chat.online ? 'text-success' : 'text-muted-foreground')}>{chat.online ? 'в сети' : chat.seen}</span>
          <button type="button" onClick={onOpenChat} className="ml-auto flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <ExternalLink className="size-4" /> Открыть в сообщениях
          </button>
        </header>

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto bg-background px-6 py-4">
          <div className="mx-auto flex w-full max-w-[860px] flex-col gap-2">
            {chat.messages.map((m, i) => {
              const day = m.time.slice(0, 5)
              const sep = day !== prevDay
              prevDay = day
              const read = m.read || seenAll
              return (
                <div key={i} className="flex flex-col">
                  {sep && <span className="my-2 self-center text-xs text-muted-foreground">{dayLabel(m.time)}</span>}
                  {m.from === 'system' ? (
                    <p className="my-1 text-center text-sm text-muted-foreground">
                      {m.text} {job && <span className="font-medium text-foreground">{job.position}, {job.vesselName}</span>} <span className="font-mono text-xs">{m.time.slice(6)}</span>
                    </p>
                  ) : (
                    <Bubble m={m} onOpen={(name, kind) => openAttachment(name, kind, m.from === 'me' ? 'Вы' : 'Моряк')} onForm={onOpenForm} />
                  )}
                  {i === lastMine && (
                    <span className="mt-1 flex items-center gap-1 self-end text-xs text-muted-foreground">
                      {read ? <CheckCheck className="size-3.5 text-primary" /> : <Check className="size-3.5" />}
                      {read ? 'Прочитано' : 'Отправлено'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <footer className="relative shrink-0 border-t border-border bg-surface px-5 py-3">
          {menu !== 'closed' && (
            <div className="absolute bottom-[calc(100%+8px)] left-5 z-10 w-[280px] rounded-xl border border-border bg-surface p-1.5 shadow-md">
              {menu === 'main' ? (
                <>
                  <MenuItem icon={ImageIcon} onClick={() => push({ photo: { name: 'Vessel_Aurora_Spirit.jpg' } })}>
                    Фото
                  </MenuItem>
                  <MenuItem icon={FileText} onClick={() => push({ file: { name: 'Contract_draft.pdf', size: '340 КБ' } })}>
                    Файл
                  </MenuItem>
                  <MenuItem icon={FileText} onClick={() => setMenu('forms')}>
                    Анкета компании
                  </MenuItem>
                </>
              ) : (
                <>
                  <p className="px-3 pt-1.5 pb-1 text-xs text-muted-foreground">Какую анкету отправить?</p>
                  {FORMS.filter((x) => x.status === 'active').map((x) => (
                    <MenuItem key={x.id} icon={FileText} onClick={() => push({ form: { formId: x.id, status: 'sent' } })}>
                      {x.title}
                    </MenuItem>
                  ))}
                </>
              )}
            </div>
          )}
          <div className="mx-auto flex max-w-[860px] items-end gap-3">
            <button type="button" aria-label="Прикрепить" aria-expanded={menu !== 'closed'} onClick={() => setMenu(menu === 'closed' ? 'main' : 'closed')} className={cn('flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted', menu !== 'closed' && 'bg-muted text-primary')}>
              <Paperclip className="size-5" />
            </button>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendText()
                }
              }}
              rows={1}
              placeholder="Напишите сообщение"
              aria-label="Сообщение"
              className="max-h-32 min-h-10 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-[15px] outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <Button size="icon-lg" aria-label="Отправить" onClick={sendText} disabled={!text.trim()}>
              <SendHorizontal className="size-5" />
            </Button>
          </div>
        </footer>
      </section>

      <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto">
        <section className="rounded-xl border border-border bg-surface px-5 py-4">
          <h3 className="mb-2 text-sm font-semibold">Вакансия</h3>
          {job ? (
            <>
              <p className="text-[15px] leading-snug">
                {job.position}, {job.vesselName}
              </p>
              {app && (
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  Отклик: <ApplicationStatusDot s={app.status} />
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Моряк принял приглашение без вакансии.</p>
          )}
        </section>
        <section className="rounded-xl border border-border bg-surface px-5 py-4">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">Файлы в переписке</h3>
            <button type="button" onClick={onFiles} className="text-sm font-medium text-primary hover:underline">
              Все файлы
            </button>
          </div>
          {media.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет.</p>
          ) : (
            <ul className="flex flex-col">
              {media.map((m, i) => {
                const f = (m.photo ?? m.file)!
                return (
                  <li key={i}>
                    <button type="button" onClick={() => openAttachment(f.name, m.photo ? 'photo' : 'file', m.from === 'me' ? 'Вы' : 'Моряк')} className="-mx-2 flex w-[calc(100%+16px)] items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-muted">
                      {m.photo ? <ImageIcon className="size-4 shrink-0 text-primary" /> : <FileText className="size-4 shrink-0 text-primary" />}
                      <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </aside>
    </div>
  )
}

function MenuItem({ icon: I, children, onClick }: { icon: typeof FileText; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm hover:bg-muted">
      <I className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{children}</span>
    </button>
  )
}

function PhotoStub() {
  return (
    <span className="flex h-[130px] items-center justify-center bg-muted">
      <span className="flex h-[100px] w-[144px] -rotate-2 flex-col gap-2 overflow-hidden rounded-md border border-border bg-surface">
        <span className="h-4 bg-primary/80" />
        <span className="flex flex-col gap-1.5 px-3">
          <span className="h-1.5 w-3/4 rounded-full bg-border" />
          <span className="h-1.5 w-1/2 rounded-full bg-border" />
          <span className="h-1.5 w-2/3 rounded-full bg-border" />
        </span>
      </span>
    </span>
  )
}

function Bubble({ m, onOpen, onForm }: { m: ChatMsg; onOpen: (name: string, kind: 'photo' | 'file') => void; onForm: (assignmentId: string) => void }) {
  const r = useR2()
  const mine = m.from === 'me'
  const time = <span className={cn('font-mono text-[11px]', mine && !m.form && !m.file && !m.photo ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{m.time.slice(6)}</span>
  const attachment = m.photo ? (
    <button type="button" onClick={() => onOpen(m.photo!.name, 'photo')} className="flex w-[240px] flex-col overflow-hidden rounded-xl border border-border bg-surface text-left hover:border-primary">
      <PhotoStub />
      <span className="flex items-center justify-between gap-2 px-3 py-1.5 text-[13px]">
        <span className="truncate text-muted-foreground">{m.photo.name}</span>
        {time}
      </span>
    </button>
  ) : m.file ? (
    <div className="flex w-[300px] items-center rounded-xl border border-border bg-surface">
      <button type="button" onClick={() => onOpen(m.file!.name, isPhotoName(m.file!.name) ? 'photo' : 'file')} className="flex min-w-0 flex-1 items-center gap-3 rounded-l-xl py-2 pr-1 pl-3 text-left hover:bg-muted">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
          <FileText className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{m.file.name}</span>
          <span className="text-xs text-muted-foreground">
            <span className="font-mono">{m.file.size}</span>, PDF
          </span>
        </span>
      </button>
      <button type="button" aria-label={`Скачать ${m.file.name}`} onClick={() => r.showToast(`Файл скачан: ${m.file!.name}`)} className="mr-2 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
        <Download className="size-4" />
      </button>
    </div>
  ) : m.form ? (
    <div className="w-[300px] overflow-hidden rounded-xl border border-border bg-surface">
      <div className="bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">Анкета компании</div>
      <div className="flex flex-col gap-1.5 px-4 py-2.5">
        <span className="text-[15px] font-medium">{formTitle(m.form.formId)}</span>
        <StatusDot tone={m.form.status === 'submitted' ? 'success' : 'muted'}>{m.form.status === 'submitted' ? 'Моряк заполнил и отправил' : 'Отправлена, ждём ответа'}</StatusDot>
        {m.form.status === 'submitted' && m.form.assignmentId && (
          <Button variant="outline" size="sm" className="mt-1 self-start text-primary" onClick={() => onForm(m.form!.assignmentId!)}>
            Открыть ответ
          </Button>
        )}
      </div>
    </div>
  ) : null

  return (
    <div className={cn('flex max-w-[75%] flex-col gap-1.5', mine ? 'items-end self-end' : 'items-start self-start')}>
      {(m.text || m.link) && (
        <div className={cn('flex flex-col gap-1 rounded-2xl px-3.5 py-2', mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-surface ring-1 ring-border')}>
          {m.text && (
            <p className="text-[15px] leading-snug whitespace-pre-wrap">
              {m.text}
              {!m.link && <span className="float-right mt-1.5 ml-3">{time}</span>}
            </p>
          )}
          {m.link && (
            <button type="button" onClick={() => r.showToast(`Откроется ${m.link!.url}`)} className={cn('flex items-center gap-2 text-left text-[15px] underline underline-offset-2', mine ? 'text-primary-foreground' : 'text-primary')}>
              <Link2 className="size-4 shrink-0" />
              <span className="flex flex-col">
                {m.link.title !== 'Ссылка' && <span className="font-medium">{m.link.title}</span>}
                <span className="opacity-80">{m.link.url}</span>
              </span>
            </button>
          )}
          {m.link && <span className="self-end">{time}</span>}
        </div>
      )}
      {attachment && (
        <div className="flex flex-col items-end gap-1">
          {attachment}
          {(m.file || m.form) && !m.text && time}
        </div>
      )}
    </div>
  )
}

export function EmptyChat({ onWrite }: { onWrite: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-6 py-14 text-center">
      <MessageSquare className="size-8 text-muted-foreground" />
      <p className="text-[15px] font-medium">Переписки пока нет</p>
      <p className="max-w-[420px] text-sm text-muted-foreground">Напишите первым: моряк получит сообщение в приложении. Разговор откроется, когда он ответит.</p>
      <Button variant="outline" className="text-primary" onClick={onWrite}>
        Написать
      </Button>
    </div>
  )
}
