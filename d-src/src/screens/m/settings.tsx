import { useState } from 'react'
import { Bell, Check, UserRound, FileText, Globe, LifeBuoy, LogOut, Moon, ShieldCheck, Trash2 } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { NavBar } from '@/components/app/chrome'
import { MOBILE_ROUTES } from '@/lib/mobile-routes'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { useQ } from '../q/_parts'
import type { Acct } from '../q/q06'
import { LogoutSheet } from './side-menu'
import { SettingsGroup, SettingsRow, setTheme, useDark } from './_parts'

// m-settings — «Настройки» (gaps №7, відповіді 52 і 125, код settings): тема, мова, акаунт, сповіщення,
// підтримка, юридичне; унизу — вихід і видалення акаунта. Тема справді перемикає прототип.

type ThemePref = 'system' | 'light' | 'dark'
const THEMES: { id: ThemePref; label: string }[] = [
  { id: 'system', label: 'Как в системе' },
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
]
const LANGS = [
  { id: 'system', label: 'Как в системе' },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
  { id: 'uk', label: 'Українська' },
]

export function MSettings({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useProto()
  const dark = useDark()
  const email = useQ().bag<Acct | null>('q.acct', null)?.email || 'you@example.com'
  const pref = bag<ThemePref | null>('settings.theme', null) ?? (dark ? 'dark' : 'light')
  const lang = bag<string>('settings.lang', 'ru')
  const [sheet, setSheet] = useState<'theme' | 'lang' | 'logout' | null>(null)

  const pickTheme = (t: ThemePref) => {
    setBag('settings.theme', t)
    setSheet(null)
    setTheme(t === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : t === 'dark')
  }

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Настройки" onBack={() => go('p04')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-8">
        <SettingsGroup title="Вид">
          <SettingsRow icon={Moon} title="Тема" value={THEMES.find((t) => t.id === pref)!.label} onClick={() => setSheet('theme')} />
          <SettingsRow icon={Globe} title="Язык" value={LANGS.find((l) => l.id === lang)!.label} onClick={() => setSheet('lang')} />
        </SettingsGroup>

        <SettingsGroup title="Аккаунт">
          <SettingsRow icon={UserRound} title="Вы вошли как" sub={<span className="text-[15px] text-foreground">{email}</span>} />
          <SettingsRow
            icon={Bell}
            title="Уведомления"
            sub="Какие присылать: рабочие и нерабочие"
            onClick={() => {
              setBag('back.m-notif-settings', 'm-settings')
              go('m-notif-settings')
            }}
          />
        </SettingsGroup>

        <SettingsGroup title="Помощь">
          <SettingsRow
            icon={LifeBuoy}
            title="Поддержка"
            onClick={() => {
              setBag('back.m-support', 'm-settings')
              go('m-support')
            }}
          />
        </SettingsGroup>

        <SettingsGroup title="Юридическое">
          <SettingsRow icon={FileText} title="Условия сервиса" onClick={() => showToast('Откроется текст условий (пример)')} />
          <SettingsRow icon={FileText} title="Политика конфиденциальности" onClick={() => showToast('Откроется текст политики (пример)')} />
          <SettingsRow icon={ShieldCheck} title="Согласия" sub="Что вы разрешили и когда" onClick={() => go('q10')} />
        </SettingsGroup>

        <SettingsGroup className="mt-9">
          <SettingsRow icon={LogOut} title="Выйти" onClick={() => setSheet('logout')} />
          <SettingsRow icon={Trash2} title="Удалить аккаунт" tone="signal" onClick={() => go('m-delete')} />
        </SettingsGroup>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Seafolio <span className="font-mono">1.0.0</span>
        </p>
      </div>

      <ChoiceSheet open={sheet === 'theme'} title="Тема" items={THEMES} value={pref} onClose={() => setSheet(null)} onPick={(v) => pickTheme(v as ThemePref)} />
      <ChoiceSheet
        open={sheet === 'lang'}
        title="Язык"
        items={LANGS}
        value={lang}
        onClose={() => setSheet(null)}
        onPick={(v) => {
          setBag('settings.lang', v)
          setSheet(null)
          if (v !== 'ru' && v !== 'system') showToast('В прототипе тексты только на русском')
        }}
      />
      <LogoutSheet open={sheet === 'logout'} onClose={() => setSheet(null)} onConfirm={() => go(MOBILE_ROUTES.login)} />
    </div>
  )
}

function ChoiceSheet({
  open,
  title,
  items,
  value,
  onClose,
  onPick,
}: {
  open: boolean
  title: string
  items: { id: string; label: string }[]
  value: string
  onClose: () => void
  onPick: (id: string) => void
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div role="radiogroup" aria-label={title} className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
        {items.map((it) => {
          const on = it.id === value
          return (
            <button
              key={it.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onPick(it.id)}
              className="flex min-h-13 items-center gap-3 border-t border-border px-4 text-left first:border-t-0"
            >
              <span className={cn('flex-1 text-base', on && 'font-medium')}>{it.label}</span>
              {on && <Check className="size-5 text-primary" strokeWidth={2.25} />}
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}
