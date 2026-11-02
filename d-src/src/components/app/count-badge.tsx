import { cn } from '@/lib/utils'

// Лічильник непрочитаного на значку (нижнє меню, дзвіночок). 0 — не показуємо; понад 99 — «99+».
export function CountBadge({ n, className }: { n?: number; className?: string }) {
  if (!n) return null
  return (
    <span
      className={cn(
        'absolute -top-1 left-[calc(50%+4px)] flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-surface bg-primary px-1 font-mono text-[10px] leading-none font-medium text-primary-foreground',
        className,
      )}
    >
      {n > 99 ? '99+' : n}
    </span>
  )
}
