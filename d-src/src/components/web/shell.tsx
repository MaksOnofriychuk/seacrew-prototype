import { useState, type ComponentType, type ReactNode } from 'react'
import {
  BadgeCheck,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Coins,
  CreditCard,
  Crown,
  Cpu,
  Database,
  FileText,
  Flag,
  FlaskConical,
  Inbox,
  Layers,
  MessageSquare,
  Newspaper,
  Receipt,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Ticket,
  UserX,
  Users,
} from 'lucide-react'
import { Wordmark } from '@/components/app/chrome'
import { ADMIN_COUNTS } from '@/lib/data-admin'
import { ME_ADMIN, ME_RECRUITER, RECRUITER_COUNTS, RECRUITER_ORG, RECRUITER_ROLE_LABEL } from '@/lib/data-web'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { useOutside } from './web-pickers'
import { WebAvatar } from './status-badge'

// Каркас вебу: ліва навігація, верхня панель (організація, пошук, користувач), область контенту.
// Два варіанти: кабінет рекрутера і адмінка. Пункт навігації веде на екран з тим самим id (go(item.id)) —
// тож екран-список розділу реєструйте саме з цим id (напр. 'r-jobs'), інакше пункт нічого не робить.

export type NavItem = {
  /** id екрана, на який веде пункт */
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  count?: number
  /** заголовок групи пунктів (показується над першим пунктом групи) */
  group?: string
}

export const RECRUITER_NAV: NavItem[] = [
  { id: 'r-search', label: 'Поиск моряков', icon: Search },
  { id: 'r-candidates', label: 'Кандидаты', icon: Users },
  { id: 'r-invitations', label: 'Приглашения', icon: Send, count: RECRUITER_COUNTS.invitations },
  { id: 'r-jobs', label: 'Вакансии', icon: Briefcase },
  { id: 'r-applications', label: 'Отклики', icon: Inbox, count: RECRUITER_COUNTS.applications },
  { id: 'r-messages', label: 'Сообщения', icon: MessageSquare, count: RECRUITER_COUNTS.messages },
  { id: 'r-forms', label: 'Анкеты', icon: FileText },
  { id: 'r-org', label: 'Организация', icon: Building2, group: 'Компания' },
  { id: 'r-team', label: 'Команда', icon: Users, group: 'Компания' },
  { id: 'r-billing', label: 'Тариф и оплата', icon: CreditCard, group: 'Компания' },
  { id: 'r-settings', label: 'Настройки', icon: Settings, group: 'Компания' },
]

export const ADMIN_NAV: NavItem[] = [
  { id: 'a-orgs', label: 'Организации', icon: Building2, count: ADMIN_COUNTS.orgs, group: 'Модерация' },
  { id: 'a2-verify', label: 'Верификация', icon: ShieldCheck, count: 3, group: 'Модерация' },
  { id: 'a-users', label: 'Пользователи', icon: Users, count: ADMIN_COUNTS.users, group: 'Модерация' },
  { id: 'a-registrations', label: 'Регистрации', icon: UserX, group: 'Модерация' },
  { id: 'a-jobs', label: 'Вакансии', icon: Briefcase, group: 'Модерация' },
  { id: 'a-posts', label: 'Публикации', icon: Newspaper, group: 'Модерация' },
  { id: 'a2-reports', label: 'Жалобы', icon: Flag, count: 4, group: 'Модерация' },
  { id: 'a2-subs', label: 'Подписки', icon: Crown, group: 'Деньги' },
  { id: 'a2-payments', label: 'Платежи', icon: Receipt, group: 'Деньги' },
  { id: 'a2-promo', label: 'Промокоды', icon: Ticket, group: 'Деньги' },
  { id: 'a2-plans', label: 'Тарифы компаний', icon: Layers, group: 'Деньги' },
  { id: 'a-refs', label: 'Справочники', icon: BookOpen, group: 'Данные' },
  { id: 'a-fields', label: 'Каталог полей', icon: Database, group: 'Данные' },
  { id: 'a2-content', label: 'Тексты и рассылки', icon: FileText, group: 'Данные' },
  { id: 'a-engines', label: 'Движки распознавания', icon: Cpu, group: 'ИИ' },
  { id: 'a-usage', label: 'Расходы ИИ', icon: Coins, group: 'ИИ' },
  { id: 'a-lab', label: 'Лаборатория', icon: FlaskConical, group: 'ИИ' },
]

