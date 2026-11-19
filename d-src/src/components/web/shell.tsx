import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
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
import { A_USERS } from '@/lib/data-admin'
import { Wordmark } from '@/components/app/chrome'
import { ADMIN_ORGS, ME_ADMIN, ME_RECRUITER, RECRUITER_ORG, RECRUITER_ROLE_LABEL } from '@/lib/data-web'
import { usePhonePortal } from '@/lib/phone-portal'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { useNavCounts, type NavCountKey } from './nav-counts'
import { DescriptionAsTip } from './info-tip'
import { useOutside } from './web-pickers'
import { WebAvatar } from './status-badge'
import { themeAttrs, usePrefs } from './web-prefs'

// Каркас вебу: ліва навігація, верхня панель (організація, пошук, користувач), область контенту.
// Два варіанти: кабінет рекрутера і адмінка. Пункт навігації веде на екран з тим самим id (go(item.id)) —
// тож екран-список розділу реєструйте саме з цим id (напр. 'r-jobs'), інакше пункт нічого не робить.

export type NavItem = {
  /** id екрана, на який веде пункт */
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  count?: number
  /** счётчик считается из данных (см. nav-counts.ts) */
  countKey?: NavCountKey
  /** заголовок групи пунктів (показується над першим пунктом групи) */
  group?: string
}

export const RECRUITER_NAV: NavItem[] = [
  { id: 'r-search', label: 'Поиск моряков', icon: Search },
  { id: 'r-candidates', label: 'Кандидаты', icon: Users },
  { id: 'r-invitations', label: 'Приглашения', icon: Send, countKey: 'invitations' },
  { id: 'r-jobs', label: 'Вакансии', icon: Briefcase },
  { id: 'r-applications', label: 'Отклики', icon: Inbox, countKey: 'applications' },
  { id: 'r-messages', label: 'Сообщения', icon: MessageSquare, countKey: 'messages' },
  { id: 'r-forms', label: 'Анкеты', icon: FileText },
  { id: 'r-org', label: 'Организация', icon: Building2, group: 'Компания' },
  { id: 'r-team', label: 'Команда', icon: Users, group: 'Компания' },
  { id: 'r-billing', label: 'Тариф и оплата', icon: CreditCard, group: 'Компания' },
  { id: 'r-settings', label: 'Настройки', icon: Settings, group: 'Компания' },
]

