import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { SCENARIOS, useProto, type Scenario } from '@/lib/proto-state'
import type { Theme } from '@/lib/route'
import { GROUPS, SCREENS } from '@/screens/registry'

type Props = {
  screen: string
  theme: Theme
  onScreen: (id: string) => void
  onTheme: (t: Theme) => void
}

// Панель прототипу: вибір екрана й теми. Не частина застосунку.
export function ControlPanel({ screen, theme, onScreen, onTheme }: Props) {
  const i = SCREENS.findIndex((s) => s.id === screen)
  const prev = SCREENS[i - 1]
  const next = SCREENS[i + 1]
  const { state, set } = useProto()

  return (
    <aside className="flex w-full flex-col gap-4 bg-background p-5 md:h-full md:w-[300px] md:shrink-0 md:border-r md:border-border">
      <div>
        <div className="text-base font-semibold">D · Новый стиль</div>
        <div className="text-sm text-muted-foreground">Экраны вкладки C в стиле «Морской паспорт» с правками заказчика.</div>
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <Label htmlFor="screen">Экран</Label>
        <Select value={screen} onValueChange={onScreen}>
          <SelectTrigger id="screen" className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROUPS.map((g) => (
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
      </div>
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
      <Separator />
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="theme">Тёмная тема</Label>
        <Switch id="theme" checked={theme === 'dark'} onCheckedChange={(on) => onTheme(on ? 'dark' : 'light')} />
      </div>
    </aside>
  )
}
