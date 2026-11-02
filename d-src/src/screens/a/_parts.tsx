import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { WebShell } from '@/components/web/shell'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'

// Спільне для екранів адмінки (етап 9): каркас, вибраний запис, факти, бокове вікно підтвердження.

export function AdminPage({ active, go, children }: { active: string; go: (id: string) => void; children: ReactNode }) {
  return (
    <WebShell variant="admin" active={active} go={go}>
      {children}
    </WebShell>
  )
}

/** Значення в спільному сховищі прототипу: так список бачить, що змінили на деталі. */
export function useBagState<T>(key: string, fallback: T): [T, (v: T) => void] {
  const { bag, setBag } = useProto()
  return [bag<T>(key, fallback), (v: T) => setBag(key, v)]
}

/** '2026-11-02 09:40' → '02.11.2026 09:40'; '2026-11-02' → '02.11.2026' */
export function dt(s: string) {
  const [d, t] = s.split(' ')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return s
  return d.split('-').reverse().join('.') + (t ? ' ' + t : '')
}

export const Mono = ({ children, className }: { children: ReactNode; className?: string }) => <span className={cn('font-mono', className)}>{children}</span>

// Пари «підпис — значення» у дві колонки, без карток.
export function Facts({ items, cols = 2, className }: { items: [string, ReactNode][]; cols?: 2 | 3; className?: string }) {
  return (
    <dl className={cn('grid gap-x-8 gap-y-4', cols === 3 ? 'grid-cols-3' : 'grid-cols-2', className)}>
      {items.map(([k, v]) => (
        <div key={k} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-sm text-muted-foreground">{k}</dt>
          <dd className="truncate text-[15px]">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function SectionTitle({ children, aside, className }: { children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn('mt-8 mb-3 flex items-end justify-between gap-4', className)}>
      <h2 className="text-lg font-semibold">{children}</h2>
      {aside}
    </div>
  )
}

// Бокове вікно праворуч у вікні браузера: підтвердження дії або короткий перегляд запису.
export function SideSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[460px] gap-0 sm:max-w-[460px]">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="pr-6 text-lg">{title}</SheetTitle>
          {description ? <SheetDescription className="text-[15px]">{description}</SheetDescription> : <SheetDescription className="sr-only">{title}</SheetDescription>}
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-6 py-4">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}

export function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick}>
      Отмена
    </Button>
  )
}

// Тиха плашка-пояснення над таблицею або в деталі (не картка, а смуга з лівою межею).
export function Note({ tone = 'muted', children, className }: { tone?: 'muted' | 'warning' | 'error'; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'border-l-2 py-1 pl-4 text-[15px]',
        tone === 'muted' && 'border-border text-muted-foreground',
        tone === 'warning' && 'border-warning text-foreground',
        tone === 'error' && 'border-signal text-foreground',
        className,
      )}
    >
      {children}
    </div>
  )
}
