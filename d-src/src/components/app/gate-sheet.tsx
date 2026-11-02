import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { MOBILE_ROUTES } from '@/lib/mobile-routes'

// Правка №9: гість натиснув будь-яку дію (лайк, коментар, збереження, відгук, публікацію) → вікно знизу
// «Зарегистрируйтесь, чтобы откликаться и общаться», «Быстрая регистрация» / «Пошаговая регистрация»,
// під ними «Уже есть аккаунт? Войти». Текст однаковий для всіх дій; закривається тапом поза вікном.
// gate(action) — action лишився для сумісності (напр. 'apply', 'save'), на текст не впливає.
export function useGate(go: (id: string) => void, initial: string | null = null) {
  const [action, setAction] = useState<string | null>(initial)

  const sheet = <GateSheet go={go} open={action !== null} onClose={() => setAction(null)} />

  return { gate: setAction, sheet }
}

/** Те саме вікно як окремий компонент (напр. для екрана-прикладу g03). */
export function GateSheet({ go, open, onClose }: { go: (id: string) => void; open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      {/* без автофокусу: інакше на «Быстрая регистрация» одразу видно рамку фокусу */}
      <SheetContent side="bottom" showCloseButton={false} onOpenAutoFocus={(e) => e.preventDefault()} className="gap-0 px-6 pt-6 pb-8">
        <span className="flex size-11 items-center justify-center rounded-full bg-muted text-primary">
          <Lock className="size-5" />
        </span>
        <SheetTitle className="mt-4 text-2xl leading-tight font-semibold tracking-tight">Зарегистрируйтесь, чтобы откликаться и общаться</SheetTitle>
        <SheetDescription className="sr-only">Выберите способ регистрации или войдите</SheetDescription>
        <div className="mt-6 flex flex-col gap-3">
          <Button size="lg" onClick={() => go(MOBILE_ROUTES.quick)}>
            Быстрая регистрация
          </Button>
          <Button size="lg" variant="outline" onClick={() => go(MOBILE_ROUTES.stepper)}>
            Пошаговая регистрация
          </Button>
        </div>
        <p className="mt-5 text-center text-[15px] text-muted-foreground">
          Уже есть аккаунт?{' '}
          <button type="button" onClick={() => go(MOBILE_ROUTES.login)} className="font-semibold text-primary">
            Войти
          </button>
        </p>
      </SheetContent>
    </Sheet>
  )
}
