import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../registry'
import { ErrorLayout, fmtCd } from './_error-layout'

// e04 — забагато спроб з одного телефона (qError('e04') у C, ліміт — захист від ботів).
// Відлік до наступної спроби (у C S.cd = 872 с) — у вимкненій кнопці, цифри Plex Mono.
// Кінцевий час тримаємо в bag, щоб відлік не починався заново при кожному вході.
const LIMIT_SEC = 872

export function E04RateLimit({ go }: ScreenProps) {
  const { bag, setBag } = useProto()
  const until = bag<number | null>('e04.until', null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (until === null) setBag('e04.until', Date.now() + LIMIT_SEC * 1000)
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const left = until === null ? LIMIT_SEC : Math.max(0, Math.ceil((until - now) / 1000))

  return (
    <ErrorLayout
      low
      icon={Clock}
      tone="warning"
      title="Слишком много попыток"
      text="С этого телефона было много попыток регистрации. Попробуйте чуть позже."
      onClose={() => go('o02')}
      actions={
        <>
          <Button size="lg" variant="outline" disabled>
            Повторить через <span className="font-mono tabular-nums">{fmtCd(left)}</span>
          </Button>
          <Button size="lg" variant="ghost" className="text-primary">
            Написать в поддержку
          </Button>
        </>
      }
    />
  )
}
