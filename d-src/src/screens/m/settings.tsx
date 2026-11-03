import { useState } from 'react'
import { Bell, Check, Crown, Download, FileText, Globe, LifeBuoy, LogOut, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { ThemeRow } from '@/components/app/theme-select'
import { NavBar } from '@/components/app/chrome'
import { MOBILE_ROUTES } from '@/lib/mobile-routes'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { useQ } from '../q/_parts'
import type { Acct } from '../q/account'
import { LogoutSheet } from './side-menu'
import { SettingsGroup, SettingsRow } from './_parts'

// m-settings — «Настройки» (gaps №7, відповіді 52 і 125, код settings): акаунт, сповіщення,
// підтримка, юридичне; унизу — вихід і видалення акаунта.

const LANGS = ['Русский', 'Українська', 'English']

export function MSettings({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useProto()
  const back = bag<string>('back.m-settings', 'p04')
  const lang = bag<string>('dp.lang', 'Русский')
  const [langOpen, setLangOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const email = useQ().bag<Acct | null>('q.acct', null)?.email || 'you@example.com'
  const [sheet, setSheet] = useState<'logout' | null>(null)

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Настройки" onBack={() => go(back)} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-8">
        {/* Усі налаштування — тут (перевірка 03.11, №39): у профілі лише рядок «Настройки», у меню — без перемикача теми. */}
        <SettingsGroup title="Вид">
          <SettingsRow icon={Globe} title="Язык" value={lang} onClick={() => setLangOpen(true)} />
          <ThemeRow open={themeOpen} onToggle={() => setThemeOpen(!themeOpen)} />
        </SettingsGroup>

        <SettingsGroup title="Аккаунт">
          <SettingsRow icon={UserRound} title="Вы вошли как" sub={<span className="text-[15px] text-foreground">{email}</span>} />
          <SettingsRow
            icon={Crown}
            title="Подписка"
            sub="Премиум, промокод"
            onClick={() => {
              setBag('back.pr-status', 'm-settings')
              go('pr-status')
            }}
          />
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
          <SettingsRow icon={Download} title="Скачать мои данные" sub="Копию пришлём на ваш email" onClick={() => showToast('Копию данных отправим на ваш email')} />
        </SettingsGroup>

        <SettingsGroup className="mt-9">
          <SettingsRow icon={LogOut} title="Выйти" onClick={() => setSheet('logout')} />
          <SettingsRow icon={Trash2} title="Удалить аккаунт" tone="signal" onClick={() => go('m-delete')} />
        </SettingsGroup>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Seafolio <span className="font-mono">1.0.0</span>
        </p>
      </div>

      <BottomSheet open={langOpen} onClose={() => setLangOpen(false)} title="Язык">
        <div role="radiogroup" aria-label="Язык" className="flex flex-col">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={l === lang}
              onClick={() => {
                setBag('dp.lang', l)
                setLangOpen(false)
              }}
              className="flex min-h-13 items-center gap-3 border-t border-border py-3 text-left first:border-t-0"
            >
              <span className="flex-1 text-base">{l}</span>
              {l === lang && <Check className="size-5 text-primary" strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      </BottomSheet>
      <LogoutSheet open={sheet === 'logout'} onClose={() => setSheet(null)} onConfirm={() => go(MOBILE_ROUTES.login)} />
    </div>
  )
}
