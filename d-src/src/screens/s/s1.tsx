import { useState } from 'react'
import { CircleAlert, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Footer } from '@/components/app/chrome'
import { StepShell } from '@/components/app/stepper'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { CheckRow, Field, Hint, QSheet, TextInput, useTimers } from '../q/_parts'
import { emailOk, type Acct } from '../q/q06'
import { LEGAL, useS } from './_core-parts'

// s1 — крок 1 «Аккаунт» (C: acctFields + дві галочки згоди). Ті самі правила, що в q06:
// email, пароль із лічильником сили, повтор. Сценарій «Email уже занят» — помилка після виходу
// з поля email і після «Продолжить», з виходами «Войти» / «Восстановить пароль».
// Аккаунт створюється лише після коду з листа (s1c).

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

export function S1Account({ go }: ScreenProps) {
  const { state, bag, setBag, showToast } = useS()
  const a = bag<Acct>('s1.acct', { email: '', pass: '', pass2: '' })
  const c = bag('s1.consent', { terms: false, data: false })
  const put = (patch: Partial<Acct>) => setBag('s1.acct', { ...a, ...patch })
  const [show, setShow] = useState(false)
  const [emailFocus, setEmailFocus] = useState(false)
  const [p2blur, setP2blur] = useState(false)
  const [taken, setTaken] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sheet, setSheet] = useState<'login' | 'consent' | null>(null)
  const { later } = useTimers()

  const isTakenScenario = state.scenario === 'emailTaken'
  const badEmail = !!a.email && !emailOk(a.email) && !emailFocus
  const s = strength(a.pass)
  const left = 8 - a.pass.length
  const word = left === 1 ? 'символ' : left >= 2 && left <= 4 ? 'символа' : 'символов'
  const passMsg = !a.pass ? '' : left > 0 ? `Ещё ${left} ${word}` : METER_TEXT[s]
  const mism = !!a.pass2 && a.pass2 !== a.pass && (p2blur || a.pass2.length >= a.pass.length)
  const match = !!a.pass2 && a.pass2 === a.pass
  const both = c.terms && c.data
  const valid = emailOk(a.email) && a.pass.length >= 8 && a.pass2 === a.pass && both && !taken

  const miss = [!emailOk(a.email) && 'email', a.pass.length < 8 ? 'пароль' : a.pass2 !== a.pass && 'повтор пароля', !both && 'согласия'].filter(Boolean)

  const next = () => {
    setCreating(true)
    later(() => {
      setCreating(false)
      if (isTakenScenario) setTaken(true)
      else go('s1c')
    }, 900)
  }

  const recover = () => {
    setSheet(null)
    showToast('Ссылка для восстановления отправлена')
  }

  const eye = (
    <button
      type="button"
      aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
      onClick={() => setShow(!show)}
      className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground"
    >
      {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </button>
  )
  const link = 'text-primary underline underline-offset-4'

  return (
    <StepShell
      step={1}
      go={go}
      footer={
        <Footer className="border-t border-border bg-surface">
          <Button size="lg" disabled={!valid || creating} aria-busy={creating} onClick={next}>
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
    >
      <Field id="s1-email" label="Email" error={badEmail && !taken ? 'Проверьте адрес — похоже, в нём опечатка' : null}>
        <TextInput
          id="s1-email"
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
        <div role="alert" className="flex flex-col gap-3 rounded-md border border-signal bg-surface px-4 py-3">
          <p className="flex items-center gap-2 text-[15px] font-medium text-signal">
            <CircleAlert className="size-5 shrink-0" />
            Этот email уже зарегистрирован
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-11" onClick={() => setSheet('login')}>
              Войти
            </Button>
            <Button variant="outline" className="h-11" onClick={recover}>
              Восстановить пароль
            </Button>
          </div>
        </div>
      )}

      <Field id="s1-pass" label="Пароль" note={passMsg}>
        <div className="relative">
          <TextInput
            id="s1-pass"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Не менее 8 символов"
            value={a.pass}
            className="pr-12"
            onChange={(e) => put({ pass: e.target.value })}
          />
          {eye}
        </div>
        <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn('h-1 rounded-full', i < s ? METER[s] : 'bg-border')} />
          ))}
        </div>
      </Field>

      <Field id="s1-pass2" label="Повторите пароль" error={mism ? 'Пароли не совпадают' : null}>
        <div className="relative">
          <TextInput
            id="s1-pass2"
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

      <div className="mt-3 flex flex-col gap-4 border-t border-border pt-5">
        <CheckRow id="s1-terms" checked={c.terms} onChange={(v) => setBag('s1.consent', { ...c, terms: v })}>
          Принимаю{' '}
          <a href="#" className={link} onClick={(e) => e.preventDefault()}>
            Условия сервиса
          </a>{' '}
          и{' '}
          <a href="#" className={link} onClick={(e) => e.preventDefault()}>
            Политику конфиденциальности
          </a>
        </CheckRow>
        <CheckRow id="s1-data" checked={c.data} onChange={(v) => setBag('s1.consent', { ...c, data: v })}>
          Согласен на обработку документов, включая чтение ИИ
        </CheckRow>
        <button type="button" className="self-start text-[15px] font-medium text-primary" onClick={() => setSheet('consent')}>
          Подробнее о согласии
        </button>
      </div>

      <QSheet open={sheet === 'consent'} onClose={() => setSheet(null)} title="Согласие на обработку данных">
        <div className="flex flex-col gap-3 text-[15px] leading-relaxed">
          {LEGAL.map(([b, t]) => (
            <p key={b}>
              <span className="font-semibold">{b}</span> {t}
            </p>
          ))}
          <p className="text-sm text-muted-foreground">Черновик. Окончательный текст готовит юрист.</p>
        </div>
        <Button size="lg" className="mt-6" onClick={() => setSheet(null)}>
          Понятно
        </Button>
      </QSheet>

      <QSheet open={sheet === 'login'} onClose={() => setSheet(null)} title="Вход">
        <div className="flex flex-col gap-4">
          <Field id="s1-login-email" label="Email">
            <TextInput id="s1-login-email" type="email" placeholder="you@example.com" defaultValue={a.email} />
          </Field>
          <Field id="s1-login-pass" label="Пароль">
            <TextInput id="s1-login-pass" type="password" />
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
    </StepShell>
  )
}
