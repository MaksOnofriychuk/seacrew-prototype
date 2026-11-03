import { useEffect, useState, type ReactNode } from 'react'
import { Building2, Check, ChevronRight, CreditCard, FileText, ReceiptText, RotateCcw, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/web/data-table'
import { WebField, WebSelect } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { RECRUITER_NAV, WebShell } from '@/components/web/shell'
import { StatusDot, WebAvatar } from '@/components/web/status-badge'
import { NOTIFY_EVENTS, usePrefs, type Accent, type DensKind, type FontKind, type FullTheme, type Prefs, type SizeKind } from '@/components/web/web-prefs'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { useOpenLegal } from '../r3/pub-legal'
import { useR2 } from './_parts'

type Theme = 'system' | 'light' | 'dark'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'system', label: 'Как в системе' },
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
]

// Цвета-акценты: [светлая тема, тёмная] — те же, что в src/web-themes.css.
const ACCENTS: { id: Accent; label: string; c: [string, string] }[] = [
  { id: 'blue', label: 'Синий', c: ['#1F4E8C', '#6B9BEF'] },
  { id: 'emerald', label: 'Изумрудный', c: ['#047857', '#34D399'] },
  { id: 'amber', label: 'Янтарный', c: ['#B45309', '#F2B84B'] },
  { id: 'violet', label: 'Фиолетовый', c: ['#6D28D9', '#A78BFA'] },
  { id: 'coral', label: 'Коралловый', c: ['#C23B52', '#F58A94'] },
  { id: 'graphite', label: 'Графитовый', c: ['#334155', '#CBD5E1'] },
]

type Pal = { bg: string; side: string; line: string; accent: string }
const LIGHT: Pal = { bg: '#F3F6FA', side: '#FFFFFF', line: '#E3E8EF', accent: '#1F4E8C' }
const DARK: Pal = { bg: '#0B1220', side: '#121A2B', line: '#22304A', accent: '#6B9BEF' }

const FULL: { id: Exclude<FullTheme, 'none'>; label: string; text: string; dark: boolean; pal: Pal }[] = [
  { id: 'ocean', label: 'Океан', text: 'Глубокий синий, тёмная', dark: true, pal: { bg: '#06192E', side: '#0C2745', line: '#1B3C63', accent: '#4FB3E8' } },
  { id: 'night', label: 'Ночная вахта', text: 'Чёрная с янтарным', dark: true, pal: { bg: '#050505', side: '#121212', line: '#2A2A2A', accent: '#F2A33A' } },
  { id: 'deck', label: 'Палуба', text: 'Тёплая светлая', dark: false, pal: { bg: '#F6F1E7', side: '#FFFDF8', line: '#E3D9C3', accent: '#24586B' } },
]

const FONTS: { id: FontKind; label: string; sample: string; style: string }[] = [
  { id: 'inter', label: 'Inter', sample: 'Вахта 4 200 $', style: 'Inter, sans-serif' },
  { id: 'system', label: 'Системный', sample: 'Вахта 4 200 $', style: 'system-ui, sans-serif' },
  { id: 'digits', label: 'Цифры моноширинные', sample: 'Вахта 4 200 $', style: '"Inter Digits", Inter, sans-serif' },
]

const SIZES: [SizeKind, string][] = [['sm', 'Маленький'], ['md', 'Обычный'], ['lg', 'Крупный']]
const DENS: [DensKind, string][] = [['compact', 'Компактно'], ['normal', 'Обычно'], ['roomy', 'Просторно']]

const LANGS = [
  { value: 'ru', label: 'Русский' },
  { value: 'uk', label: 'Українська' },
  { value: 'en', label: 'English' },
]
const ZONES = [
  { value: 'auto', label: 'Автоматически' },
  { value: 'Europe/Kyiv', label: 'Киев (UTC+2)' },
  { value: 'Europe/Warsaw', label: 'Варшава (UTC+1)' },
  { value: 'Europe/London', label: 'Лондон (UTC+0)' },
  { value: 'Europe/Istanbul', label: 'Стамбул (UTC+3)' },
  { value: 'Asia/Dubai', label: 'Дубай (UTC+4)' },
  { value: 'Asia/Kolkata', label: 'Мумбаи (UTC+5:30)' },
  { value: 'Asia/Singapore', label: 'Сингапур (UTC+8)' },
  { value: 'Asia/Manila', label: 'Манила (UTC+8)' },
]
const DATE_FMTS = [
  { value: 'dmy', label: '05.12.2026' },
  { value: 'long', label: '5 декабря 2026' },
  { value: 'iso', label: '2026-12-05' },
  { value: 'mdy', label: '12/05/2026' },
]
const START_PAGES = RECRUITER_NAV.filter((n) => !n.group).map((n) => ({ value: n.id, label: n.label }))
const ROWS = ['10', '20', '50', '100'].map((n) => ({ value: n, label: `${n} строк` }))

