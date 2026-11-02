import { useState, type ComponentType } from 'react'
import { Bell, Briefcase, Check, Clock, Heart, Mail, MessageCircle, MessageSquare, Settings, UserRound } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { JOBS } from '@/lib/data'
import { NOTIFS, OFFER, OFFER_CHAT, type AppNotif, type NotifKind } from '@/lib/data-messages'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { Rich, Segmented, hashParam } from './_parts'

// p10 — «Уведомления» (правка №22, строго як у замовника): дві вкладки.
// «Рабочие» — запити від рекрутерів: пропозицію моряк підтверджує однією кнопкою → у «Сообщениях» з'являється
// чат із цим рекрутером. Сюди ж — відповіді на відгуки, вакансії з підборок і строки документів (відп. 108).
// «Нерабочие» — реакції на публікації, лайки, відповіді на коментарі.

type TabId = 'work' | 'other'

const ICON: Record<NotifKind, { icon: ComponentType<{ className?: string }>; tone: string }> = {
  offer: { icon: Mail, tone: 'text-primary' },
  reply: { icon: MessageSquare, tone: 'text-primary' },
  confirmed: { icon: Check, tone: 'text-success' },
  jobs: { icon: Briefcase, tone: 'text-primary' },
  doc: { icon: Clock, tone: 'text-warning' },
  comment: { icon: MessageCircle, tone: 'text-primary' },
  like: { icon: Heart, tone: 'text-primary' },
}

