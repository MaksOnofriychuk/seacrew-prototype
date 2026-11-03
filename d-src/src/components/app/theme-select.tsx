import { useEffect } from 'react'
import { Check, Moon } from 'lucide-react'
import { ExpandRow } from '@/screens/dp/_inline-edit'
import { useProto } from '@/lib/proto-state'
import { setTheme, useDark } from '@/screens/m/_parts'

// Тема приложения: «Системная / Тёмная / Светлая» выпадающим списком прямо в строке настроек (правка №19).
// Выбор живёт в bag 'settings.theme' и реально переключает тему прототипа (она задаётся адресом, как в панели).
// «Системная» берёт prefers-color-scheme и следит за ним, пока выбрана.

export type ThemePref = 'system' | 'light' | 'dark'
export const THEMES: { id: ThemePref; label: string }[] = [
  { id: 'system', label: 'Системная' },
  { id: 'dark', label: 'Тёмная' },
  { id: 'light', label: 'Светлая' },
]

const sysDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export function useThemePref() {
  const { bag, setBag } = useProto()
  const dark = useDark()
  const stored = bag<ThemePref | null>('settings.theme', null)
  // Если тему поменяли из панели прототипа, «Системная» перестаёт быть правдой — показываем то, что видно на экране.
  const actual: ThemePref = dark ? 'dark' : 'light'
  const pref: ThemePref = stored === 'system' && dark === sysDark() ? 'system' : actual
  const pick = (t: ThemePref) => {
    setBag('settings.theme', t)
    setTheme(t === 'system' ? sysDark() : t === 'dark')
  }
  useEffect(() => {
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const on = () => setTheme(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [pref])
  return { pref, pick }
}

// Строка «Тема»: тап раскрывает под ней блок с тремя пунктами (как поля «Личных данных»); выбор применяет тему и сворачивает.
export function ThemeRow({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { pref, pick } = useThemePref()
  return (
    <ExpandRow icon={Moon} title="Тема" value={THEMES.find((t) => t.id === pref)!.label} open={open} onToggle={onToggle}>
      <div role="radiogroup" aria-label="Тема" className="overflow-hidden rounded-xl border border-border bg-surface">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={t.id === pref}
            onClick={() => {
              pick(t.id)
              onToggle()
            }}
            className="flex min-h-14 w-full items-center gap-3 border-t border-border px-4 py-3 text-left transition-colors first:border-t-0 active:bg-muted"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] leading-snug">{t.label}</span>
              {t.id === 'system' && <span className="text-sm leading-snug text-muted-foreground">Как в настройках телефона</span>}
            </span>
            {t.id === pref && <Check className="size-5 shrink-0 text-primary" strokeWidth={2.5} />}
          </button>
        ))}
      </div>
    </ExpandRow>
  )
}
