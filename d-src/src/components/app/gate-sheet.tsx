import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { GATE_TEXT } from '@/lib/data'

// Гість натиснув будь-яку дію → вікно знизу «Зарегистрируйтесь, чтобы…» (поведінка з C).
export function useGate(go: (id: string) => void, initial: string | null = null) {
  const [action, setAction] = useState<string | null>(initial)

  const sheet = (
    <Sheet open={action !== null} onOpenChange={(open) => !open && setAction(null)}>
      <SheetContent side="bottom" showCloseButton={false} className="gap-0 px-6 pt-6 pb-8">
        <span className="flex size-11 items-center justify-center rounded-full bg-muted text-primary">
          <Lock className="size-5" />
        </span>
        <SheetTitle className="mt-4 text-2xl leading-tight font-semibold tracking-tight">
          Зарегистрируйтесь, чтобы {GATE_TEXT[action ?? ''] ?? 'продолжить'}
        </SheetTitle>
        <SheetDescription className="mt-2 text-base">Это займёт около минуты. Смотреть примеры можно и без регистрации.</SheetDescription>
        <div className="mt-6 flex flex-col gap-3">
          <Button size="lg" onClick={() => go('o04')}>
            Пошагово
          </Button>
          <Button size="lg" variant="outline" onClick={() => go('o03')}>
            Быстро — по CV и документам
          </Button>
          <Button size="lg" variant="ghost" className="text-primary" onClick={() => setAction(null)}>
            Не сейчас
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )

  return { gate: setAction, sheet }
}
