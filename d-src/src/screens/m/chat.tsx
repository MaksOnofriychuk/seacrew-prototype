import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Camera, Check, CheckCheck, ChevronLeft, ChevronRight, FileText, Link2, Paperclip, SendHorizontal } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { FJ_JOBS as JOBS } from '@/lib/data-feed-jobs'
import type { Chat, ChatMsg } from '@/lib/data-messages'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { useMe } from '../p/_feed-parts'
import { ChatAvatar, EVENT_TEXT, useChats, useSelectedChat } from './_parts'
import { SourceSheet } from '@/components/app/source-sheet'
import { MediaViewer } from '@/components/app/media-viewer'
import { ShareSheet } from '@/components/app/share-sheet'

// m-chat — чат з рекрутером (правка №22, відповіді 112–116, gaps №4, код conversation/[id]).
// Текст, фото, файли, посилання; «Прочитано» під моїм повідомленням; «онлайн» у шапці.
// Над перепискою — вакансія, про яку чат, і «Отправить CV» (як у застосунку).
// Чат після відгуку, поки рекрутер не відповів: заглушка «Вы откликнулись на вакансию»; першим пише рекрутер (відп. 112).

export function MChat({ go, fixed }: ScreenProps & { fixed?: string }) {
  const { set, setBag, showToast } = useProto()
  const { get, markRead, send } = useChats()
  const id = useSelectedChat(fixed)
  const chat = get(id) ?? get('bw')!
  const [cvOpen, setCvOpen] = useState(false)
  const job = JOBS[chat.job]
  const replied = chat.messages.some((m) => 'from' in m && m.from === 'them')
  const scroller = useRef<HTMLDivElement>(null)
  // скільки було непрочитаних, коли відкрили чат — для межі «Новые сообщения»
  const [unreadFrom] = useState(chat.unread > 0 ? chat.messages.length - chat.unread : -1)

  useEffect(() => {
    markRead(chat.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id])
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [chat.messages.length])

  const openJob = () => {
    set({ job: chat.job })
    setBag('job.back', 'm-chat')
    setBag('chat.sel', chat.id)
    go('p08')
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* шапка: хто, з якого агентства, онлайн */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-2">
        <button type="button" onClick={() => go('p15')} aria-label="Назад" className="flex size-11 shrink-0 items-center justify-center rounded-md text-primary active:scale-95">
          <ChevronLeft className="size-6" />
        </button>
        <ChatAvatar chat={chat} size="sm" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] leading-tight font-semibold">{chat.person?.name ?? chat.org}</span>
          <span className="truncate text-[13px] text-muted-foreground">
            {chat.person ? (
              <>
                {chat.org}, {chat.online ? <span className="text-success">онлайн</span> : (chat.seen ?? 'не в сети')}
              </>
            ) : (
              'Рекрутер ещё не ответил'
            )}
          </span>
        </span>
      </div>

      {/* вакансія, про яку чат; до відповіді рекрутера її показує заглушка нижче */}
      {replied && (
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface py-2 pr-3 pl-4">
          <button type="button" onClick={openJob} className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {job.t}, {job.ship}
              </span>
              <span className="truncate text-[13px] text-muted-foreground">{job.sal}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
          <Button variant="outline" size="sm" className="h-9 shrink-0 text-primary" onClick={() => setCvOpen(true)}>
            <FileText /> Отправить CV
          </Button>
        </div>
      )}

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto bg-background px-4 pt-3 pb-4">
        <ViewState empty={{ title: 'Сообщений пока нет', text: 'Напишите первое.' }} error={{ title: 'Не удалось загрузить переписку' }} loading={{ kind: 'cards', rows: 3 }}>
          <Messages chat={chat} go={go} onJob={openJob} unreadFrom={unreadFrom} />
        </ViewState>
      </div>

      {replied ? (
        <Composer
          onText={(text) => {
            const link = /^(https?:\/\/|www\.)\S+$/i.test(text)
            if (link) send(chat.id, { kind: 'link', from: 'me', url: text.replace(/^https?:\/\//, ''), title: text.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] })
            else send(chat.id, { kind: 'text', from: 'me', text })
          }}
          onPhoto={() => send(chat.id, { kind: 'photo', from: 'me', caption: 'Фото с телефона' })}
          onFile={() => send(chat.id, { kind: 'file', from: 'me', name: 'Сертификат STCW.pdf', size: '860 КБ' })}
        />
      ) : (
        <div className="shrink-0 border-t border-border bg-background px-6 pt-3 pb-5 text-center text-sm text-muted-foreground">Написать можно будет, когда рекрутер ответит.</div>
      )}

      <CvSheet
        open={cvOpen}
        onClose={() => setCvOpen(false)}
        onProfile={() => go('p14')}
        onSend={(name) => {
          send(chat.id, { kind: 'file', from: 'me', name, size: '180 КБ' })
          setCvOpen(false)
          showToast('CV отправлено')
        }}
      />
    </div>
  )
}

// Чат після відгуку, рекрутер ще не відповів (окремий пункт у списку екранів панелі).
export function MChatApplied(props: ScreenProps) {
  return <MChat {...props} fixed="mc" />
}

/* ---------- повідомлення ---------- */

function Messages({ chat, go, onJob, unreadFrom }: { chat: Chat; go: (id: string) => void; onJob: () => void; unreadFrom: number }) {
  const { bag, setBag, showToast } = useProto()
  const formSent = bag<boolean>('form.sent', false)
  const msgs = chat.messages
  const mineIdx = msgs.flatMap((m, i) => ('from' in m && m.from === 'me' ? [i] : []))
  const lastMine = mineIdx.at(-1) ?? -1
  const lastRead = mineIdx.filter((i) => i <= chat.readUpTo).at(-1) ?? -1

  return (
    <div className="flex flex-col gap-1.5">
      {msgs.map((m, i) => {
        const receipt = i === lastRead ? 'read' : i === lastMine && lastMine > lastRead ? 'sent' : null
        const next = msgs[i + 1]
        const tail = !next || !('from' in next) || !('from' in m) || next.from !== m.from
        return (
          <div key={i} className={cn('flex flex-col', tail && 'mb-1.5')}>
            {i === unreadFrom && <Divider tone="primary">Новые сообщения</Divider>}
            <Message
              m={m}
              chat={chat}
              go={go}
              onJob={onJob}
              formSent={formSent}
              onToast={showToast}
              onOpenForm={() => {
                setBag('chat.sel', chat.id)
                go('m-form')
              }}
            />
            {receipt && (
              <span className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                {receipt === 'read' ? <CheckCheck className="size-3.5 text-primary" /> : <Check className="size-3.5" />}
                {receipt === 'read' ? 'Прочитано' : 'Отправлено'}
              </span>
            )}
          </div>
        )
      })}
      {formSent && chat.id === 'bw' && <Event>{EVENT_TEXT['form-sent']}</Event>}
    </div>
  )
}

function Message({
  m,
  chat,
  onJob,
  formSent,
  onToast,
  onOpenForm,
}: {
  m: ChatMsg
  chat: Chat
  go: (id: string) => void
  onJob: () => void
  formSent: boolean
  onToast: (t: string) => void
  onOpenForm: () => void
}) {
  const [view, setView] = useState(false)
  const [share, setShare] = useState(false)
  if (m.kind === 'day') return <Divider>{m.text}</Divider>
  if (m.kind === 'event') {
    if (m.event === 'applied') return <AppliedCard chat={chat} time={m.time} onJob={onJob} />
    return (
      <Event>
        {EVENT_TEXT[m.event]} <span className={/\d/.test(m.time) ? 'font-mono' : undefined}>{m.time}</span>
      </Event>
    )
  }
  if (m.kind === 'form') {
    return (
      <div className="max-w-[86%] self-start overflow-hidden rounded-xl border border-border bg-surface">
        <div className="bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Анкета</div>
        <div className="flex flex-col gap-1 px-4 pt-3 pb-4">
          <span className="text-[15px] font-semibold">{m.title}</span>
          {formSent ? (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Check className="size-4 text-success" strokeWidth={2.25} /> Отправлено
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Заполнить до <span className="font-mono">{m.due}</span>
            </span>
          )}
          <Button className="mt-3 h-10 text-[15px]" variant={formSent ? 'outline' : 'default'} onClick={onOpenForm}>
            {formSent ? 'Посмотреть отправленное' : 'Заполнить'}
          </Button>
          <Time className="mt-1 self-end">{m.time}</Time>
        </div>
      </div>
    )
  }

  const mine = m.from === 'me'
  const bubble = cn('max-w-[80%] rounded-2xl text-[15px] leading-snug', mine ? 'self-end rounded-br-md bg-primary text-primary-foreground' : 'self-start rounded-bl-md border border-border bg-surface')
  const time = <Time className={cn('self-end', mine && 'text-primary-foreground/75')}>{m.time}</Time>

  if (m.kind === 'text')
    return (
      <div className={cn(bubble, 'flex flex-col gap-0.5 px-3.5 py-2')}>
        <span className="whitespace-pre-wrap">{m.text}</span>
        {time}
      </div>
    )
  if (m.kind === 'photo')
    return (
      <>
        <button type="button" onClick={() => setView(true)} className={cn(bubble, 'flex w-[72%] flex-col gap-1 p-1 pb-1.5 text-left')}>
          <ShipPhoto />
          <span className="flex items-end justify-between gap-3 px-2.5">
            <span className="text-sm">{m.caption}</span>
            {time}
          </span>
        </button>
        <MediaViewer open={view} onClose={() => setView(false)} title={mine ? "Вы" : chat.person?.name ?? chat.org} caption={m.caption} onShare={() => setShare(true)}>
          <ShipPhoto />
        </MediaViewer>
        <ShareSheet open={share} onClose={() => setShare(false)} title="Поделиться фото" />
      </>
    )
  if (m.kind === 'file')
    return (
      <>
      <MediaViewer open={view} onClose={() => setView(false)} title={m.name} zoomable={false} onShare={() => setShare(true)}>
        <DocPage name={m.name} />
      </MediaViewer>
      <ShareSheet open={share} onClose={() => setShare(false)} title="Поделиться файлом" description={m.name} />
      <button type="button" onClick={() => setView(true)} className={cn(bubble, 'flex items-center gap-3 py-2.5 pr-3.5 pl-3 text-left')}>
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-md', mine ? 'bg-primary-foreground/15' : 'bg-muted text-primary')}>
          <FileText className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{m.name}</span>
          <span className="flex items-baseline gap-3">
            <span className={cn('font-mono text-xs', mine ? 'text-primary-foreground/75' : 'text-muted-foreground')}>{m.size}</span>
            {time}
          </span>
        </span>
      </button>
      </>
    )
  // link
  return (
    <button type="button" onClick={() => onToast('Ссылка откроется в браузере (пример)')} className={cn(bubble, 'flex flex-col gap-1.5 px-3.5 py-2.5 text-left')}>
      <span className={cn('flex items-center gap-1.5 break-all underline underline-offset-2', !mine && 'text-primary')}>
        <Link2 className="size-4 shrink-0" />
        {m.url}
      </span>
      <span className={cn('flex flex-col border-l-2 pl-2.5', mine ? 'border-primary-foreground/40' : 'border-primary')}>
        <span className="text-sm font-medium">{m.title}</span>
        {m.text && <span className={cn('text-sm', mine ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{m.text}</span>}
      </span>
      {time}
    </button>
  )
}

// Заглушка після відгуку (правка №22): вакансія як аркуш паперу; відповідь рекрутера — нижче, у цьому ж чаті.
function AppliedCard({ chat, time, onJob }: { chat: Chat; time: string; onJob: () => void }) {
  const j = JOBS[chat.job]
  const waiting = !chat.messages.some((m) => 'from' in m && m.from === 'them')
  return (
    <div className="my-1 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-baseline justify-between bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Вы откликнулись на вакансию
        <span className="font-mono text-xs font-normal opacity-80">{time}</span>
      </div>
      <button type="button" onClick={onJob} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold">
            {j.t}, {j.ship}
          </span>
          <span className="text-sm font-medium text-primary">{j.sal}</span>
          <span className="text-sm text-muted-foreground">
            {j.co}, посадка <span className={/\d/.test(j.board) ? 'font-mono' : undefined}>{j.board}</span>
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {waiting && <p className="border-t border-border px-4 py-2.5 text-sm text-muted-foreground">Рекрутер ответит в этом чате.</p>}
    </div>
  )
}

function Divider({ children, tone }: { children: ReactNode; tone?: 'primary' }) {
  return (
    <div className={cn('my-2 flex items-center gap-3 text-xs', tone === 'primary' ? 'font-medium text-primary' : 'text-muted-foreground')}>
      <span className={cn('h-px flex-1', tone === 'primary' ? 'bg-primary/40' : 'bg-border')} />
      {children}
      <span className={cn('h-px flex-1', tone === 'primary' ? 'bg-primary/40' : 'bg-border')} />
    </div>
  )
}

function Event({ children }: { children: ReactNode }) {
  return (
    <p className="my-1 flex items-center justify-center gap-1.5 text-center text-[13px] text-muted-foreground">
      <Check className="size-3.5 shrink-0 text-success" strokeWidth={2.5} />
      <span>{children}</span>
    </p>
  )
}

function Time({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-mono text-[11px] leading-none text-muted-foreground', className)}>{children}</span>
}

// Фото без справжніх знімків: умовне судно на воді.
function ShipPhoto() {
  return (
    <svg viewBox="0 0 240 150" className="block w-full rounded-xl bg-hero text-primary" aria-hidden>
      <rect x="0" y="96" width="240" height="54" fill="currentColor" opacity="0.14" />
      <path d="M0 104 Q30 100 60 104 T120 104 T180 104 T240 104" stroke="currentColor" strokeOpacity="0.25" fill="none" />
      <path d="M38 96 L196 96 L184 112 L50 112 Z" fill="currentColor" opacity="0.85" />
      <rect x="150" y="70" width="30" height="26" rx="2" fill="currentColor" opacity="0.7" />
      <rect x="160" y="58" width="12" height="12" fill="currentColor" opacity="0.55" />
      <rect x="62" y="86" width="80" height="10" rx="1" fill="currentColor" opacity="0.45" />
      <circle cx="54" cy="36" r="10" fill="currentColor" opacity="0.12" />
    </svg>
  )
}

/* ---------- поле вводу ---------- */

function Composer({ onText, onPhoto, onFile }: { onText: (t: string) => void; onPhoto: () => void; onFile: () => void }) {
  const [text, setText] = useState('')
  const [attach, setAttach] = useState(false)
  const submit = () => {
    const t = text.trim()
    if (!t) return
    onText(t)
    setText('')
  }
  return (
    <div className="flex shrink-0 items-end gap-2 border-t border-border bg-background px-3 pt-2.5 pb-4">
      <button
        type="button"
        aria-label="Прикрепить фото или файл"
        onClick={() => setAttach(true)}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground active:scale-95"
      >
        <Paperclip className="size-5" />
      </button>
      <textarea
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder="Сообщение"
        aria-label="Сообщение"
        className="max-h-28 min-h-11 flex-1 resize-none rounded-[22px] border border-border bg-background px-4 py-2.5 text-base outline-none placeholder:text-muted-foreground focus:border-primary"
      />
      <button
        type="button"
        aria-label="Отправить"
        onClick={submit}
        disabled={!text.trim()}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity active:scale-95 disabled:opacity-40"
      >
        <SendHorizontal className="size-5" />
      </button>
      <SourceSheet
        open={attach}
        onClose={() => setAttach(false)}
        title="Прикрепить"
        items={[
          {
            icon: Camera,
            title: 'Фото',
            sub: 'Снять или выбрать из галереи',
            onClick: () => {
              setAttach(false)
              onPhoto()
            },
          },
          {
            icon: FileText,
            title: 'Файл',
            sub: 'PDF, документ или изображение',
            onClick: () => {
              setAttach(false)
              onFile()
            },
          },
        ]}
      />
    </div>
  )
}

/* ---------- «Отправить CV» ---------- */

function CvSheet({ open, onClose, onSend, onProfile }: { open: boolean; onClose: () => void; onSend: (name: string) => void; onProfile: () => void }) {
  const me = useMe()
  const name = `CV ${me.name}.pdf`
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Отправить CV"
      description={`Соберём CV из вашего профиля и отправим PDF в этот чат.`}
      footer={
        <>
          <Button size="lg" onClick={() => onSend(name)}>
            Отправить CV
          </Button>
          <Button size="lg" variant="ghost" className="text-primary" onClick={onProfile}>
            Сначала проверить профиль
          </Button>
        </>
      }
    >
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-baseline justify-between bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          {name}
          <span className="font-mono text-xs font-normal opacity-80">2 стр.</span>
        </div>
        <ul className="flex flex-col gap-2 px-4 py-3 text-[15px]">
          {['Личные данные и должность', 'Опыт работы по контрактам', 'Дипломы и сертификаты', 'Медицинские документы'].map((s) => (
            <li key={s} className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-success" strokeWidth={2.5} />
              {s}
            </li>
          ))}
        </ul>
      </div>
    </BottomSheet>
  )
}

// Умовна сторінка документа для перегляду файлу: аркуш з шапкою й рядками тексту.
function DocPage({ name }: { name: string }) {
  return (
    <div className="mx-auto w-[86%] rounded-md bg-white p-5 text-left text-slate-900 shadow-lg">
      <p className="text-sm font-semibold">{name.replace(/\.pdf$/i, '')}</p>
      <div className="mt-3 h-px bg-slate-200" />
      <div className="mt-3 flex flex-col gap-2">
        {[92, 80, 88, 64, 90, 72, 84, 58, 86, 70].map((w, i) => (
          <span key={i} className="h-2 rounded-full bg-slate-200" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}
