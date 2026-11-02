import { useEffect, useState, type ReactNode } from 'react'
import { Check, ChevronRight, CreditCard, ReceiptText } from 'lucide-react'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { useR2 } from './_parts'

type Lang = 'ru' | 'uk' | 'en'
type Theme = 'system' | 'light' | 'dark'

const LANGS: { id: Lang; label: string; native: string }[] = [
  { id: 'ru', label: 'Русский', native: 'Интерфейс на русском' },
  { id: 'uk', label: 'Українська', native: 'Інтерфейс українською' },
  { id: 'en', label: 'English', native: 'Interface in English' },
]

const THEMES: { id: Theme; label: string }[] = [
  { id: 'system', label: 'Как в системе' },
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
]

// Тема прототипу живе в адресі (t=dark) — міняємо її так само, як панель.
function applyTheme(dark: boolean) {
  const [id, query = ''] = location.hash.replace(/^#/, '').split('?')
  const q = new URLSearchParams(query)
  if (dark) q.set('t', 'dark')
  else q.delete('t')
  const s = q.toString()
  location.hash = id + (s ? '?' + s : '')
}

const isDark = () => document.documentElement.classList.contains('dark')

// r-settings — налаштування вигляду кабінету: мова і тема (ADR-070, apps/web /settings).
export function RSettings({ go }: ScreenProps) {
  const r = useR2()
  const [lang, setLang] = useState<Lang>('ru')
  // Вибрана тема стежить за справжньою темою сторінки (її міняє й панель прототипу), тому читаємо клас dark на <html>.
  const [dark, setDark] = useState(isDark)
  const [system, setSystem] = useState(false)
  useEffect(() => {
    setDark(isDark())
    const mo = new MutationObserver(() => setDark(isDark()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])
  const theme: Theme = system ? 'system' : dark ? 'dark' : 'light'

  const pickTheme = (t: Theme) => {
    setSystem(t === 'system')
    applyTheme(t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
  }

  return (
    <WebShell variant="recruiter" active="r-settings" go={go}>
      <PageHeader title="Настройки" description="Как кабинет выглядит для вас. Изменения действуют сразу и сохраняются для любого браузера, где вы войдёте." />
      <div className="flex max-w-[760px] flex-col gap-10">
        <Group title="Язык">
          <div role="radiogroup" aria-label="Язык" className="grid grid-cols-3 gap-3">
            {LANGS.map((l) => (
              <Choice
                key={l.id}
                on={lang === l.id}
                onClick={() => {
                  setLang(l.id)
                  r.showToast(`Язык: ${l.label}`)
                }}
              >
                <span className="text-[15px] font-medium">{l.label}</span>
                <span className="text-sm text-muted-foreground">{l.native}</span>
              </Choice>
            ))}
          </div>
        </Group>

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

        <Group title="Оплата">
          <ul className="overflow-hidden rounded-xl border border-border bg-surface">
            {(
              [
                ['r-billing', CreditCard, 'Тариф и оплата', 'План компании, места и способ оплаты'],
                ['r-billing-history', ReceiptText, 'Счета', 'Все счета и квитанции'],
              ] as const
            ).map(([id, Icon, title, sub]) => (
              <li key={id} className="border-t border-border first:border-t-0">
                <button type="button" onClick={() => go(id)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-muted">
                  <Icon className="size-5 shrink-0 text-primary" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[15px] font-medium">{title}</span>
                    <span className="text-sm text-muted-foreground">{sub}</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </Group>
      </div>
    </WebShell>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">{title}</h2>
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
      className={cn('relative flex flex-col items-start gap-2 rounded-xl border bg-surface p-4 text-left transition-colors', on ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/50')}
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

// Мініатюра кабінету в світлих / темних кольорах (кольори з брифу, світла й темна палітри).
function ThemeSwatch({ kind }: { kind: Theme }) {
  const light = { bg: '#F3F6FA', side: '#FFFFFF', line: '#E3E8EF', accent: '#1F4E8C' }
  const dark = { bg: '#0B1220', side: '#121A2B', line: '#22304A', accent: '#6B9BEF' }
  const Mini = ({ c, className }: { c: typeof light; className?: string }) => (
    <span className={cn('flex h-full', className)} style={{ background: c.bg }}>
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
  return (
    <span className="flex h-16 w-full overflow-hidden rounded-md border border-border">
      {kind === 'system' ? (
        <>
          <Mini c={light} className="w-1/2 overflow-hidden" />
          <Mini c={dark} className="w-1/2 overflow-hidden" />
        </>
      ) : (
        <Mini c={kind === 'dark' ? dark : light} className="w-full" />
      )}
    </span>
  )
}
