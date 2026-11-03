import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

// Вікно знизу: шапка (назва + дія праворуч), прокручуваний вміст, нижня дія завжди на виду.
// Фокус — на саме вікно, а не на перше поле: інакше клавіатура й рамка фокуса з'являються без запиту.
// fixed — постійна висота (≈ 60 % екрана) для списків з пошуком: вікно не стрибає, коли список коротшає.
// head — те, що не прокручується разом зі списком (поле пошуку).
// (Раніше — AppSheet у screens/p/_app-parts; там тепер реекспорт.)
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  aside,
  footer,
  fixed,
  head,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  aside?: ReactNode
  footer?: ReactNode
  fixed?: boolean
  head?: ReactNode
  children: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn('gap-0 p-0 outline-none', fixed ? 'h-[62%]' : 'max-h-[90%]')}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement | null)?.focus()
        }}
      >
        <div className="shrink-0 px-6 pt-6">
          <div className="flex items-baseline justify-between gap-4">
            <SheetTitle className="text-2xl leading-tight font-semibold tracking-tight">{title}</SheetTitle>
            {aside}
          </div>
          {description ? <SheetDescription className="mt-2 text-base">{description}</SheetDescription> : <SheetDescription className="sr-only">{typeof title === 'string' ? title : ''}</SheetDescription>}
          {head && <div className="pt-4 pb-1">{head}</div>}
        </div>
        <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-4 *:shrink-0', head ? 'pt-3' : 'pt-5')}>{children}</div>
        {footer && <div className="flex shrink-0 flex-col gap-2 border-t border-border px-6 pt-3 pb-6">{footer}</div>}
      </SheetContent>
    </Sheet>
  )
}
