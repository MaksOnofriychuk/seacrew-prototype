import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from '../registry'
import { ErrorLayout, useSupport } from './_error-layout'

// e08 — акаунт заблоковано (правка №12): другий поспіль «не той документ» після попередження на e02.
// Розблоковує лише підтримка; після цього лічильник помилок обнуляється. Причину не розписуємо —
// моряк щойно бачив попередження. Як e05: хрестик — вихід на вибір способу.
export function E08Blocked({ go }: ScreenProps) {
  const support = useSupport(go, 'e08', true)
  return (
    <ErrorLayout
      low
      icon={Lock}
      tone="signal"
      title="Аккаунт заблокирован"
      text="Для разблокировки свяжитесь с поддержкой."
      onClose={() => go('o02')}
      actions={
        <Button size="lg" onClick={support}>
          Написать в поддержку
        </Button>
      }
    />
  )
}
