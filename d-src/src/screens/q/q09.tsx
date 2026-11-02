import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Bell, Bookmark, Briefcase, ChevronRight, Download, FileText, Globe, Inbox, Moon, ShieldCheck, Ship, UserRound } from 'lucide-react'
import { Wordmark } from '@/components/app/chrome'
import { TabBar } from '@/components/app/tab-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AvailabilityButton, AvailabilitySheet } from '@/components/app/availability'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { VOYAGES, vMonths, type Voyage } from '../s/_core-voyage'
import { durText, FORM_DEFAULTS, Note, readiness, ReadinessBlock, useToast, type QForm, useQ } from './_parts'
import { MonoNums } from '../p/_app-parts'
import type { Acct } from './q06'

// q09 — профіль після швидкої реєстрації (profileScreen у C). «Готовность к анкетам» рахуємо лише
// по полях, які найчастіше потрібні в анкетах. 100 % — додайте ?full=1 до адреси (у C — галочка в панелі).
// Статус доступності — спільні AvailabilityButton / AvailabilitySheet (правки №1, №15, №19, №20).
// Не плашка, а тихий рядок з іконкою: плашки лишаємо для строків документів.


export function Q09Profile({ go }: ScreenProps) {
  const { bag } = useQ()
  const [loading, setLoading] = useState(true)
  const { toast, toastNode } = useToast()
  const form = bag<{ v: QForm } | null>('q.form', null)?.v ?? FORM_DEFAULTS
  const email = bag<Acct>('q.acct', { email: '', pass: '', pass2: '' }).email || 'you@example.com'
  const [availOpen, setAvailOpen] = useState(false)
  const full = new URLSearchParams(location.hash.split('?')[1]).get('full') === '1'
  // Медичні, введені на кроці s5, теж рахуються — тоді профіль заповнено на 100 %.
  const r = readiness(full || bag<unknown[]>('s5.docs', []).length > 0)
  const savedN = bag<number[]>('saved.jobs', [0, 3]).length + bag<string[]>('saved.posts', []).length
  const dark = document.documentElement.classList.contains('dark')

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 650)
    return () => window.clearTimeout(id)
  }, [])

  const first = String(form.first || '')
  const last = String(form.last || '')
  const name = `${first} ${last}`.trim() || 'Без имени'
  const initials = ((first[0] ?? '?') + (last[0] ?? '')).toUpperCase()
  // Стаж — з тих самих рейсів, що на кроці «Морской стаж» (s6): одна цифра скрізь.
  const sea = durText(bag<Voyage[]>('s6.voyages', VOYAGES).reduce((s, v) => s + vMonths(v), 0))

  // Тема в D живе в адресі (#q09?t=dark) — перемикаємо її так само, як панель. Той самий екран і як p14.
  const toggleTheme = () => {
    const id = location.hash.replace(/^#/, '').split('?')[0] || 'q09'
    location.hash = dark ? `#${id}` : `#${id}?t=dark`
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
            <AvailabilityButton onClick={() => setAvailOpen(true)} className="mt-4" />

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
              <Row icon={Ship} title="Морской стаж" value={<MonoNums text={sea} />} onClick={() => go('s6')} />
              <Row icon={Briefcase} title="Должность" value="3rd Engineer" />
              <Row icon={FileText} title="Моё CV" value="PDF" />
            </Group>
            <Group title="Работа">
              <Row icon={Bookmark} title="Сохранённое" value={<span className="font-mono">{savedN}</span>} onClick={() => go('p09')} />
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
      <TabBar active="profile" go={go} />
      {toastNode}
      <AvailabilitySheet open={availOpen} onClose={() => setAvailOpen(false)} />
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
