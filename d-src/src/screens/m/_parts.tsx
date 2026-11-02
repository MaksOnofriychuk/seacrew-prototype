import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { JOBS } from '@/lib/data'
import { CHATS, OFFER, OFFER_CHAT, appliedChat, type Chat, type ChatMsg } from '@/lib/data-messages'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'

// Спільне для екранів етапу 6 (повідомлення, чат, анкета, сповіщення, меню, налаштування). Лише для теки m.
// Ключі bag: job.applied (відгуки з екрана вакансії), msg.offers (підтверджені пропозиції), chat.sel,
// chat.sent, chat.read, form.sent, notif.read, settings.*.

/* ---------- адреса ---------- */

export function hashParam(key: string) {
  return new URLSearchParams(location.hash.split('?')[1] ?? '').get(key)
}

/* ---------- тема ---------- */

// Тема в D живе в адресі (t=dark) — перемикаємо її так само, як панель; решту параметрів адреси лишаємо.
export function setTheme(dark: boolean) {
  const [id, query = ''] = location.hash.replace(/^#/, '').split('?')
  const q = new URLSearchParams(query)
  q.delete('v')
  if (dark) q.set('t', 'dark')
  else q.delete('t')
  const s = q.toString()
  location.hash = '#' + id + (s ? '?' + s : '')
}

// Клас .dark на <html> ставить App після рендера — стежимо за ним, щоб підписи не відставали.
export function useDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() => setDark(el.classList.contains('dark')))
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

/* ---------- чати ---------- */

const clock = () => new Date().toTimeString().slice(0, 5)

