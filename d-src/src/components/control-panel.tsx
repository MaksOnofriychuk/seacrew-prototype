import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { SCENARIOS, useProto, type Scenario } from '@/lib/proto-state'
import { VIEWS, type Theme, type View } from '@/lib/route'
import { cn } from '@/lib/utils'
import { groupsFor, PLATFORMS, screensFor, type Platform } from '@/screens/registry'

type Props = {
  platform: Platform
  /** порожній, коли на платформі ще немає екранів */
  screen: string
  theme: Theme
  view: View
  onPlatform: (p: Platform) => void
  onScreen: (id: string) => void
  onTheme: (t: Theme) => void
  onView: (v: View) => void
}

// Панель прототипу: платформа, екран («Назад» / «Далее» — у межах платформи), стан екрана, сценарій (мобілка), тема.
// Не частина застосунку.
export function ControlPanel({ platform, screen, theme, view, onPlatform, onScreen, onTheme, onView }: Props) {
  const groups = groupsFor(platform)
  const list = screensFor(platform)
  const i = list.findIndex((s) => s.id === screen)
  const prev = list[i - 1]
  const next = list[i + 1]
  const { state, set } = useProto()

  return (
    <aside className="flex w-full flex-col gap-4 bg-background p-5 md:h-full md:w-[300px] md:shrink-0 md:overflow-y-auto md:border-r md:border-border">
      <div>
        <div className="text-base font-semibold">D · Новый стиль</div>
        <div className="text-sm text-muted-foreground">Полный прототип Seafolio в стиле «Морской паспорт».</div>
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium" id="platform-label">
          Платформа
        </span>
        <div role="radiogroup" aria-labelledby="platform-label" className="flex flex-col gap-1 rounded-md border border-border bg-surface p-1">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={p.id === platform}
              onClick={() => onPlatform(p.id)}
              className={cn(
                'flex h-9 items-center justify-between rounded-[9px] border px-3 text-left text-sm font-medium transition-colors',
                p.id === platform ? 'border-primary bg-muted text-primary' : 'border-transparent text-foreground',
              )}
            >
              {p.label}
              <span className="font-mono text-xs text-muted-foreground">{screensFor(p.id).length || '—'}</span>
            </button>
          ))}
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <Label htmlFor="screen">Экран</Label>
        {list.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">Экраны появятся позже</p>
        ) : (
          <>
            <Select value={screen} onValueChange={onScreen}>
              <SelectTrigger id="screen" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectGroup key={g.title}>
                    <SelectLabel>{g.title}</SelectLabel>
                    {g.screens.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="font-mono text-xs text-muted-foreground">{s.id}</span> {s.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" className="h-10 flex-1" disabled={!prev} onClick={() => prev && onScreen(prev.id)}>
                <ChevronLeft /> Назад
              </Button>
              <Button variant="outline" className="h-10 flex-1" disabled={!next} onClick={() => next && onScreen(next.id)}>
                Далее <ChevronRight />
              </Button>
            </div>
          </>
        )}
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <Label htmlFor="view">Состояние экрана</Label>
        <Select value={view} onValueChange={(v) => onView(v as View)}>
          <SelectTrigger id="view" className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VIEWS.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Работает на экранах, где состояние имеет смысл.</p>
      </div>
      {platform === 'mobile' && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <Label htmlFor="scenario">Сценарий</Label>
            <Select value={state.scenario} onValueChange={(v) => set({ scenario: v as Scenario })}>
              <SelectTrigger id="scenario" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCENARIOS.map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      <Separator />
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="theme">Тёмная тема</Label>
        <Switch id="theme" checked={theme === 'dark'} onCheckedChange={(on) => onTheme(on ? 'dark' : 'light')} />
      </div>
    </aside>
  )
}
