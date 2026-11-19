import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Числовое поле в стиле фильтров-списков: «Подпись: [число] суффикс». Только цифры.
export function NumField({ label, value, onChange, suffix, placeholder = '—', className, children }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string; className?: string; children?: ReactNode }) {
  return (
    <label className={cn('flex h-10 items-center gap-2 rounded-md border border-input bg-surface px-3 text-sm focus-within:border-ring', value && 'border-primary', className)}>
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 7))}
        placeholder={placeholder}
        aria-label={label}
        className="w-16 min-w-0 flex-1 bg-transparent font-mono outline-none placeholder:font-sans placeholder:text-muted-foreground"
      />
      {suffix && <span className="shrink-0 text-muted-foreground">{suffix}</span>}
      {children}
    </label>
  )
}
