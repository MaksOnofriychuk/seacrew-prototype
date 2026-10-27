import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// Текстовий знак — там, де немає кнопки «Назад».
export function Wordmark({ className }: { className?: string }) {
  return <span className={cn('text-xl font-semibold tracking-tight text-primary', className)}>Seafolio</span>
}

// Верхня панель з «Назад» і назвою екрана посередині.
export function NavBar({ title, onBack, right }: { title?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="grid h-12 shrink-0 grid-cols-[48px_1fr_48px] items-center px-2">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Назад" className="flex size-11 items-center justify-center rounded-md text-primary active:scale-95">
          <ChevronLeft className="size-6" />
        </button>
      ) : (
        <span />
      )}
      <span className="truncate text-center text-[15px] font-semibold">{title}</span>
      <span className="flex justify-end">{right}</span>
    </div>
  )
}

// Нижня частина екрана з головною дією.
export function Footer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex shrink-0 flex-col gap-3 px-6 pt-3 pb-4', className)}>{children}</div>
}