export const ADMIN_NAV: NavItem[] = [
  { id: 'a-orgs', label: 'Организации', icon: Building2, countKey: 'orgs', group: 'Модерация' },
  { id: 'a2-verify', label: 'Верификация', icon: ShieldCheck, countKey: 'verify', group: 'Модерация' },
  { id: 'a-users', label: 'Пользователи', icon: Users, countKey: 'users', group: 'Модерация' },
  { id: 'a-registrations', label: 'Регистрации', icon: UserX, group: 'Модерация' },
  { id: 'a-jobs', label: 'Вакансии', icon: Briefcase, countKey: 'jobs', group: 'Модерация' },
  { id: 'a-posts', label: 'Публикации', icon: Newspaper, countKey: 'posts', group: 'Модерация' },
  { id: 'a2-reports', label: 'Жалобы', icon: Flag, countKey: 'reports', group: 'Модерация' },
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

/** Круглая плашка со счётчиком; больше 99 — «99+», ноль не показываем. */
export function CountBadge({ n }: { n?: number }) {
  if (!n) return null
  return (
    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-xs text-primary-foreground" aria-label={`${n}`}>
      {n > 99 ? '99+' : n}
    </span>
  )
}

const contains = (hay: string, q: string) => hay.toLowerCase().includes(q.toLowerCase())

/** Поиск в шапке. Рекрутер: Enter открывает «Поиск моряков» с запросом. Админ: по мере ввода выпадает список
 * «Компании / Пользователи», тап по строке открывает карточку, Enter — список с применённым запросом. */
function HeaderSearch({ recruiter, placeholder, go }: { recruiter: boolean; placeholder?: string; go: (id: string) => void }) {
  const { setBag } = useProto()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const ref = useOutside(open, close)
  const needle = q.trim()
  const orgs = !recruiter && needle ? ADMIN_ORGS.filter((o) => contains(`${o.name} ${o.country}`, needle)) : []
  const users = !recruiter && needle ? A_USERS.filter((u) => contains(`${u.name} ${u.email}`, needle)) : []

  const submit = () => {
    if (!needle) return
    setBag('shell.q', needle)
    setQ('')
    close()
    go(recruiter ? 'r-search' : !orgs.length && users.length ? 'a-users' : 'a-orgs')
  }
  const row = (key: string, title: string, sub: string, onClick: () => void) => (
    <button key={key} type="button" onClick={onClick} className="flex w-full flex-col rounded-md px-3 py-1.5 text-left leading-tight hover:bg-muted">
      <span className="truncate text-sm font-medium">{title}</span>
      <span className="truncate text-xs text-muted-foreground">{sub}</span>
    </button>
  )
  const pick = (bagKey: string, id: string, screen: string) => {
    setBag(bagKey, id)
    setQ('')
    close()
    go(screen)
  }
  const group = (title: string, total: number, rows: ReactNode[], list: string) => (
    <div className="flex flex-col py-1">
      <div className="flex items-center justify-between px-3 pt-1 pb-0.5 text-xs font-medium text-muted-foreground">
        <span>{title}</span>
        {total > rows.length && (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => {
              setBag('shell.q', needle)
              setQ('')
              close()
              go(list)
            }}
          >
            Все: {total}
          </button>
        )}
      </div>
      {rows}
    </div>
  )

  return (
    <div ref={ref} className="relative ml-auto">
      <label className="flex h-10 w-[380px] items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-primary">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          placeholder={placeholder ?? (recruiter ? 'Поиск по морякам, вакансиям, сообщениям' : 'Поиск по организациям и пользователям')}
          aria-label="Поиск"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
      {!recruiter && open && needle && (
        <div role="dialog" aria-label="Результаты поиска" className="absolute top-full right-0 z-50 mt-2 w-[420px] rounded-lg border border-border bg-surface p-1.5 shadow-lg animate-in fade-in-0 duration-150 motion-reduce:animate-none">
          {!orgs.length && !users.length && <p className="px-3 py-3 text-sm text-muted-foreground">Ничего не нашлось. Проверьте написание.</p>}
          {!!orgs.length &&
            group(
              'Компании',
              orgs.length,
              orgs.slice(0, 4).map((o) => row(o.id, o.name, o.country, () => pick('a.org', o.id, 'a-org'))),
              'a-orgs',
            )}
          {!!users.length &&
            group(
              'Пользователи',
              users.length,
              users.slice(0, 4).map((u) => row(u.id, u.name, u.position ? `${u.email}, ${u.position}` : u.email, () => pick('a.user', u.id, 'a-user'))),
              'a-users',
            )}
        </div>
      )}
    </div>
  )
}

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
  const counts = useNavCounts()
  // Оформление кабинета рекрутера (Настройки): data-атрибуты на корне и на контейнере окон внутри рамки браузера.
  const { prefs } = usePrefs()
  const attrs = recruiter ? themeAttrs(prefs) : {}
  const attrKey = JSON.stringify(attrs)
  const portal = usePhonePortal()
  useEffect(() => {
    if (!portal) return
    const set = Object.entries(JSON.parse(attrKey) as Record<string, string>)
    set.forEach(([k, v]) => portal.setAttribute(k, v))
    return () => set.forEach(([k]) => portal.removeAttribute(k))
  }, [portal, attrKey])
  const [bell, setBell] = useState(false)
  const bellRef = useOutside(bell, () => setBell(false))
  const news = recruiter
    ? [
        { id: 'r-applications', text: 'Новый отклик на вакансию 3rd Engineer', time: 'сегодня' },
        { id: 'r-invitations', text: 'Моряк принял приглашение', time: 'вчера' },
        { id: 'r-messages', text: 'Новое сообщение в диалоге', time: 'вчера' },
      ]
    : [
        { id: 'a-orgs', text: 'Новая организация ждёт проверки', time: 'сегодня' },
        { id: 'a2-reports', text: 'Новая жалоба на публикацию', time: 'вчера' },
      ]

  return (
    <div className="flex h-full min-h-0 bg-background text-foreground" {...attrs}>
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
                <CountBadge n={it.countKey ? counts[it.countKey] : it.count} />
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
          <HeaderSearch recruiter={recruiter} placeholder={searchPlaceholder} go={go} />
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
        <main className={cn('min-h-0 flex-1 overflow-y-auto bg-background px-8 py-8', className)}>
          <DescriptionAsTip.Provider value={recruiter}>{children}</DescriptionAsTip.Provider>
        </main>
      </div>
    </div>
  )
}