export function WebShell({
  variant,
  active,
  go,
  nav,
  searchPlaceholder,
  children,
  className,
}: {
  variant: 'recruiter' | 'admin'
  /** id активного пункту (для екрана-деталі — id його розділу, напр. 'r-candidates') */
  active: string
  go: (id: string) => void
  /** свій список пунктів; за замовчуванням RECRUITER_NAV / ADMIN_NAV */
  nav?: NavItem[]
  searchPlaceholder?: string
  children: ReactNode
  /** класи області контенту (за замовчуванням — відступи 32 px і прокрутка) */
  className?: string
}) {
  const items = nav ?? (variant === 'recruiter' ? RECRUITER_NAV : ADMIN_NAV)
  const recruiter = variant === 'recruiter'
  const { setBag } = useProto()
  const [q, setQ] = useState('')
  const [bell, setBell] = useState(false)
  const bellRef = useOutside(bell, () => setBell(false))
  const news = recruiter
    ? [
        { id: 'r-applications', text: 'Новый отклик на вакансию 3rd Engineer', time: 'сегодня' },
        { id: 'r-invitations', text: 'Моряк принял приглашение', time: 'вчера' },
        { id: 'r-messages', text: 'Новое сообщение в разговоре', time: 'вчера' },
      ]
    : [
        { id: 'a-orgs', text: 'Новая организация ждёт проверки', time: 'сегодня' },
        { id: 'a2-reports', text: 'Новая жалоба на публикацию', time: 'вчера' },
      ]

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex h-16 shrink-0 items-center gap-2 px-6">
          <Wordmark />
          <span className="text-sm text-muted-foreground">{recruiter ? 'для агентств' : 'админ'}</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4" aria-label="Разделы">
          {items.map((it, i) => (
            <div key={it.id} className="flex flex-col">
              {it.group && it.group !== items[i - 1]?.group && <span className="mt-4 mb-1 px-3 text-xs font-medium text-muted-foreground">{it.group}</span>}
              <button
                type="button"
                onClick={() => go(it.id)}
                aria-current={it.id === active ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors',
                  it.id === active ? 'bg-muted text-primary' : 'text-foreground hover:bg-muted',
                )}
              >
                <it.icon className={cn('size-4.5 shrink-0', it.id === active ? 'text-primary' : 'text-muted-foreground')} />
                <span className="flex-1 truncate">{it.label}</span>
                {!!it.count && <span className="rounded-full bg-primary px-1.5 font-mono text-xs leading-5 text-primary-foreground">{it.count}</span>}
              </button>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-6 border-b border-border bg-surface px-8">
          {recruiter ? (
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">{RECRUITER_ORG.short}</span>
              <span className="truncate text-[15px] font-semibold">{RECRUITER_ORG.name}</span>
              {RECRUITER_ORG.verified && <BadgeCheck className="size-4 shrink-0 text-success" aria-label="Организация проверена" />}
            </div>
          ) : (
            <span className="text-[15px] font-semibold">Администрирование</span>
          )}
          <label className="ml-auto flex h-10 w-[380px] items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-primary">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              placeholder={searchPlaceholder ?? (recruiter ? 'Поиск по морякам, вакансиям, сообщениям' : 'Поиск по организациям и пользователям')}
              aria-label="Поиск"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || !q.trim()) return
                // Верхняя строка ищет там, где живёт список: у рекрутера — среди моряков, у администратора — среди организаций.
                setBag('shell.q', q.trim())
                setQ('')
                go(recruiter ? 'r-search' : 'a-orgs')
              }}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div ref={bellRef} className="relative">
            <button type="button" aria-label="Уведомления" aria-expanded={bell} onClick={() => setBell(!bell)} className={cn('flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted', bell && 'bg-muted')}>
              <Bell className="size-5" />
            </button>
            {bell && (
              <div role="dialog" aria-label="Уведомления" className="absolute top-full right-0 z-50 mt-2 w-[340px] rounded-lg border border-border bg-surface p-1.5 shadow-lg animate-in fade-in-0 duration-150 motion-reduce:animate-none">
                <p className="px-3 pt-2 pb-1 text-sm font-semibold">Уведомления</p>
                {news.map((n) => (
                  <button
                    key={n.text}
                    type="button"
                    onClick={() => {
                      setBell(false)
                      go(n.id)
                    }}
                    className="flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left hover:bg-muted"
                  >
                    <span className="text-sm">{n.text}</span>
                    <span className="text-xs text-muted-foreground">{n.time}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <WebAvatar initials={recruiter ? ME_RECRUITER.initials : ME_ADMIN.initials} />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-medium">{recruiter ? ME_RECRUITER.name : ME_ADMIN.name}</span>
              <span className="text-xs text-muted-foreground">{recruiter ? RECRUITER_ROLE_LABEL[ME_RECRUITER.role] : 'Администратор'}</span>
            </span>
          </div>
        </header>
        <main className={cn('min-h-0 flex-1 overflow-y-auto bg-background px-8 py-8', className)}>{children}</main>
      </div>
    </div>
  )
}
