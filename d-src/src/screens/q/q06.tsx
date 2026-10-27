import { useState } from 'react'
import { CircleAlert, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { Field, FlowScreen, Footer, Hint, QSheet, TextInput, Title, useTimers, useToast, useQ } from './_parts'

// q06 — email, пароль, повтор пароля. Сценарій «Email уже занят» — помилка одразу після
// виходу з поля email (і після «Продолжить») з двома виходами: «Войти» / «Восстановить пароль».
export type Acct = { email: string; pass: string; pass2: string }

export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)

function strength(p: string) {
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[0-9]/.test(p) && /[a-zA-Zа-яА-Я]/.test(p)) s++
  if (/[^0-9a-zA-Zа-яА-Я]/.test(p)) s++
  return Math.min(4, Math.max(p.length >= 8 ? 1 : 0, s))
}

const METER = ['', 'bg-signal', 'bg-warning', 'bg-primary', 'bg-success']
const METER_TEXT = ['', 'Слабый пароль', 'Нормальный пароль', 'Хороший пароль', 'Надёжный пароль']

export function Q06Account({ go }: ScreenProps) {
  const { state, bag, setBag } = useQ()
  const a = bag<Acct>('q.acct', { email: '', pass: '', pass2: '' })
  const put = (patch: Partial<Acct>) => setBag('q.acct', { ...a, ...patch })
  const [show, setShow] = useState(false)
  const [emailFocus, setEmailFocus] = useState(false)
  const [p2blur, setP2blur] = useState(false)
  const [taken, setTaken] = useState(false)
  const [creating, setCreating] = useState(false)
  const [login, setLogin] = useState(false)
  const { later } = useTimers()
  const { toast, toastNode } = useToast()

  const isTakenScenario = state.scenario === 'emailTaken'
  const badEmail = !!a.email && !emailOk(a.email) && !emailFocus
  const s = strength(a.pass)
  const left = 8 - a.pass.length
  const word = left === 1 ? 'символ' : left >= 2 && left <= 4 ? 'символа' : 'символов'
  const passMsg = !a.pass ? '' : left > 0 ? `Ещё ${left} ${word}` : METER_TEXT[s]
  const mism = !!a.pass2 && a.pass2 !== a.pass && (p2blur || a.pass2.length >= a.pass.length)
  const match = !!a.pass2 && a.pass2 === a.pass
  const valid = emailOk(a.email) && a.pass.length >= 8 && a.pass2 === a.pass && !taken

  const miss = [!emailOk(a.email) && 'email', a.pass.length < 8 ? 'пароль' : a.pass2 !== a.pass && 'повтор пароля'].filter(Boolean)

  const next = () => {
    setCreating(true)
    later(() => {
      setCreating(false)
      if (isTakenScenario) setTaken(true)
      else go('q07')
    }, 900)
  }

  const recover = () => {
    setLogin(false)
    toast('Ссылка для восстановления отправлена')
  }

  const eye = (
    <button type="button" aria-label={show ? 'Скрыть пароль' : 'Показать пароль'} onClick={() => setShow(!show)} className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground">
      {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </button>
  )

  return (
    <FlowScreen
      step={5}
      onBack={() => go('q05')}
      footer={
        <Footer className="border-t border-border pt-4">
          <Button size="lg" disabled={(!valid && !creating) || creating} aria-busy={creating} onClick={next}>
            {creating ? (
              <>
                <LoaderCircle className="size-5 animate-spin" /> Проверяем…
              </>
            ) : (
              'Продолжить'
            )}
          </Button>
          <Hint>{miss.length && !creating ? `Осталось: ${miss.join(', ')}` : ''}</Hint>
        </Footer>
      }
      overlay={
        <>
          {toastNode}
          <QSheet open={login} onClose={() => setLogin(false)} title="Вход">
            <div className="flex flex-col gap-4">
              <Field id="q06-login-email" label="Email">
                <TextInput id="q06-login-email" type="email" placeholder="you@example.com" defaultValue={a.email} />
              </Field>
              <Field id="q06-login-pass" label="Пароль">
                <TextInput id="q06-login-pass" type="password" />
              </Field>
              <Button
                size="lg"
                className="mt-2"
                onClick={() => {
                  if (!a.email) put({ email: 'andrii@example.com' })
                  go('q09')
                }}
              >
                Войти
              </Button>
              <Button size="lg" variant="ghost" className="text-primary" onClick={recover}>
                Восстановить пароль
              </Button>
            </div>
          </QSheet>
        </>
      }
    >
      <Title sub="Email и пароль. На почту придёт код подтверждения.">Создайте аккаунт</Title>

      <div className="mt-7 flex flex-col gap-5">
        <Field id="q06-email" label="Email" error={badEmail && !taken ? 'Проверьте адрес — похоже, в нём опечатка' : null}>
          <TextInput
            id="q06-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={a.email}
            invalid={badEmail || taken}
            onFocus={() => setEmailFocus(true)}
            onBlur={() => {
              setEmailFocus(false)
              if (isTakenScenario && emailOk(a.email)) setTaken(true)
            }}
            onChange={(e) => {
              setTaken(false)
              put({ email: e.target.value })
            }}
          />
        </Field>

        {taken && (
          <div role="alert" className="flex flex-col gap-3 rounded-md border border-signal px-4 py-3">
            <p className="flex items-center gap-2 text-[15px] font-medium text-signal">
              <CircleAlert className="size-5 shrink-0" />
              Этот email уже зарегистрирован
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-11" onClick={() => setLogin(true)}>
                Войти
              </Button>
              <Button variant="outline" className="h-11" onClick={recover}>
                Восстановить пароль
              </Button>
            </div>
          </div>
        )}

        <Field id="q06-pass" label="Пароль" note={passMsg}>
          <div className="relative">
            <TextInput id="q06-pass" type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="Не менее 8 символов" value={a.pass} className="pr-12" onChange={(e) => put({ pass: e.target.value })} />
            {eye}
          </div>
          <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn('h-1 rounded-full', i < s ? METER[s] : 'bg-border')} />
            ))}
          </div>
        </Field>

        <Field id="q06-pass2" label="Повторите пароль" error={mism ? 'Пароли не совпадают' : null}>
          <div className="relative">
            <TextInput
              id="q06-pass2"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={a.pass2}
              invalid={mism}
              className="pr-12"
              onBlur={() => setP2blur(true)}
              onChange={(e) => put({ pass2: e.target.value })}
            />
            {eye}
          </div>
          {match && <p className="text-sm text-success">Пароли совпадают</p>}
        </Field>
      </div>
    </FlowScreen>
  )
}
