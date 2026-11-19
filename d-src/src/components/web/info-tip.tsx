import { createContext, useEffect, useId, useState, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// Пояснение страницы в кабинете рекрутера: значок «i» рядом с заголовком, текст — в подсказке.
// Открывается при наведении и при фокусе с клавиатуры, закрывается по Escape и уходом курсора/фокуса.
// WebShell рекрутера включает контекст: PageHeader тогда показывает description подсказкой; в админке остаётся текстом.
export const DescriptionAsTip = createContext(false)

export function InfoTip({ text, label = 'Пояснение', align = 'left', className }: { text: ReactNode; label?: string; /** к какому краю значка прижато окно */ align?: 'left' | 'right'; className?: string }) {
  const id = useId()
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const open = hover || focus
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setHover(false)
      setFocus(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <span className={cn('relative inline-flex', className)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className="flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="size-[18px]" />
      </button>
      {open && (
        <span id={id} role="tooltip" className={cn('absolute top-full z-50 w-[320px] pt-1.5 animate-in fade-in-0 duration-150 motion-reduce:animate-none', align === 'right' ? 'right-0' : 'left-0')}>
          <span className="block rounded-lg border border-border bg-surface p-3 text-sm leading-snug font-normal tracking-normal text-foreground shadow-lg">{text}</span>
        </span>
      )}
    </span>
  )
}
