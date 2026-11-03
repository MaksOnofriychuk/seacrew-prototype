import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { usePhonePortal } from '@/lib/phone-portal'
import { cn } from '@/lib/utils'

// Вікно посередині вікна браузера (як BottomSheet у телефоні): заголовок, вміст, дії внизу праворуч.
export function WebDialog({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const container = usePhonePortal()
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="absolute inset-0 z-50 bg-black/40 duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'absolute inset-0 z-50 m-auto flex h-fit max-h-[85%] w-[520px] flex-col rounded-xl border border-border bg-surface outline-none duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]',
            className,
          )}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement | null)?.focus()
          }}
        >
          <div className={cn('flex items-start justify-between gap-4 px-6 pt-5', !children && 'pb-5')}>
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-xl leading-tight font-semibold tracking-tight">{title}</Dialog.Title>
              {description ? <Dialog.Description className="text-sm text-muted-foreground">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{typeof title === 'string' ? title : ''}</Dialog.Description>}
            </div>
            <Dialog.Close aria-label="Закрыть" className="-mt-1 -mr-2 flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {children && <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-6 pt-5 pb-6">{children}</div>}
          {footer && <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