// Тема прототипу живёт в адресе (t=dark) — меняем её так же, как панель.
function applyTheme(dark: boolean) {
  const [id, query = ''] = location.hash.replace(/^#/, '').split('?')
  const q = new URLSearchParams(query)
  if (dark) q.set('t', 'dark')
  else q.delete('t')
  const s = q.toString()
  location.hash = id + (s ? '?' + s : '')
}

const isDark = () => document.documentElement.classList.contains('dark')

const SAMPLE = [
  { id: 1, name: 'Андрей К.', initials: 'АК', job: '3rd Engineer', st: 'success' as const, stText: 'Метч' },
  { id: 2, name: 'Игорь М.', initials: 'ИМ', job: 'Chief Officer', st: 'warning' as const, stText: 'Ждёт' },
  { id: 3, name: 'Тарас Л.', initials: 'ТЛ', job: 'DPO', st: 'primary' as const, stText: 'Новый' },
]

// r-settings — оформление кабинета и рабочие привычки рекрутера. Всё применяется сразу ко всему кабинету
// (переменные на корне WebShell, src/web-themes.css) и сохраняется в bag 'rweb.prefs'.
export function RSettings({ go }: ScreenProps) {
  const r = useR2()
  const { prefs, set, reset } = usePrefs()
  const legal = useOpenLegal(go, 'r-settings')
  // Выбранная тема следит за настоящей темой страницы (её меняет и панель прототипа), поэтому читаем класс dark на <html>.
  const [dark, setDark] = useState(isDark)
  const [system, setSystem] = useState(false)
  useEffect(() => {
    setDark(isDark())
    const mo = new MutationObserver(() => setDark(isDark()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])
  const full = prefs.full !== 'none'
  const theme: Theme | null = full ? null : system ? 'system' : dark ? 'dark' : 'light'

  const pickTheme = (t: Theme) => {
    setSystem(t === 'system')
    if (full) set({ full: 'none' })
    applyTheme(t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
  }
  const pickFull = (t: (typeof FULL)[number]) => {
    if (prefs.full === t.id) return set({ full: 'none' })
    set({ full: t.id })
    setSystem(false)
    applyTheme(t.dark) // тёмные темы включают тёмный режим страницы, светлые — светлый
  }
  const notify = (id: (typeof NOTIFY_EVENTS)[number]['id'], ch: 'email' | 'cabinet', v: boolean) => set({ notify: { ...prefs.notify, [id]: { ...prefs.notify[id], [ch]: v } } })

  return (
    <WebShell variant="recruiter" active="r-settings" go={go}>
      <PageHeader
        title="Настройки"
        description="Вид кабинета и рабочие привычки. Изменения действуют сразу и сохраняются для любого браузера, где вы войдёте."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              reset()
              r.showToast('Настройки вида сброшены')
            }}
          >
            <RotateCcw /> Сбросить вид
          </Button>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-10">
        <div className="flex min-w-0 flex-col gap-9">
          <Group title="Тема">
            <div role="radiogroup" aria-label="Тема" className="grid grid-cols-3 gap-3">
              {THEMES.map((t) => (
                <Choice key={t.id} on={theme === t.id} onClick={() => pickTheme(t.id)}>
                  <ThemeSwatch kind={t.id} />
                  <span className="text-[15px] font-medium">{t.label}</span>
                </Choice>
              ))}
            </div>
          </Group>

          <Group title="Цвет акцента" note={full ? 'Сейчас выбрана готовая тема — у неё свои цвета.' : undefined}>
            <div role="radiogroup" aria-label="Цвет акцента" className={cn('flex flex-wrap gap-2', full && 'pointer-events-none opacity-50')}>
              {ACCENTS.map((a) => {
                const on = !full && prefs.accent === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => set({ accent: a.id })}
                    className={cn('flex h-10 items-center gap-2.5 rounded-full border bg-surface pr-4 pl-2 text-sm font-medium transition-colors', on ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/50')}
                  >
                    <span className="flex size-6 items-center justify-center rounded-full" style={{ background: a.c[dark ? 1 : 0] }}>
                      {on && <Check className="size-3.5" style={{ color: dark ? '#0B1220' : '#FFFFFF' }} />}
                    </span>
                    {a.label}
                  </button>
                )
              })}
            </div>
          </Group>

          <Group title="Готовые темы" note="Нажмите на выбранную ещё раз — вернётся обычная тема.">
            <div role="radiogroup" aria-label="Готовые темы" className="grid grid-cols-3 gap-3">
              {FULL.map((t) => (
                <Choice key={t.id} on={prefs.full === t.id} onClick={() => pickFull(t)}>
                  <MiniCabinet c={t.pal} className="h-16 w-full rounded-md border border-border" />
                  <span className="flex flex-col leading-tight">
                    <span className="text-[15px] font-medium">{t.label}</span>
                    <span className="text-sm text-muted-foreground">{t.text}</span>
                  </span>
                </Choice>
              ))}
            </div>
          </Group>

          <Group title="Текст и таблицы">
            <div className="flex flex-col gap-5">
              <div role="radiogroup" aria-label="Шрифт" className="grid grid-cols-3 gap-3">
                {FONTS.map((f) => (
                  <Choice key={f.id} on={prefs.font === f.id} onClick={() => set({ font: f.id })}>
                    <span className="text-[17px]" style={{ fontFamily: f.style }}>
                      {f.sample}
                    </span>
                    <span className="text-sm text-muted-foreground">{f.label}</span>
                  </Choice>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <WebField label="Размер шрифта">
                  <Segmented value={prefs.size} onChange={(size) => set({ size })} options={SIZES} />
                </WebField>
                <WebField label="Плотность таблиц">
                  <Segmented value={prefs.density} onChange={(density) => set({ density })} options={DENS} />
                </WebField>
              </div>
            </div>
          </Group>

          <Group title="Язык и время">
            <div className="grid grid-cols-3 gap-4">
              <WebField id="st-lang" label="Язык интерфейса">
                <WebSelect id="st-lang" value={prefs.lang} onChange={(lang) => set({ lang: lang as Prefs['lang'] })} options={LANGS} />
              </WebField>
              <WebField id="st-tz" label="Часовой пояс">
                <WebSelect id="st-tz" value={prefs.tz} onChange={(tz) => set({ tz })} options={ZONES} />
              </WebField>
              <WebField id="st-date" label="Формат даты">
                <WebSelect id="st-date" value={prefs.dateFmt} onChange={(dateFmt) => set({ dateFmt: dateFmt as Prefs['dateFmt'] })} options={DATE_FMTS} />
              </WebField>
            </div>
          </Group>

          <Group title="Работа в кабинете">
            <div className="grid grid-cols-2 gap-4">
              <WebField id="st-start" label="Что открывать после входа">
                <WebSelect id="st-start" value={prefs.start} onChange={(start) => set({ start })} options={START_PAGES} />
              </WebField>
              <WebField id="st-rows" label="Строк в списках по умолчанию">
                <WebSelect id="st-rows" value={prefs.rows} onChange={(rows) => set({ rows })} options={ROWS} />
              </WebField>
            </div>
          </Group>

          <Group title="Уведомления" note="Где сообщать о событиях: письмом на почту, в колокольчике кабинета или обоими способами.">
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="grid grid-cols-[minmax(0,1fr)_88px_104px] items-center border-b border-border px-5 py-2 text-sm text-muted-foreground">
                <span>Событие</span>
                <span className="text-center">Почта</span>
                <span className="text-center">В кабинете</span>
              </div>
              {NOTIFY_EVENTS.map((e) => (
                <div key={e.id} className="grid grid-cols-[minmax(0,1fr)_88px_104px] items-center border-t border-border px-5 py-2.5 first:border-t-0">
                  <span className="text-[15px]">{e.label}</span>
                  <span className="flex justify-center">
                    <Checkbox aria-label={`${e.label}: почта`} checked={prefs.notify[e.id].email} onCheckedChange={(v) => notify(e.id, 'email', v === true)} />
                  </span>
                  <span className="flex justify-center">
                    <Checkbox aria-label={`${e.label}: в кабинете`} checked={prefs.notify[e.id].cabinet} onCheckedChange={(v) => notify(e.id, 'cabinet', v === true)} />
                  </span>
                </div>
              ))}
            </div>
          </Group>

          <Group title="Компания">
            <LinkList
              items={[
                [() => go('r-org'), Building2, 'Организация', 'Профиль компании'],
                [() => go('r-team'), Users, 'Команда', 'Рекрутеры, роли и приглашения'],
                [() => go('r-verify'), ShieldCheck, 'Верификация', 'Уровни проверки компании'],
                [() => go('r-billing'), CreditCard, 'Тариф и оплата', 'План компании, места и способ оплаты'],
                [() => go('r-billing-history'), ReceiptText, 'Счета', 'Все счета и квитанции'],
              ]}
            />
          </Group>

          <Group title="Документы">
            <LinkList
              items={[
                [() => legal('terms'), FileText, 'Условия сервиса', 'Текст соглашения'],
                [() => legal('privacy'), FileText, 'Политика конфиденциальности', 'Какие данные собираем и кто их видит'],
              ]}
            />
          </Group>
        </div>

        <aside className="sticky top-0 flex flex-col gap-3" aria-label="Предпросмотр">
          <span className="text-sm text-muted-foreground">Так выглядит кабинет сейчас</span>
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2.5">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary text-[10px] font-semibold text-primary-foreground">NM</span>
              <span className="flex-1 truncate text-sm font-semibold">Nordmar Crewing</span>
              <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">Новая вакансия</span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div>
                <p className="text-base font-semibold">Отклики за неделю</p>
                <p className="text-sm text-muted-foreground">
                  Всего <span className="font-mono text-foreground">24</span>, новых <span className="font-mono text-primary">5</span>
                </p>
              </div>
              <DataTable
                ignoreView
                columns={[
                  {
                    key: 'who',
                    header: 'Моряк',
                    cell: (x) => (
                      <span className="flex items-center gap-2">
                        <WebAvatar initials={x.initials} size="sm" />
                        <span className="flex min-w-0 flex-col leading-tight">
                          <span className="truncate font-medium">{x.name}</span>
                          <span className="truncate text-xs text-muted-foreground">{x.job}</span>
                        </span>
                      </span>
                    ),
                  },
                  { key: 'st', header: 'Статус', width: '112px', cell: (x) => <StatusDot tone={x.st}>{x.stText}</StatusDot> },
                ]}
                rows={SAMPLE}
                rowKey={(x) => String(x.id)}
              />
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">Основная</span>
                <span className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium">Вторичная</span>
                <span className="text-sm font-medium text-primary">Ссылка</span>
                <span className="ml-auto flex gap-1.5" aria-hidden="true">
                  <span className="size-2.5 rounded-full bg-success" />
                  <span className="size-2.5 rounded-full bg-warning" />
                  <span className="size-2.5 rounded-full bg-signal" />
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Дата: <span className="font-mono text-foreground">{DATE_FMTS.find((d) => d.value === prefs.dateFmt)?.label}</span>, пояс: {ZONES.find((z) => z.value === prefs.tz)?.label}
          </p>
        </aside>
      </div>
    </WebShell>
  )
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div role="radiogroup" className="flex h-10 rounded-md border border-border bg-surface p-0.5">
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={v === value}
          onClick={() => onChange(v)}
          className={cn('flex-1 rounded-[9px] text-sm font-medium transition-colors', v === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function LinkList({ items }: { items: [() => void, typeof Building2, string, string][] }) {
  return (
    <ul className="overflow-hidden rounded-xl border border-border bg-surface">
      {items.map(([open, Icon, title, sub]) => (
        <li key={title} className="border-t border-border first:border-t-0">
          <button type="button" onClick={open} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted">
            <Icon className="size-5 shrink-0 text-primary" />
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="text-[15px] font-medium">{title}</span>
              <span className="text-sm text-muted-foreground">{sub}</span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  )
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {note && <span className="text-sm text-muted-foreground">{note}</span>}
      </div>
      {children}
    </section>
  )
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn('relative flex flex-col items-start gap-2 rounded-xl border bg-surface p-3.5 text-left transition-colors', on ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/50')}
    >
      {children}
      {on && (
        <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3.5" />
        </span>
      )}
    </button>
  )
}

// Миниатюра кабинета в заданных цветах.
function MiniCabinet({ c, className }: { c: Pal; className?: string }) {
  return (
    <span className={cn('flex overflow-hidden', className)} style={{ background: c.bg }}>
      <span className="flex w-1/3 flex-col gap-1 p-1.5" style={{ background: c.side, borderRight: `1px solid ${c.line}` }}>
        <span className="h-1 w-3/4 rounded-full" style={{ background: c.accent }} />
        <span className="h-1 w-2/3 rounded-full" style={{ background: c.line }} />
        <span className="h-1 w-2/3 rounded-full" style={{ background: c.line }} />
      </span>
      <span className="flex flex-1 flex-col gap-1 p-1.5">
        <span className="h-1.5 w-1/2 rounded-full" style={{ background: c.line }} />
        <span className="h-5 rounded-sm" style={{ background: c.side, border: `1px solid ${c.line}` }} />
      </span>
    </span>
  )
}

function ThemeSwatch({ kind }: { kind: Theme }) {
  return (
    <span className="flex h-16 w-full overflow-hidden rounded-md border border-border">
      {kind === 'system' ? (
        <>
          <MiniCabinet c={LIGHT} className="w-1/2" />
          <MiniCabinet c={DARK} className="w-1/2" />
        </>
      ) : (
        <MiniCabinet c={kind === 'dark' ? DARK : LIGHT} className="w-full" />
      )}
    </span>
  )
}