export function P10Notifications({ go }: ScreenProps) {
  const { bag, setBag, set, showToast } = useProto()
  const [linked] = useState<TabId | null>(() => (hashParam('tab') === 'other' ? 'other' : null))
  const tab = bag<TabId>('notif.tab', linked ?? 'work')
  const read = bag<Record<string, boolean>>('notif.read', {})
  const offers = bag<string[]>('msg.offers', [])
  const accepted = offers.includes(OFFER.id)

  const isNew = (n: AppNotif) => n.unread && !read[n.id]
  const count = (t: TabId) => NOTIFS.filter((n) => n.tab === t && isNew(n)).length
  const items = NOTIFS.filter((n) => n.tab === tab && n.kind !== 'offer')
  const fresh = items.filter(isNew)
  const old = items.filter((n) => !isNew(n))

  const open = (n: AppNotif) => {
    setBag('notif.read', { ...read, [n.id]: true })
    if (n.post) setBag('feed.post', n.post)
    if (n.chat) setBag('chat.sel', n.chat)
    if (n.to) go(n.to)
  }
  const readAll = () => setBag('notif.read', { ...read, ...Object.fromEntries(NOTIFS.filter((n) => n.tab === tab).map((n) => [n.id, true])) })

  const accept = () => {
    setBag('msg.offers', [...offers, OFFER.id])
    setBag('notif.read', { ...read, [OFFER.id]: true })
    showToast(`Чат с ${OFFER_CHAT.org} — в «Сообщениях»`)
  }
  const openOfferChat = () => {
    setBag('chat.sel', OFFER_CHAT.id)
    go('m-chat')
  }
  const openOfferJob = () => {
    set({ job: OFFER.job })
    go('p08')
  }

  const showOffer = tab === 'work'
  const empty = !items.length && !showOffer

  return (
    <div className="flex h-full flex-col">
      <NavBar
        title="Уведомления"
        onBack={() => go('p01')}
        right={
          <button
            type="button"
            aria-label="Настройки уведомлений"
            onClick={() => {
              setBag('back.m-notif-settings', 'p10')
              go('m-notif-settings')
            }}
            className="flex size-11 items-center justify-center rounded-md text-primary active:scale-95"
          >
            <Settings className="size-[22px]" />
          </button>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-6">
        <Segmented
          label="Уведомления"
          value={tab}
          onChange={(t) => setBag('notif.tab', t)}
          items={[
            { id: 'work', label: 'Рабочие', n: count('work') },
            { id: 'other', label: 'Нерабочие', n: count('other') },
          ]}
        />
        <div className="mt-4">
          <ViewState
            empty={
              tab === 'work'
                ? {
                    icon: Bell,
                    title: 'Предложений пока нет',
                    text: 'Здесь появятся предложения рекрутеров и ответы на отклики. Чем полнее профиль, тем чаще рекрутеры вас находят.',
                    action: (
                      <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => go('p14')}>
                        <UserRound /> Открыть профиль
                      </Button>
                    ),
                  }
                : { icon: Heart, title: 'Пока тихо', text: 'Здесь появятся реакции и ответы на ваши публикации и комментарии.' }
            }
            loading={{ kind: 'list', rows: 5 }}
          >
            {empty ? null : (
              <>
                {showOffer && (
                  <section className="overflow-hidden rounded-xl border border-border bg-surface">
                    <div className="flex items-start gap-3 px-4 pt-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-primary">{OFFER_CHAT.person!.initials}</span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[15px] font-semibold">{OFFER_CHAT.person!.name}</span>
                        <span className="text-sm text-muted-foreground">{OFFER_CHAT.org}, предлагает работу</span>
                      </span>
                      <span className="flex flex-col items-end gap-0.5 text-sm">
                        <span className="font-mono text-xs text-muted-foreground">15 мин</span>
                        {!accepted && <span className="font-medium text-primary">новое</span>}
                      </span>
                    </div>
                    <p className="px-4 pt-3 text-[15px] leading-relaxed">{OFFER.text}</p>
                    <button type="button" onClick={openOfferJob} className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-baseline justify-between gap-3 rounded-md bg-muted px-3 py-2.5 text-left">
                      <span className="text-sm font-medium">
                        {JOBS[OFFER.job].t}, {JOBS[OFFER.job].ship}
                      </span>
                      <span className="shrink-0 text-sm font-medium text-primary">{JOBS[OFFER.job].sal}</span>
                    </button>
                    <div className="px-4 pt-4 pb-4">
                      {accepted ? (
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Check className="size-4 text-success" strokeWidth={2.5} /> Интерес подтверждён
                          </span>
                          <Button variant="outline" className="h-10 text-[15px] text-primary" onClick={openOfferChat}>
                            <MessageSquare /> Открыть чат
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button className="h-11 w-full text-[15px]" onClick={accept}>
                            Мне интересно
                          </Button>
                          <p className="mt-2 text-center text-sm text-muted-foreground">Откроется чат с рекрутером</p>
                        </>
                      )}
                    </div>
                  </section>
                )}
                {fresh.length > 0 && (
                  <section className={cn(showOffer && 'mt-6')}>
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
                {old.length > 0 && (
                  <section className={cn((showOffer || fresh.length > 0) && 'mt-6')}>
                    <h2 className="mb-2 px-2 text-base font-semibold">Ранее</h2>
                    <List items={old} onOpen={open} />
                  </section>
                )}
              </>
            )}
          </ViewState>
        </div>
      </div>
    </div>
  )
}

function List({ items, onOpen, unread }: { items: AppNotif[]; onOpen: (n: AppNotif) => void; unread?: boolean }) {
  return (
    <ul className="overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((n) => {
        const { icon: Icon, tone } = ICON[n.kind]
        return (
          <li key={n.id} className="border-t border-border first:border-t-0">
            <button type="button" onClick={() => onOpen(n)} className="flex w-full items-start gap-3 px-4 py-3.5 text-left active:bg-muted">
              <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full bg-muted', tone)}>
                <Icon className="size-[18px]" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className={cn('text-[15px] leading-snug [&_b]:font-semibold', unread ? 'text-foreground' : 'text-muted-foreground [&_b]:font-medium [&_b]:text-foreground')}>
                  <Rich text={n.text} />
                </span>
                <span className="text-sm text-muted-foreground">{n.time}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
