import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from '../registry'
import { ErrorLayout } from './_error-layout'

// e05 — документ у бан-листі (qError('e05') у C). Тон нейтральний, причину не називаємо:
// тихий сірий знак замість кольору помилки.
export function E05Banned({ go }: ScreenProps) {
  return (
    <ErrorLayout
      icon={ShieldOff}
      tone="muted"
      title="Регистрация невозможна"
      text="С этим документом нельзя создать аккаунт. Если вы считаете, что это ошибка, напишите в поддержку."
      onClose={() => go('o02')}
      actions={
        <>
          <Button size="lg" variant="outline">
            Написать в поддержку
          </Button>
          <Button size="lg" variant="ghost" className="text-primary" onClick={() => go('o02')}>
            На главную
          </Button>
        </>
      }
    />
  )
}
