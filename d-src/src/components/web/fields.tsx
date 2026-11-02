import type { ComponentProps, ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Базові поля форм для вебу (поверх ui/*): висота 40 px, підпис над полем, підказка або помилка під ним.

export type Option = string | { value: string; label: ReactNode }
const optValue = (o: Option) => (typeof o === 'string' ? o : o.value)
const optLabel = (o: Option) => (typeof o === 'string' ? o : o.label)

export function WebField({ id, label, hint, error, required, children, className }: { id?: string; label: string; hint?: ReactNode; error?: ReactNode; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-signal">*</span>}
      </Label>
      {children}
      {error ? <p className="text-sm text-signal">{error}</p> : hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function WebInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn('h-10 text-sm md:text-sm', className)} {...props} />
}

export function WebTextarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  )
}

// Список вибору. Значення '' — нічого не вибрано (показується placeholder).
export function WebSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Выберите',
  className,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  className?: string
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className={cn('h-10 w-full data-[size=default]:h-10', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper">
        {options.map((o) => (
          <SelectItem key={optValue(o)} value={optValue(o)}>
            {optLabel(o)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function WebCheckbox({ id, checked, onChange, children, className }: { id: string; checked: boolean; onChange: (v: boolean) => void; children: ReactNode; className?: string }) {
  return (
    <label htmlFor={id} className={cn('flex items-center gap-2.5 text-sm', className)}>
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      {children}
    </label>
  )
}
