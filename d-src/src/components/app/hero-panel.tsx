import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Панель-герой онбордингу: тонка сітка морської карти кольору border і координати в куті.
// Лише для онбордингу, не для робочих екранів.
export function HeroPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('relative flex shrink-0 flex-col overflow-hidden bg-hero', className)}>
      <ChartGrid />
      {children}
      <span className="relative px-6 pb-3 font-mono text-[11px] text-muted-foreground">46°28′N 30°44′E</span>
    </section>
  )
}

function ChartGrid() {
  return (
    <svg className="absolute inset-0 size-full dark:opacity-50" aria-hidden="true">
      <defs>
        <pattern id="chart-minor" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="var(--chart-line)" strokeWidth="0.75" />
        </pattern>
        <pattern id="chart-major" width="96" height="96" patternUnits="userSpaceOnUse">
          <rect width="96" height="96" fill="url(#chart-minor)" />
          <path d="M96 0H0V96" fill="none" stroke="var(--chart-line)" strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#chart-major)" />
    </svg>
  )
}
