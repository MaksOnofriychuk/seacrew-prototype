import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, CheckCheck, Download, FileText, ImageIcon, Link2, MessageSquare, Paperclip, Search, SendHorizontal, UserRound } from 'lucide-react'
import { EmptyState, useView, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebShell } from '@/components/web/shell'
import { useAttachment } from '@/components/web/web-viewer'
import { ApplicationStatusDot, WebAvatar } from '@/components/web/status-badge'
import { FORMS, jobById, ME_RECRUITER, RECRUITERS, seafarerById, type RecruiterRole } from '@/lib/data-web'
import { TEAM, type TeamMember } from '@/lib/data-recruiter-3'
import { formTitle, type Chat, type ChatMsg } from '@/lib/data-recruiter-2'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { useProto } from '@/lib/proto-state'
import { useR2, type Go } from './_parts'

// r-messages і r-chat — повідомлення рекрутера (відп. 111–115, правка №22).
// Ліворуч список розмов, праворуч — розмова: текст, фото, файли, посилання; «Прочитано» і «в сети».
// Чат з'являється після відгуку моряка і починається з рядка «Моряк откликнулся на вакансию …».

export function RMessages({ go }: ScreenProps) {
  const view = useView()
  return (
    <Layout go={go} openId={null}>
      <div className="flex flex-1 items-center justify-center">
        {view === 'normal' && <EmptyState icon={MessageSquare} title="Выберите диалог" text="Диалог появляется, когда моряк откликается на вакансию или отвечает на ваше предложение." />}
      </div>
    </Layout>
  )
}

export function RChat({ go }: ScreenProps) {
  const r = useR2()
  const chat = r.chats.find((c) => c.id === r.chatId) ?? r.chats[0]
  return (
    <Layout go={go} openId={chat.id}>
      <Thread key={chat.id} chat={chat} go={go} />
    </Layout>
  )
}

// Роль берём из команды (r3.team). Для показа обоих вариантов в прототипе её можно задать адресом: `#r-messages?role=recruiter`
// (или owner / admin) — выбор запоминается на время просмотра.
function useMyRole(): RecruiterRole {
  const { bag, setBag } = useProto()
  const asked = new URLSearchParams(location.hash.split('?')[1] ?? '').get('role')
  const fromUrl = asked === 'owner' || asked === 'admin' || asked === 'recruiter' ? asked : null
  useEffect(() => {
    if (fromUrl) setBag('r2.messagesRole', fromUrl)
  }, [fromUrl])
  const own = bag<TeamMember[]>('r3.team', TEAM).find((m) => m.id === ME_RECRUITER.id)?.role ?? ME_RECRUITER.role
  return fromUrl ?? bag<RecruiterRole | null>('r2.messagesRole', null) ?? own
}

type ChatFilter = 'all' | 'unread'

