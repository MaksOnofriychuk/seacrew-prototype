import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FieldMsg } from '@/components/app/field-msg'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Спільне для o05 «Вход» і o06 «Восстановление пароля». Лише для цих екранів
// (поле й перевірка email — локальна копія з q/_parts і q06, щоб не залежати від чужої теки).

export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())

// Тексти помилок — з застосунку (apps/mobile, i18n ru: auth.errors.*).
export const AUTH_ERR = {
  emailEmpty: 'Введите email.',
  emailInvalid: 'Введите правильный адрес email.',
  passEmpty: 'Введите пароль.',
  wrong: 'Неверный email или пароль.',
  offline: 'Нет связи с сервером. Проверьте интернет и попробуйте снова.',
  rate: 'Слишком много попыток. Попробуйте позже.',
} as const

/** Відкладені дії з прибиранням таймерів при виході з екрана. */
export function useLater() {
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  return (fn: () => void, ms = 900) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
}

export function AuthField({ id, label, error, aside, children }: { id: string; label: string; error?: string | null; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {aside}
      </div>
      {children}
      <FieldMsg id={`${id}-err`} error={error} />
    </div>
  )
}

export function AuthInput({ invalid, className, id, ...props }: React.ComponentProps<'input'> & { invalid?: boolean }) {
  return (
    <Input
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${id}-err` : undefined}
      className={cn('h-12 px-4 text-base md:text-base', invalid && 'border-signal', className)}
      {...props}
    />
  )
}

export function PasswordInput(props: React.ComponentProps<'input'> & { invalid?: boolean }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <AuthInput {...props} type={show ? 'text' : 'password'} className="pr-12" />
      <button
        type="button"
        aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
        onClick={() => setShow(!show)}
        className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground"
      >
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  )
}

/** Помилка всієї форми (не одного поля): рамка й текст кольору signal. */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2.5 rounded-md border border-signal px-4 py-3 text-[15px] text-signal">
      <CircleAlert className="mt-0.5 size-5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

/* ---------- знаки входу через Google і Apple ---------- */

// Знак Google — у фірмових кольорах (так вимагають правила кнопки входу Google).
export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('size-5', className)} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

// Знак Apple — кольором тексту (світла й темна тема).
export function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={cn('size-5', className)} aria-hidden="true" fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  )
}
