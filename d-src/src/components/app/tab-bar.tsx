import { Briefcase, FileText, MessageSquare, Newspaper, UserRound } from 'lucide-react'
import { APP_COUNTS } from '@/lib/data'
import { MOBILE_ROUTES } from '@/lib/mobile-routes'
import { cn } from '@/lib/utils'
import { CountBadge } from './count-badge'

// Правка №16: Лента · Вакансии · Сообщения · Документы · Профиль; «Сообщения» — з лічильником.
export type Tab = 'feed' | 'vac' | 'msg' | 'docs' | 'profile'

const TABS: { id: Tab; label: string; icon: typeof Newspaper }[] = [
  { id: 'feed', label: 'Лента', icon: Newspaper },
  { id: 'vac', label: 'Вакансии', icon: Briefcase },
  { id: 'msg', label: 'Сообщения', icon: MessageSquare },
  { id: 'docs', label: 'Документы', icon: FileText },
  { id: 'profile', label: 'Профиль', icon: UserRound },
]

/** Куди веде кожна вкладка для моряка, що увійшов. */
export const TAB_SCREENS: Record<Tab, string> = {
  feed: MOBILE_ROUTES.feed,
  vac: MOBILE_ROUTES.jobs,
  msg: MOBILE_ROUTES.messages,
  docs: MOBILE_ROUTES.docs,
  profile: MOBILE_ROUTES.profile,
}

const DEFAULT_COUNTS: Partial<Record<Tab, number>> = { msg: APP_COUNTS.messages }

// Нижні вкладки застосунку. Активна — кольором primary, без крапок і підсвічування.
// Навігація: onTab(t) — свій обробник (напр. гість), або go — перехід на TAB_SCREENS[t] (активна вкладка нічого не робить).
// counts — лічильники; за замовчуванням «Сообщения»: APP_COUNTS.messages. Передайте {} — без лічильників.
export function TabBar({
  active,
  onTab,
  go,
  counts = DEFAULT_COUNTS,
}: {
  active: Tab
  onTab?: (t: Tab) => void
  go?: (id: string) => void
  counts?: Partial<Record<Tab, number>>
}) {
  const press = (t: Tab) => (onTab ? onTab(t) : t !== active && go?.(TAB_SCREENS[t]))
  return (
    <nav className="grid shrink-0 grid-cols-5 border-t border-border bg-surface pt-2">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => press(t.id)}
          aria-current={t.id === active ? 'page' : undefined}
          aria-label={counts[t.id] ? `${t.label}, непрочитанных: ${counts[t.id]}` : undefined}
          className={cn('relative flex flex-col items-center gap-1 py-1 text-[11px] font-medium', t.id === active ? 'text-primary' : 'text-muted-foreground')}
        >
          <t.icon className="size-6" strokeWidth={t.id === active ? 2 : 1.75} />
          <CountBadge n={counts[t.id]} />
          {t.label}
        </button>
      ))}
    </nav>
  )
}
