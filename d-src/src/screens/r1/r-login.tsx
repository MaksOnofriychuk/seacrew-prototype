import { useState, type FormEvent } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WebField, WebInput } from '@/components/web/fields'
import { useView } from '@/components/app/states'
import { ME_RECRUITER } from '@/lib/data-web'
import type { ScreenProps } from '../types'
import { useOpenLegal } from '../r3/pub-legal'
import { AuthLayout, Pitch } from './_parts'

// r-login — вхід у кабінет рекрутера (contract-recruiter-web §1, /login у коді). Без оболонки.
// Стан з панелі: «Ошибка» — неверный email или пароль, «Загрузка» — кнопка «Входим…».
export function RLogin({ go }: ScreenProps) {
  const view = useView()
  const [email, setEmail] = useState(ME_RECRUITER.email)
  const [password, setPassword] = useState('demo-password')
  const [touched, setTouched] = useState(false)
  const short = password.length < 8
  const badEmail = !/^\S+@\S+\.\S+$/.test(email)
  const invalid = touched && (badEmail || short)
  const busy = view === 'loading'
  const legal = useOpenLegal(go, 'r-login')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!badEmail && !short && view === 'normal') go('r-search')
  }

  return (
    <AuthLayout aside={<Pitch />} go={go}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl leading-tight font-semibold tracking-tight">Вход</h1>
          <p className="text-sm text-muted-foreground">Для рекрутеров и администраторов платформы.</p>
        </div>

        <div className="flex flex-col gap-1">
          <WebField id="login-email" label="Email" error={touched && badEmail ? 'Введите email полностью' : undefined}>
            <WebInput id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={touched && badEmail} />
          </WebField>
          <WebField id="login-password" label="Пароль" error={touched && short ? 'Пароль не короче 8 символов' : undefined}>
            <WebInput id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={touched && short} />
          </WebField>
        </div>

        {view === 'error' && !invalid && (
          <p role="alert" className="flex items-start gap-2.5 rounded-md border border-signal/40 bg-signal/5 px-3.5 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-signal" />
            Неверный email или пароль.
          </p>
        )}

        <Button type="submit" className="h-10 text-[15px]" disabled={busy}>
          {busy ? 'Входим…' : 'Войти'}
        </Button>

        <p className="text-sm text-muted-foreground">
          Входя, вы принимаете{' '}
          <button type="button" onClick={() => legal('terms')} className="text-primary hover:underline">
            Условия сервиса
          </button>{' '}
          и{' '}
          <button type="button" onClick={() => legal('privacy')} className="text-primary hover:underline">
            Политику конфиденциальности
          </button>
          .
        </p>

        <p className="border-t border-border pt-4 text-sm text-muted-foreground">
          Компании ещё нет в Seafolio?{' '}
          <button type="button" onClick={() => go('r-register')} className="font-medium text-primary hover:underline">
            Зарегистрировать компанию
          </button>
        </p>
      </form>
    </AuthLayout>
  )
}