function Layout({ go, openId, children }: { go: Go; openId: string | null; children: ReactNode }) {
  const r = useR2()
  const role = useMyRole()
  const seeAll = role !== 'recruiter'
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<ChatFilter>('all')
  const needle = q.trim().toLowerCase()
  const mine = seeAll ? r.chats : r.chats.filter((c) => jobById(c.jobId)?.recruiterId === ME_RECRUITER.id)
  const unreadCount = mine.filter((c) => c.unread > 0).length
  const list = mine.filter((c) => {
    if (filter === 'unread' && c.unread === 0) return false
    if (!needle) return true
    const s = seafarerById(c.seafarerId)!
    const j = r.jobs.find((x) => x.id === c.jobId)
    return [s.name, j?.position ?? '', j?.vesselName ?? ''].some((t) => t.toLowerCase().includes(needle))
  })

  const listBody = (
    <ul className="flex flex-col">
      {list.map((c) => (
        <ChatRow
          key={c.id}
          chat={c}
          active={c.id === openId}
          leader={seeAll ? RECRUITERS.find((x) => x.id === jobById(c.jobId)?.recruiterId)?.name : undefined}
          onOpen={() => {
            r.openChat(c.id)
            go('r-chat')
          }}
        />
      ))}
      {list.length === 0 && (
        <li className="px-6 py-8 text-sm text-muted-foreground">{needle ? `Никого не нашли по запросу «${q}».` : 'Непрочитанных диалогов нет.'}</li>
      )}
    </ul>
  )

  return (
    <WebShell variant="recruiter" active="r-messages" go={go} className="flex p-0">
      <section className="flex w-[380px] shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex flex-col gap-4 px-6 pt-7 pb-4">
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight">Сообщения</h1>
          <label className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-primary">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Моряк или вакансия" aria-label="Поиск по диалогам" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </label>
          <div role="group" aria-label="Фильтр диалогов" className="flex gap-1.5">
            {(
              [
                ['all', 'Все', mine.length],
                ['unread', 'Непрочитанные', unreadCount],
              ] as const
            ).map(([id, label, n]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
                  filter === id ? 'border-primary bg-primary/10 font-medium text-primary' : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
                <span className="font-mono text-xs">{n}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {openId ? (
            listBody
          ) : (
            <ViewState
              loading={{ kind: 'list', className: 'px-4' }}
              empty={{ icon: MessageSquare, title: 'Диалогов пока нет', text: 'Диалог появится, когда моряк откликнется на вашу вакансию.' }}
            >
              {listBody}
            </ViewState>
          )}
        </div>
      </section>
      <section className="flex min-w-0 flex-1 flex-col">{children}</section>
    </WebShell>
  )
}

function lastPreview(m: ChatMsg) {
  if (m.from === 'system') return m.text ?? ''
  const who = m.from === 'me' ? 'Вы: ' : ''
  if (m.text) return who + m.text
  if (m.photo) return who + 'Фото'
  if (m.file) return who + m.file.name
  if (m.link) return who + m.link.url
  if (m.form) return who + 'Анкета: ' + formTitle(m.form.formId)
  return ''
}

function ChatRow({ chat, active, leader, onOpen }: { chat: Chat; active: boolean; /** сотрудник, который ведёт диалог (видят владелец и администратор) */ leader?: string; onOpen: () => void }) {
  const r = useR2()
  const s = seafarerById(chat.seafarerId)!
  const j = r.jobs.find((x) => x.id === chat.jobId)
  const last = chat.messages.at(-1)!
  return (
    <li>
      <button type="button" onClick={onOpen} aria-current={active ? 'true' : undefined} className={cn('flex w-full gap-3 border-l-2 px-6 py-3.5 text-left transition-colors', active ? 'border-primary bg-muted' : 'border-transparent hover:bg-muted')}>
        <Avatar initials={s.initials} online={chat.online} className="self-start" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline justify-between gap-3">
            <span className={cn('truncate text-[15px]', chat.unread && !active ? 'font-semibold' : 'font-medium')}>{s.name}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{last.time.slice(0, 5)}</span>
          </span>
          <span className="truncate text-[13px] text-muted-foreground">
            {j?.position}, {j?.vesselName}
          </span>
          {leader && <span className="truncate text-[13px] text-muted-foreground">Ведёт: {leader}</span>}
          <span className="flex items-center justify-between gap-3">
            <span className={cn('truncate text-sm', chat.unread && !active ? 'text-foreground' : 'text-muted-foreground')}>{lastPreview(last)}</span>
            {chat.unread > 0 && !active && <span className="shrink-0 rounded-full bg-primary px-1.5 font-mono text-xs leading-5 text-primary-foreground">{chat.unread}</span>}
          </span>
        </span>
      </button>
    </li>
  )
}

function Avatar({ initials, online, className }: { initials: string; online: boolean; className?: string }) {
  return (
    <span className={cn('relative flex shrink-0', className)}>
      <WebAvatar initials={initials} />
      {online && <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-surface bg-success" aria-label="В сети" />}
    </span>
  )
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const dayLabel = (t: string) => (t.slice(0, 5) === '02.11' ? 'Сегодня' : `${Number(t.slice(0, 2))} ${MONTHS[Number(t.slice(3, 5)) - 1]}`)

function Thread({ chat, go }: { chat: Chat; go: Go }) {
  const r = useR2()
  const view = useView()
  const { setBag } = useProto()
  const s = seafarerById(chat.seafarerId)!
  const j = r.jobs.find((x) => x.id === chat.jobId)!
  const app = r.apps.find((a) => a.id === chat.id)
  const att = useAttachment()
  const [text, setText] = useState('')
  const [menu, setMenu] = useState<'closed' | 'main' | 'forms'>('closed')
  const [seenAll, setSeenAll] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [chat.messages.length, view])

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
    // Повідомлення, що складається лише з адреси, показуємо як посилання.
    const isUrl = /^(https?:\/\/)?[\w-]+(\.[\w-]+)*\.[a-z]{2,}(\/\S*)?$/i.test(t)
    push(isUrl ? { link: { url: t.replace(/^https?:\/\//, ''), title: 'Ссылка' } } : { text: t })
    setText('')
  }

  // Останнє своє повідомлення — під ним «Прочитано» / «Отправлено».
  const lastMine = chat.messages.map((m) => m.from).lastIndexOf('me')
  let prevDay = ''

  const thread = (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-2 px-8 py-6">
      {chat.messages.map((m, i) => {
        const day = m.time.slice(0, 5)
        const sep = day !== prevDay
        prevDay = day
        const read = m.read || seenAll
        return (
          <div key={i} className="flex flex-col">
            {sep && <span className="my-3 self-center text-xs text-muted-foreground">{dayLabel(m.time)}</span>}
            {m.from === 'system' ? (
              <SystemLine
                m={m}
                job={`${j.position}, ${j.vesselName}`}
                onJob={() => {
                  r.openJob(j.id)
                  go('r-job')
                }}
              />
            ) : (
              <Bubble m={m} go={go} onOpen={(name, kind) => att.open(name, kind, m.from === 'me' ? 'Вы' : s.name)} />
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
      {chat.messages.every((m) => m.from !== 'me') && <p className="mt-4 self-center text-sm text-muted-foreground">Ответьте — моряк увидит сообщение в этом же чате.</p>}
    </div>
  )

  const activeForms = FORMS.filter((x) => x.status === 'active')

  return (
    <>
      <header className="flex h-[76px] shrink-0 items-center gap-4 border-b border-border bg-surface px-8">
        <Avatar initials={s.initials} online={chat.online} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-semibold">
            {s.name} <span className="font-normal text-muted-foreground">{s.position}</span>
          </span>
          <span className={cn('text-sm', chat.online ? 'text-success' : 'text-muted-foreground')}>{chat.online ? 'в сети' : chat.seen}</span>
        </div>
        <div className="ml-auto flex items-center gap-5">
          {app && (
            <button
              type="button"
              onClick={() => {
                r.selectApp(app.id)
                go('r-applications')
              }}
              className="flex items-center gap-2 text-sm"
              title="Открыть отклик"
            >
              <span className="text-muted-foreground">Отклик:</span>
              <ApplicationStatusDot s={app.status} />
            </button>
          )}
          <Button variant="outline" size="sm" onClick={() => {
              setBag('r1.seafarer', s.id)
              go('r-seafarer')
            }}>
            <UserRound /> Профиль
          </Button>
        </div>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto bg-background">
        <ViewState loading={{ kind: 'list', className: 'mx-auto w-full max-w-[760px] px-8 py-6' }} empty={{ icon: MessageSquare, title: 'Сообщений пока нет', text: 'Напишите первым — моряк получит уведомление.' }}>
          {thread}
        </ViewState>
      </div>

      <footer className="relative shrink-0 border-t border-border bg-surface px-8 py-4">
        {menu !== 'closed' && (
          <div className="absolute bottom-[calc(100%+8px)] left-8 z-10 w-[300px] rounded-xl border border-border bg-surface p-1.5">
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
                <p className="px-3 pt-1.5 pb-1 text-xs text-muted-foreground">
                  До <span className="font-mono">10</span> файлов, каждый до <span className="font-mono">20</span> МБ: JPG, PNG, HEIC или PDF
                </p>
              </>
            ) : (
              <>
                <p className="px-3 pt-1.5 pb-1 text-xs text-muted-foreground">Какую анкету отправить?</p>
                {activeForms.map((x) => (
                  <MenuItem key={x.id} icon={FileText} onClick={() => push({ form: { formId: x.id, status: 'sent' } })}>
                    {x.title}
                  </MenuItem>
                ))}
              </>
            )}
          </div>
        )}
        <div className="flex items-end gap-3">
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
      {att.node}
    </>
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

function SystemLine({ m, job, onJob }: { m: ChatMsg; job: string; onJob: () => void }) {
  return (
    <div className="my-2 flex flex-col items-center gap-0.5 text-center text-sm text-muted-foreground">
      <span>
        {m.text}{' '}
        <button type="button" onClick={onJob} className="font-medium text-primary">
          {job}
        </button>
      </span>
      <span className="font-mono text-xs">{m.time.slice(6)}</span>
    </div>
  )
}

function Bubble({ m, go, onOpen }: { m: ChatMsg; go: Go; onOpen: (name: string, kind: 'photo' | 'file') => void }) {
  const r = useR2()
  const mine = m.from === 'me'
  const time = <span className={cn('font-mono text-[11px]', mine && !m.form && !m.file && !m.photo ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{m.time.slice(6)}</span>

  // Вкладення — окремим блоком без кольорової «бульбашки»; текст — у бульбашці.
  const attachment = m.photo ? (
    <button type="button" onClick={() => onOpen(m.photo!.name, 'photo')} className="flex w-[260px] flex-col overflow-hidden rounded-xl border border-border bg-surface text-left">
      <PhotoStub />
      <span className="flex items-center justify-between gap-2 px-3 py-2 text-[13px]">
        <span className="truncate text-muted-foreground">{m.photo.name}</span>
        {time}
      </span>
    </button>
  ) : m.file ? (
    <div className="flex w-[320px] items-center rounded-xl border border-border bg-surface">
      <button type="button" onClick={() => onOpen(m.file!.name, 'file')} className="flex min-w-0 flex-1 items-center gap-3 rounded-l-xl py-2.5 pr-1 pl-3 text-left hover:bg-muted">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
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
    <FormCard m={m} go={go} />
  ) : null

  return (
    <div className={cn('flex max-w-[70%] flex-col gap-1.5', mine ? 'items-end self-end' : 'items-start self-start')}>
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
          {(m.link || !m.text) && <span className="self-end">{time}</span>}
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

// Фото документа без справжнього зображення: аркуш зі смугою і рядками.
function PhotoStub() {
  return (
    <span className="flex h-[150px] items-center justify-center bg-muted">
      <span className="flex h-[118px] w-[168px] -rotate-2 flex-col gap-2 overflow-hidden rounded-md border border-border bg-surface">
        <span className="h-4 bg-primary/80" />
        <span className="flex flex-col gap-1.5 px-3">
          <span className="h-1.5 w-3/4 rounded-full bg-border" />
          <span className="h-1.5 w-1/2 rounded-full bg-border" />
          <span className="h-1.5 w-2/3 rounded-full bg-border" />
          <span className="mt-2 h-1.5 w-1/3 self-end rounded-full bg-border" />
        </span>
      </span>
    </span>
  )
}

function FormCard({ m, go }: { m: ChatMsg; go: Go }) {
  const r = useR2()
  const f = m.form!
  const done = f.status === 'submitted'
  return (
    <div className="w-[320px] overflow-hidden rounded-xl border border-border bg-surface">
      <div className="bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Анкета компании</div>
      <div className="flex flex-col gap-2 px-4 py-3">
        <span className="text-[15px] font-medium">{formTitle(f.formId)}</span>
        <span className={cn('text-sm', done ? 'text-success' : 'text-muted-foreground')}>{done ? 'Моряк заполнил и отправил' : 'Отправлена, ждём ответа'}</span>
        {done && f.assignmentId && (
          <Button
            variant="outline"
            size="sm"
            className="self-start text-primary"
            onClick={() => {
              r.openAssignment(f.assignmentId!)
              go('r-assignment')
            }}
          >
            Открыть ответ
          </Button>
        )}
      </div>
    </div>
  )
}