export function useChats() {
  const { bag, setBag } = useProto()
  const applied = bag<number[]>('job.applied', [])
  const offers = bag<string[]>('msg.offers', [])
  const sent = bag<Record<string, ChatMsg[]>>('chat.sent', {})
  const read = bag<Record<string, boolean>>('chat.read', {})

  const base: Chat[] = [...CHATS]
  // Відгук на вакансію зі списку → новий чат із заглушкою (правка №22). З BlueWave про цю вакансію чат уже є.
  for (const k of applied) {
    if (!JOBS[k] || base.some((c) => c.job === k)) continue
    base.unshift(appliedChat(k, JOBS[k].co, JOBS[k].lg))
  }
  // Підтвердив інтерес до пропозиції → чат з цим рекрутером (правка №22).
  if (offers.includes(OFFER.id)) {
    const i = base.findIndex((c) => c.job === OFFER_CHAT.job)
    if (i >= 0) base.splice(i, 1)
    base.unshift(OFFER_CHAT)
  }

  const list = base.map((c) => {
    const extra = sent[c.id] ?? []
    const last = extra.at(-1)
    return {
      ...c,
      messages: [...c.messages, ...extra],
      unread: read[c.id] ? 0 : c.unread,
      time: last && 'time' in last ? last.time : c.time,
    }
  })

  const get = (id: string) => list.find((c) => c.id === id)
  const markRead = (id: string) => !read[id] && setBag('chat.read', { ...read, [id]: true })
  const send = (id: string, msg: DistributiveOmit<Exclude<ChatMsg, { kind: 'day' }>, 'time'>) => setBag('chat.sent', { ...sent, [id]: [...(sent[id] ?? []), { ...msg, time: clock() } as ChatMsg] })
  const unreadTotal = list.reduce((s, c) => s + c.unread, 0)

  return { list, get, markRead, send, unreadTotal }
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/** Вибраний чат: ?c= в адресі, далі bag chat.sel, інакше перший. */
export function useSelectedChat(fixed?: string) {
  const { bag } = useProto()
  return fixed ?? hashParam('c') ?? bag<string>('chat.sel', 'bw')
}

export const EVENT_TEXT = {
  offer: 'Вы подтвердили интерес к предложению',
  applied: 'Вы откликнулись на вакансию',
  'form-sent': 'Анкета отправлена',
  'cv-sent': 'CV отправлено',
} as const

/** Короткий текст останнього повідомлення для списку чатів. */
export function preview(c: Chat): { text: string; mine: boolean } {
  const m = [...c.messages].reverse().find((x) => x.kind !== 'day')
  if (!m) return { text: '', mine: false }
  if (m.kind === 'event') return { text: m.event === 'applied' ? `${EVENT_TEXT.applied} ${JOBS[c.job].t}` : EVENT_TEXT[m.event], mine: false }
  const mine = m.from === 'me'
  const text = m.kind === 'text' ? m.text : m.kind === 'photo' ? 'Фото' : m.kind === 'file' ? m.name : m.kind === 'link' ? m.url : m.title
  return { text, mine }
}

/* ---------- дрібні елементи ---------- */

// Рекрутер: кружок з ініціалами, зелена крапка — онлайн. Без рекрутера — знак агентства.
export function ChatAvatar({ chat, size = 'md' }: { chat: Chat; size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'size-9 text-xs' : 'size-11 text-sm'
  return (
    <span className="relative shrink-0">
      {chat.person ? (
        <span className={cn('flex items-center justify-center rounded-full bg-muted font-semibold text-primary', box)}>{chat.person.initials}</span>
      ) : (
        <span className={cn('flex items-center justify-center rounded-md bg-muted font-semibold text-foreground', box)}>{chat.orgShort}</span>
      )}
      {chat.online && <span aria-label="онлайн" className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-surface bg-success" />}
    </span>
  )
}

// Група налаштувань: тихий заголовок над білим блоком з роздільниками (як у профілі q09).
export function SettingsGroup({ title, children, note, className }: { title?: string; children: ReactNode; note?: ReactNode; className?: string }) {
  return (
    <section className={cn('mt-7 first:mt-0', className)}>
      {title && <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground">{title}</h2>}
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">{children}</div>
      {note && <p className="mt-2 px-1 text-sm text-muted-foreground">{note}</p>}
    </section>
  )
}

export function SettingsRow({
  icon: Icon,
  title,
  sub,
  value,
  onClick,
  right,
  tone,
}: {
  icon?: ComponentType<{ className?: string }>
  title: ReactNode
  sub?: ReactNode
  value?: ReactNode
  onClick?: () => void
  /** свій елемент праворуч замість стрілки (перемикач) */
  right?: ReactNode
  tone?: 'signal'
}) {
  const body = (
    <>
      {Icon && <Icon className={cn('size-5 shrink-0', tone === 'signal' ? 'text-signal' : 'text-primary')} />}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('text-[15px]', tone === 'signal' && 'font-medium text-signal')}>{title}</span>
        {sub && <span className="text-sm text-muted-foreground">{sub}</span>}
      </span>
      {value !== undefined && <span className="shrink-0 text-[15px] text-muted-foreground">{value}</span>}
      {right ?? (onClick && tone !== 'signal' && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />)}
    </>
  )
  const cls = 'flex min-h-13 w-full items-center gap-3 border-t border-border px-4 py-3 text-left first:border-t-0'
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
}

// Перемикач вкладок (як у колишніх «Входящих»): дві рівні кнопки з лічильником.
export function Segmented<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; n?: number }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="grid grid-cols-2 gap-1 rounded-md border border-border bg-surface p-1">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            'flex h-9 items-center justify-center gap-1.5 rounded-[9px] border text-[15px] font-medium transition-colors',
            value === it.id ? 'border-primary bg-muted text-primary' : 'border-transparent text-foreground',
          )}
        >
          {it.label}
          {!!it.n && <span className="font-mono text-sm text-muted-foreground">{it.n}</span>}
        </button>
      ))}
    </div>
  )
}

/** **жирне** у тексті сповіщення → <b>. */
export function Rich({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*)/).map((p, i) => (p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>))}</>
}
