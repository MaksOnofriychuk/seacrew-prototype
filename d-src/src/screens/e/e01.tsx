import { CameraOff } from 'lucide-react'
import type { ScreenProps } from '../registry'
import { BlockTitle, ErrorLayout, RetryActions } from './_error-layout'

// e01 — ІІ не прочитав документ (qError('e01') у C).
// Сильний елемент — заголовок; під ним три поради, як зняти краще, і скільки спроб лишилось.
const TIPS = [
  'Положите документ на тёмную ровную поверхность',
  'Снимайте при дневном свете, без вспышки',
  'В кадре вся страница — с фото и строками внизу',
]

export function E01NotRead({ go }: ScreenProps) {
  return (
    <ErrorLayout
      icon={CameraOff}
      tone="signal"
      title="Не получилось прочитать документ"
      text="Фото размыто, обрезано или с бликом."
      onBack={() => go('q03')}
      actions={<RetryActions go={go} />}
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
      <p className="mt-4 text-sm text-muted-foreground">
        Осталось попыток: <span className="font-mono text-foreground">2</span>
      </p>
    </ErrorLayout>
  )
}
