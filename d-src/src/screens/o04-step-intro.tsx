import { Check, Paperclip } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { Group } from '@/components/app/group'
import { Paper } from '@/components/app/paper'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from './registry'

// o04 — правка п. 9: короткий заголовок, дві великі картки, «Начать»,
// під кнопкою маленьким рядком «Можно с перерывами». Графіка й «Основное/Дополнительно» немає.
export function O04StepIntro({ go }: ScreenProps) {
  return (
    <div className="flex h-full flex-col">
      <NavBar onBack={() => go('o02')} />
      <div className="flex flex-1 flex-col px-6 pt-2">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Профиль шаг за шагом</h1>

        <Paper title="Заполнить Application form в 1 тап" className="mt-6">
          <ul className="-my-1">
            {[
              ['Фамилия', 'Koval', false],
              ['Должность', '3rd Engineer', false],
              ['Диплом CoC, до', '20.06.2029', true],
            ].map(([k, v, mono]) => (
              <li key={k as string} className="flex items-center gap-3 border-t border-border py-3.5 first:border-t-0 first:pt-1">
                <Check className="size-4 shrink-0 text-success" />
                <span className="flex-1 text-[15px] text-muted-foreground">{k}</span>
                <span className={mono ? 'font-mono text-[15px]' : 'text-[15px] font-medium'}>{v}</span>
              </li>
            ))}
          </ul>
        </Paper>

        <Group title="Пакет документов рекрутеру в 1 тап" className="mt-4">
          <ul className="-my-1">
            {["Seafarer's ID", 'Диплом CoC', 'Медосмотр (PEME)'].map((d) => (
              <li key={d} className="flex items-center gap-3 border-t border-border py-3.5 first:border-t-0 first:pt-1">
                <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-[15px] font-medium">{d}</span>
              </li>
            ))}
          </ul>
        </Group>
      </div>
      <Footer>
        <Button size="lg" onClick={() => go('s1')}>
          Начать
        </Button>
        <p className="text-center text-sm text-muted-foreground">Можно с перерывами — продолжите с любого шага и с любого устройства.</p>
      </Footer>
    </div>
  )
}
