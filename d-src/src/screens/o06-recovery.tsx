import { useEffect, useState } from 'react'
import { LoaderCircle, MailCheck } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { useView } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { useProto } from '@/lib/proto-state'
import { AUTH_ERR, AuthField, AuthInput, emailOk, FormAlert, useLater } from './o-auth-parts'
import type { ScreenProps } from './registry'

// o06 — відновлення пароля: email → «Отправить ссылку» → стан «Проверьте почту».
// Чи є такий акаунт, не кажемо (щоб не підбирали адреси) — текст однаковий для будь-якого email.
// Стан «Ошибка» з панелі або сценарій «Нет интернета» — помилка відправки; ?sent=1 — одразу «Проверьте почту».
const RESEND_SEC = 59

export function O06Recovery({ go }: ScreenProps) {
  const { state, bag, setBag, showToast } = useProto()
  const view = useView()
  const later = useLater()
  const [email, setEmail] = useState(() => bag<string>('o.email', ''))
  const [err, setErr] = useState<string | null>(null)
  const [formErr, setFormErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(() => new URLSearchParams(location.hash.split('?')[1]).get('sent') === '1')
  const [left, setLeft] = useState(RESEND_SEC)

  useEffect(() => {
    setFormErr(view === 'error' ? AUTH_ERR.offline : null)
    setBusy(view === 'loading')
    if (view !== 'normal') setSent(false)
  }, [view])

  // Відлік до «Отправить ещё раз».
  useEffect(() => {
    if (!sent || left <= 0) return
    const t = window.setTimeout(() => setLeft((n) => n - 1), 1000)
    return () => window.clearTimeout(t)
  }, [sent, left])

  const send = () => {
    const e = email.trim()
    const msg = !e ? AUTH_ERR.emailEmpty : !emailOk(e) ? AUTH_ERR.emailInvalid : null
    setErr(msg)
    setFormErr(null)
    if (msg) return
    setBag('o.email', e)
    setBusy(true)
    later(() => {
      setBusy(false)
      if (state.scenario === 'offline' || view === 'error') return setFormErr(AUTH_ERR.offline)
      setLeft(RESEND_SEC)
      setSent(true)
    })
  }

  if (sent) {
    const shown = email.trim() || 'andrii.koval@example.com'
    return (
      <div className="flex h-full flex-col">
        <NavBar onBack={() => setSent(false)} />
        <div className="flex flex-1 flex-col px-6 pt-2">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-primary">
            <MailCheck className="size-6" />
          </span>
          <h1 className="mt-5 text-[32px] leading-[1.1] font-semibold tracking-tight">Проверьте почту</h1>
          <p className="mt-3 text-base text-muted-foreground">Отправили ссылку для нового пароля на</p>
          <p className="mt-1 text-base font-medium [overflow-wrap:anywhere]">{shown}</p>
          <p className="mt-4 text-[15px] text-muted-foreground">
            Письма нет? Загляните в «Спам» или отправьте ещё раз. Если аккаунта с этим адресом нет, письмо не придёт.
          </p>
        </div>
        <Footer>
          <Button size="lg" onClick={() => go('o05')}>
            Вернуться ко входу
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-primary"
            disabled={left > 0}
            onClick={() => {
              setLeft(RESEND_SEC)
              showToast('Ссылка отправлена ещё раз')
            }}
          >
            {left > 0 ? (
              <>
                Отправить ещё раз через <span className="font-mono">0:{String(left).padStart(2, '0')}</span>
              </>
            ) : (
              'Отправить ещё раз'
            )}
          </Button>
        </Footer>
      </div>
    )
  }

  return (
    <form
      className="flex h-full flex-col"
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault()
        send()
      }}
    >
      <NavBar onBack={() => go('o05')} />
      <div className="flex flex-1 flex-col px-6 pt-2">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight text-balance">Восстановление пароля</h1>
        <p className="mt-3 text-base text-muted-foreground">Укажите email аккаунта — пришлём ссылку, чтобы задать новый пароль.</p>
        <div className="mt-7 flex flex-col gap-5">
          <AuthField id="o06-email" label="Email" error={err}>
            <AuthInput
              id="o06-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              invalid={!!err}
              disabled={busy}
              onChange={(e) => {
                setEmail(e.target.value)
                setErr(null)
              }}
            />
          </AuthField>
          {formErr && <FormAlert>{formErr}</FormAlert>}
        </div>
      </div>
      <Footer>
        <Button type="submit" size="lg" disabled={busy} aria-busy={busy}>
          {busy ? (
            <>
              <LoaderCircle className="size-5 animate-spin" /> Отправляем…
            </>
          ) : (
            'Отправить ссылку'
          )}
        </Button>
      </Footer>
    </form>
  )
}
