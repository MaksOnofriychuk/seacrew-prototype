import type { ReactNode } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

// Вікно знизу: шапка (назва + дія праворуч), прокручуваний вміст, нижня дія завжди на виду.
// Фокус — на саме вікно, а не на перше поле: інакше клавіатура й рамка фокуса з'являються без запиту.
// (Раніше — AppSheet у screens/p/_app-parts; там тепер реекспорт.)
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  aside,
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  aside?: ReactNode
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[90%] gap-0 p-0 outline-none"
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
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-5 pb-4 *:shrink-0">{children}</div>
        {footer && <div className="flex shrink-0 flex-col gap-2 border-t border-border px-6 pt-3 pb-6">{footer}</div>}
      </SheetContent>
    </Sheet>
  )
}
