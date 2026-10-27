import type { ComponentType, ReactNode } from 'react'
import { Briefcase, Check, Clock, Mail, MessageCircle } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'

// p10 — уведомления (C: notifScreen): приглашения, сроки документов, вакансии по поиску,
// ответы на комментарии, статусы откликов. Тап ведёт туда, где нужно действие, и отмечает прочитанным.
// Непрочитанные — отдельной группой «Новые», жирным текстом; без цветных точек.

type Notif = {
  id: string
  icon: ComponentType<{ className?: string }>
  tone: 'primary' | 'warning' | 'success'
  text: ReactNode
  time: string
  to: string
  /** для перехода к публикации */
  post?: string
  unread: boolean
}

const NOTIFS: Notif[] = [
  { id: 'inv', icon: Mail, tone: 'primary', text: <><b>BlueWave Crewing</b> приглашает вас на вакансию 3rd Engineer, Chemical Tanker</>, time: '15 мин', to: 'p03', unread: true },
  { id: 'med', icon: Clock, tone: 'warning', text: <><b>Медосмотр истекает через 20 дней.</b> Обновите документ, чтобы не терять предложения.</>, time: '2 ч', to: 'p02', unread: true },
  { id: 'jobs', icon: Briefcase, tone: 'primary', text: <>3 новые вакансии по вашему поиску «3rd Engineer, танкеры»</>, time: '5 ч', to: 'p05', unread: true },
  { id: 'reply', icon: MessageCircle, tone: 'primary', text: <><b>Марко Петров</b> ответил на ваш комментарий</>, time: 'вчера', to: 'p07', post: 'u1', unread: false },
  { id: 'seen', icon: Check, tone: 'success', text: <>Агентство <b>Nordline</b> просмотрело ваш отклик</>, time: '2 дня', to: 'p03', unread: false },
]

const TONE = { primary: 'text-primary', warning: 'text-warning', success: 'text-success' }

export function P10Notifications({ go }: ScreenProps) {
  const { bag, setBag } = useProto()
  const read = bag<Record<string, boolean>>('notif.read', {})
  const isNew = (n: Notif) => n.unread && !read[n.id]
  const fresh = NOTIFS.filter(isNew)
  const old = NOTIFS.filter((n) => !isNew(n))

  const open = (n: Notif) => {
    setBag('notif.read', { ...read, [n.id]: true })
    if (n.post) setBag('feed.post', n.post)
    go(n.to)
  }
  const readAll = () => setBag('notif.read', Object.fromEntries(NOTIFS.map((n) => [n.id, true])))

  return (
    <div className="flex h-full flex-col">
      <NavBar title="Уведомления" onBack={() => go('q09')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-6">
        {fresh.length > 0 && (
          <section>
            <div className="mb-2 flex items-baseline justify-between px-2">
              <h2 className="text-base font-semibold">
                Новые <span className="font-mono text-sm font-normal text-muted-foreground">{fresh.length}</span>
              </h2>
              <button type="button" onClick={readAll} className="text-sm font-medium text-primary">
                Прочитать все
              </button>
            </div>
            <List items={fresh} onOpen={open} unread />
          </section>
        )}
        <section className={cn(fresh.length > 0 && 'mt-6')}>
          <h2 className="mb-2 px-2 text-base font-semibold">Ранее</h2>
          <List items={old} onOpen={open} />
        </section>
      </div>
    </div>
  )
}

function List({ items, onOpen, unread }: { items: Notif[]; onOpen: (n: Notif) => void; unread?: boolean }) {
  return (
    <ul className="overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((n) => (
        <li key={n.id} className="border-t border-border first:border-t-0">
          <button type="button" onClick={() => onOpen(n)} className="flex w-full items-start gap-3 px-4 py-3.5 text-left">
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full bg-muted', TONE[n.tone])}>
              <n.icon className="size-[18px]" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className={cn('text-[15px] leading-snug [&_b]:font-semibold', unread ? 'text-foreground' : 'text-muted-foreground [&_b]:font-medium [&_b]:text-foreground')}>
                {n.text}
              </span>
              <span className="text-sm text-muted-foreground">{n.time}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
