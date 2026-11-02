import { CameraOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../registry'
import { BlockTitle, ErrorLayout, RetryActions } from './_error-layout'

// e01 — ІІ не прочитав документ (qError('e01') у C).
// Відповідь замовника 78: «1 попытка переснять, потом вручную». Лічильник невдалих читань — bag 'q.blurTries'
// (рахує q04, успішне читання обнуляє). Перший раз — поради і одна спроба переснять; сценарій лишається
// «ИИ не прочитал документ», тож друга спроба знову не вдається — тоді лише «Ввести вручную» (e07).
const TIPS = [
  'Положите документ на тёмную ровную поверхность',
  'Снимайте при дневном свете, без вспышки',
  'В кадре вся страница — с фото и строками внизу',
]

export function E01NotRead({ go }: ScreenProps) {
  const { bag } = useProto()
  const last = bag<number>('q.blurTries', 1) >= 2

  if (last) {
    return (
      <ErrorLayout
        low
        icon={CameraOff}
        tone="signal"
        title="Документ снова не прочитался"
        text="Введите данные вручную и приложите фото — администратор сверит их."
        onBack={() => go('q03')}
        actions={
          <Button size="lg" onClick={() => go('e07')}>
            Ввести вручную
          </Button>
        }
      />
    )
  }

  return (
    <ErrorLayout
      icon={CameraOff}
      tone="signal"
      title="Не получилось прочитать документ"
      text="Фото размыто, обрезано или с бликом."
      onBack={() => go('q03')}
      actions={<RetryActions go={go} keepScenario />}
    >
      <BlockTitle>Как снять лучше</BlockTitle>
      <ol className="mt-1">
        {TIPS.map((t, i) => (
          <li key={t} className="flex items-baseline gap-4 border-t border-border py-3 first:border-t-0">
            <span className="w-4 shrink-0 font-mono text-sm text-primary">{i + 1}</span>
            <span className="text-[15px]">{t}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-muted-foreground">Переснять можно ещё раз. Не получится — введёте данные вручную.</p>
    </ErrorLayout>
  )
}
