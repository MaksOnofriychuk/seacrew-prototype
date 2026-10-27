import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Bell, Bookmark, Briefcase, ChevronRight, Download, FileText, Globe, Inbox, Moon, ShieldCheck, Ship, UserRound } from 'lucide-react'
import { Wordmark } from '@/components/app/chrome'
import { TabBar, type Tab } from '@/components/app/tab-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { durShort, FORM_DEFAULTS, months, Note, readiness, ReadinessBlock, useToast, type QForm, useQ } from './_parts'
import type { Acct } from './q06'

// q09 — профіль після швидкої реєстрації (profileScreen у C). «Готовность к анкетам» рахуємо лише
// по полях, які найчастіше потрібні в анкетах. 100 % — додайте ?full=1 до адреси (у C — галочка в панелі).
const AVAIL: { text: string; variant: 'success' | 'outline'; cls?: string }[] = [
  // правка п. 8: «Готов выйти сразу» — першим
  { text: 'Готов выйти сразу', variant: 'success' },
  { text: 'Готов к контракту с 01.12', variant: 'success' },
  { text: 'В рейсе до 15.02', variant: 'outline', cls: 'border-primary text-primary' },
  { text: 'Не ищу работу', variant: 'outline', cls: 'text-muted-foreground' },
]

const TAB_TO: Record<Tab, string> = { feed: 'p01', vac: 'p05', docs: 'p02', profile: 'q09' }

export function Q09Profile({ go }: ScreenProps) {
  const { bag, setBag } = useQ()
  const [loading, setLoading] = useState(true)
  const { toast, toastNode } = useToast()
  const form = bag<{ v: QForm } | null>('q.form', null)?.v ?? FORM_DEFAULTS
  const email = bag<Acct>('q.acct', { email: '', pass: '', pass2: '' }).email || 'you@example.com'
  const avail = bag('q.avail', 0)
  const full = new URLSearchParams(location.hash.split('?')[1]).get('full') === '1'
  const r = readiness(full)
  const dark = document.documentElement.classList.contains('dark')

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 650)
    return () => window.clearTimeout(id)
  }, [])

  const first = String(form.first || '')
  const last = String(form.last || '')
  const name = `${first} ${last}`.trim() || 'Без имени'
  const initials = ((first[0] ?? '?') + (last[0] ?? '')).toUpperCase()
  const sea = durShort(months(String(form.per1)) + months(String(form.per2)))
  const a = AVAIL[avail % AVAIL.length]

  // Тема в D живе в адресі (#q09?t=dark) — перемикаємо її так само, як панель.
  const toggleTheme = () => {
    location.hash = dark ? '#q09' : '#q09?t=dark'
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex h-12 items-center">
          <Wordmark />
        </div>
        {loading ? (
          <Skeleton />
        ) : (
          <div className="screen-in">
            <div className="mt-4 flex items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xl font-semibold text-primary">{initials}</span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h1 className="flex items-center gap-1.5 text-[26px] leading-tight font-semibold tracking-tight">
                  <span className="truncate">{name}</span>
                  <ShieldCheck className="size-5 shrink-0 text-primary" aria-label="Документ моряка проверен" />
                </h1>
                <span className="text-[15px]">3rd Engineer, Chemical Tanker</span>
                <span className="truncate text-sm text-muted-foreground">{email}</span>
              </div>
            </div>
            <button type="button" onClick={() => setBag('q.avail', avail + 1)} aria-label={`Статус: ${a.text}. Изменить`} className="mt-4 flex">
              <Badge variant={a.variant} className={cn('h-8 gap-1.5 px-3 text-sm', a.cls)}>
                {a.text}
                <ChevronRight className="size-3.5" />
              </Badge>
            </button>

            <div className="mt-6">
              <ReadinessBlock pct={r.pct}>
                {r.pct === 100 ? (
                  <Note icon={ShieldCheck} className="bg-muted">
                    <span className="font-medium text-foreground">Профиль заполнен.</span> Данные готовы для анкет агентств.
                  </Note>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Считаем только данные, которые чаще всего нужны агентствам в анкетах.</p>
                    <Button variant="outline" className="mt-1 h-11 text-[15px] text-primary" onClick={() => go('s5')}>
                      Дополнить профиль
                    </Button>
                  </>
                )}
              </ReadinessBlock>
            </div>

            <Group title="Мой профиль">
              <Row icon={UserRound} title="Личные данные" onClick={() => go('s2')} />
              <Row icon={Ship} title="Морской стаж" value={<span className="font-mono">{sea}</span>} onClick={() => go('s6')} />
              <Row icon={Briefcase} title="Должность" value="3rd Engineer" />
              <Row icon={FileText} title="Моё CV" value="PDF" />
            </Group>
            <Group title="Работа">
              <Row icon={Bookmark} title="Сохранённые вакансии" value={<span className="font-mono">2</span>} onClick={() => go('p09')} />
              <Row icon={Bell} title="Уведомления" value={<Badge className="font-mono">3</Badge>} onClick={() => go('p10')} />
              <Row icon={Inbox} title="Входящие" value={<Badge className="font-mono">1</Badge>} onClick={() => go('p03')} />
            </Group>
            <Group title="Настройки">
              <Row icon={Globe} title="Язык" value="Русский" />
              <Row icon={Moon} title="Тема" value={dark ? 'Тёмная' : 'Светлая'} onClick={toggleTheme} />
              <Row icon={ShieldCheck} title="Согласия" onClick={() => go('q10')} />
              <Row icon={Download} title="Скачать мои данные" onClick={() => toast('Копию данных отправим на ваш email')} />
            </Group>
          </div>
        )}
      </div>
      <TabBar active="profile" onTab={(t) => go(TAB_TO[t])} />
      {toastNode}
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="flex flex-col rounded-xl border border-border bg-surface">{children}</div>
    </section>
  )
}

function Row({ icon: Icon, title, value, onClick }: { icon: ComponentType<{ className?: string }>; title: string; value?: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-13 items-center gap-3 border-t border-border px-4 py-3 text-left first:border-t-0">
      <Icon className="size-5 shrink-0 text-primary" />
      <span className="flex-1 text-[15px]">{title}</span>
      {value !== undefined && <span className="text-[15px] text-muted-foreground">{value}</span>}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

// Заглушка, поки профіль вантажиться (650 мс, як у C). Статична, без мерехтіння.
function Skeleton() {
  const bar = 'rounded-full bg-surface border border-border'
  return (
    <div className="mt-4 flex flex-col gap-4" aria-busy="true" aria-label="Загружаем профиль">
      <div className="flex items-center gap-4">
        <span className="size-16 rounded-full border border-border bg-surface" />
        <div className="flex flex-1 flex-col gap-2">
          <span className={cn(bar, 'h-5 w-3/5')} />
          <span className={cn(bar, 'h-3.5 w-2/5')} />
        </div>
      </div>
      <span className="h-36 rounded-xl border border-border bg-surface" />
      <span className="h-52 rounded-xl border border-border bg-surface" />
    </div>
  )
}
