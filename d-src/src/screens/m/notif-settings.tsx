import { NavBar } from '@/components/app/chrome'
import { Switch } from '@/components/ui/switch'
import { NOTIF_TYPES } from '@/lib/data-messages'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { SettingsGroup, SettingsRow } from './_parts'

// m-notif-settings — «Уведомления · настройки» (бриф S50, відповіді 108–109): перемикачі за типами,
// згруповані так само, як вкладки на p10 («Рабочие» / «Нерабочие»); email — лише для важливого.

export function MNotifSettings({ go }: ScreenProps) {
  const { bag, setBag } = useProto()
  const back = bag<string>('back.m-notif-settings', 'm-settings')
  const on = bag<Record<string, boolean>>('settings.notif', {})
  const isOn = (id: string) => on[id] ?? true
  const toggle = (id: string, v: boolean) => setBag('settings.notif', { ...on, [id]: v })

  const group = (tab: 'work' | 'other') =>
    NOTIF_TYPES.filter((t) => t.tab === tab).map((t) => (
      <SettingsRow key={t.id} title={<label htmlFor={`n-${t.id}`}>{t.title}</label>} sub={t.sub} right={<Switch id={`n-${t.id}`} checked={isOn(t.id)} onCheckedChange={(v) => toggle(t.id, v)} />} />
    ))

  return (
    <div className="flex h-full flex-col">
      <NavBar title="Уведомления" onBack={() => go(back)} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-8">
        <SettingsGroup title="Рабочие">{group('work')}</SettingsGroup>
        <SettingsGroup title="Нерабочие">{group('other')}</SettingsGroup>
        <SettingsGroup title="Email" note="Push и уведомления в приложении приходят по всем включённым типам.">
          <SettingsRow
            title={<label htmlFor="n-email">Важное на почту</label>}
            sub="Предложения рекрутеров и сроки документов"
            right={<Switch id="n-email" checked={isOn('email')} onCheckedChange={(v) => toggle('email', v)} />}
          />
        </SettingsGroup>
      </div>
    </div>
  )
}
