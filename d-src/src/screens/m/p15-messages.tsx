import { Briefcase, MessageSquare } from 'lucide-react'
import { TabBar } from '@/components/app/tab-bar'
import { useView, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { FJ_JOBS as JOBS } from '@/lib/data-feed-jobs'
import { MOBILE_ROUTES } from '@/lib/mobile-routes'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { OfflineBanner, TabHead, useOffline } from '../p/_app-parts'
import { ChatAvatar, preview, useChats } from './_parts'

// p15 — «Сообщения» (правки №16, №22): лише чати з рекрутерами.
// Чат з'являється, коли моряк підтвердив інтерес до пропозиції або відгукнувся на вакансію.
// Непрочитані — жирним і з лічильником; зелена крапка — рекрутер онлайн.

export function P15Messages({ go }: ScreenProps) {
  const { setBag } = useProto()
  const { list, unreadTotal } = useChats()
  const view = useView()
  const offline = useOffline()

  const open = (id: string) => {
    setBag('chat.sel', id)
    go('m-chat')
  }

  // Без мережі (стан «Ошибка» / сценарій «Нет интернета») — збережені чати і плашка (відповідь 21).
  const chats = (
    <>
    <ul className="overflow-hidden rounded-xl border border-border bg-surface">
      {list.map((c) => {
        const p = preview(c)
        const unread = c.unread > 0
        const j = JOBS[c.job]
        return (
          <li key={c.id} className="border-t border-border first:border-t-0">
            <button type="button" onClick={() => open(c.id)} className="flex w-full items-start gap-3 px-4 py-3.5 text-left active:bg-muted">
              <ChatAvatar chat={c} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-baseline justify-between gap-3">
                  <span className={cn('truncate text-[15px]', unread ? 'font-semibold' : 'font-medium')}>{c.person?.name ?? c.org}</span>
                  <span className={cn('shrink-0 text-xs', /\d/.test(c.time) && 'font-mono', unread ? 'text-primary' : 'text-muted-foreground')}>{c.time}</span>
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {c.person ? `${c.org}, ` : ''}
                  {j.t}
                </span>
                <span className="mt-0.5 flex items-center gap-3">
                  <span className={cn('line-clamp-1 flex-1 text-sm', unread ? 'text-foreground' : 'text-muted-foreground')}>
                    {p.mine && <span className="text-muted-foreground">Вы: </span>}
                    {p.text}
                  </span>
                  {unread && (
                    <span
                      aria-label={`непрочитанных: ${c.unread}`}
                      className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[11px] font-medium text-primary-foreground"
                    >
                      {c.unread}
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
    </>
  )

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <TabHead title="Сообщения" onMenu={() => go('p04')} go={go} here="p15" />
        <div className="px-4 pt-4">
          {offline && <OfflineBanner className="mb-3" />}
          <ViewState
            empty={{
              icon: MessageSquare,
              title: 'Переписки пока нет',
              text: 'Чат с рекрутером появится, когда вы откликнетесь на вакансию или подтвердите интерес к предложению.',
              action: (
                <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => go(MOBILE_ROUTES.jobs)}>
                  <Briefcase /> Смотреть вакансии
                </Button>
              ),
            }}
            loading={{ kind: 'list', rows: 4 }}
            error={chats}
          >
            {chats}
          </ViewState>
        </div>
      </div>
      <TabBar active="msg" go={go} counts={{ msg: view === 'normal' || view === 'error' ? unreadTotal : 0 }} />
    </div>
  )
}
