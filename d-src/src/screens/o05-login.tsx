import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { useView } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { MOBILE_ROUTES } from '@/lib/mobile-routes'
import { useProto } from '@/lib/proto-state'
import { AppleMark, AUTH_ERR, AuthField, AuthInput, emailOk, FormAlert, GoogleMark, PasswordInput, useLater } from './o-auth-parts'
import type { ScreenProps } from './registry'

// o05 — вхід (рішення Макса 02.11): email + пароль, «Войти через Google», «Войти через Apple»; без passkey.
// Тексти помилок — з застосунку (sign-in). Помилки в прототипі:
//   стан екрана «Ошибка» — невірний пароль (одразу й після «Войти»);
//   сценарій «Нет интернета» / «Слишком много попыток» — після «Войти»;
//   стан «Загрузка» — вхід триває.
// Успіх — стрічка моряка.
type Busy = 'form' | 'google' | 'apple' | null

const DEMO_EMAIL = 'andrii.koval@example.com'

export function O05Login({ go }: ScreenProps) {
  const { state, bag, setBag } = useProto()
  const view = useView()
  const later = useLater()
  const [email, setEmail] = useState(() => bag<string>('o.email', ''))
  const [pass, setPass] = useState('')
  const [err, setErr] = useState<{ email?: string; pass?: string }>({})
  const [formErr, setFormErr] = useState<string | null>(null)
  const [busy, setBusy] = useState<Busy>(null)

  // Стани з панелі: показати екран одразу в потрібному стані.
  useEffect(() => {
    if (view === 'error' || view === 'loading') {
      setEmail((e) => e || DEMO_EMAIL)
      setPass((p) => p || 'parol-1234')
    }
    setFormErr(view === 'error' ? AUTH_ERR.wrong : null)
    setBusy(view === 'loading' ? 'form' : null)
  }, [view])

  const failure = () => (state.scenario === 'offline' ? AUTH_ERR.offline : state.scenario === 'rate' ? AUTH_ERR.rate : view === 'error' ? AUTH_ERR.wrong : null)

  const submit = () => {
    const e = email.trim()
    const next = {
      email: !e ? AUTH_ERR.emailEmpty : !emailOk(e) ? AUTH_ERR.emailInvalid : undefined,
      pass: !pass ? AUTH_ERR.passEmpty : undefined,
    }
    setErr(next)
    setFormErr(null)
    if (next.email || next.pass) return
    setBag('o.email', e)
    setBusy('form')
    later(() => {
      setBusy(null)
      const f = failure()
      if (f) setFormErr(f)
      else go(MOBILE_ROUTES.feed)
    })
  }

  // Google / Apple: системне вікно входу в прототипі не малюємо — коротке очікування і стрічка.
  const social = (who: 'google' | 'apple') => {
    setFormErr(null)
    setBusy(who)
    later(() => {
      setBusy(null)
      if (state.scenario === 'offline') setFormErr(AUTH_ERR.offline)
      else go(MOBILE_ROUTES.feed)
    })
  }

  const wrong = formErr === AUTH_ERR.wrong
  const spin = <LoaderCircle className="size-5 animate-spin" />

  return (
    <div className="flex h-full flex-col">
      <NavBar onBack={() => go('o02')} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-2 pb-4">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Вход</h1>

        <form
          className="mt-7 flex flex-col gap-5"
          noValidate
          onSubmit={(ev) => {
            ev.preventDefault()
            submit()
          }}
        >
          <AuthField id="o05-email" label="Email" error={err.email}>
            <AuthInput
              id="o05-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              invalid={!!err.email || wrong}
              disabled={!!busy}
              onChange={(e) => {
                setEmail(e.target.value)
                setErr((x) => ({ ...x, email: undefined }))
              }}
            />
          </AuthField>
          <AuthField
            id="o05-pass"
            label="Пароль"
            error={err.pass}
            aside={
              <button
                type="button"
                className="text-sm font-medium text-primary"
                onClick={() => {
                  if (email.trim()) setBag('o.email', email.trim())
                  go('o06')
                }}
              >
                Забыли пароль?
              </button>
            }
          >
            <PasswordInput
              id="o05-pass"
              autoComplete="current-password"
              value={pass}
              invalid={!!err.pass || wrong}
              disabled={!!busy}
              onChange={(e) => {
                setPass(e.target.value)
                setErr((x) => ({ ...x, pass: undefined }))
              }}
            />
          </AuthField>

          {formErr && <FormAlert>{formErr}</FormAlert>}

          <Button type="submit" size="lg" className="mt-1" disabled={!!busy} aria-busy={busy === 'form'}>
            {busy === 'form' ? <>{spin} Входим…</> : 'Войти'}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-sm text-muted-foreground" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          или
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-3">
          <Button size="lg" variant="outline" disabled={!!busy} aria-busy={busy === 'google'} onClick={() => social('google')}>
            {busy === 'google' ? spin : <GoogleMark />} Войти через Google
          </Button>
          <Button size="lg" variant="outline" disabled={!!busy} aria-busy={busy === 'apple'} onClick={() => social('apple')}>
            {busy === 'apple' ? spin : <AppleMark />} Войти через Apple
          </Button>
        </div>

        <p className="mt-auto pt-8 text-center text-[15px] text-muted-foreground">
          Нет аккаунта?{' '}
          <button type="button" className="font-semibold text-primary" onClick={() => go('o02')}>
            Зарегистрироваться
          </button>
        </p>
      </div>
    </div>
  )
}
