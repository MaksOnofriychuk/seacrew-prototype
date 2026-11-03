import { useState } from 'react'
import { CircleAlert, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { StepShell } from '../s/_stepper'
import { LEGAL } from '../s/_core-parts'
import { CheckRow, Field, FlowScreen, Footer, Hint, QSheet, TextInput, Title, useTimers, useQ } from './_parts'

// «Создайте аккаунт» — один экран для двух потоков: быстрая регистрация (q06) и пошаговая (s1).
// Email, пароль с индикатором силы, повтор, сценарий «Email уже занят», отдельные «глаза» у каждого поля.
// Разница потоков — в пропсах: flow="quick" — свой прогресс, согласие отдельным экраном q02,
// «Продолжить» ведёт на q07, занятый email — на вход/восстановление (o05/o06);
// flow="step" — шапка шага StepShell, две галочки согласия, «Продолжить» ведёт на s1c, вход — в нижнем окне.
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

const METER = ['', 'bg-signal', 'bg-warning', 'bg-[color-mix(in_oklab,var(--warning),var(--success))]', 'bg-success']
const METER_TEXT = ['', 'Слабый пароль', 'Нормальный пароль', 'Хороший пароль', 'Надёжный пароль']

const FLOWS = {
  quick: { next: 'q07', bag: 'q.acct' },
  step: { next: 's1c', bag: 's1.acct' },
} as const

function AccountScreen({ go, flow }: ScreenProps & { flow: keyof typeof FLOWS }) {
  const cfg = FLOWS[flow]
  const step = flow === 'step'
  const { state, bag, setBag, showToast } = useQ()
  const a = bag<Acct>(cfg.bag, { email: '', pass: '', pass2: '' })
  const c = bag('s1.consent', { terms: false, data: false })
  const put = (patch: Partial<Acct>) => setBag(cfg.bag, { ...a, ...patch })
  const [show, setShow] = useState({ pass: false, pass2: false })
  const [emailFocus, setEmailFocus] = useState(false)
  const [p2blur, setP2blur] = useState(false)
  const [taken, setTaken] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sheet, setSheet] = useState<'login' | 'consent' | null>(null)
  const { later } = useTimers()
  const id = (n: string) => `${step ? 's1' : 'q06'}-${n}`

  const isTakenScenario = state.scenario === 'emailTaken'
  const badEmail = !!a.email && !emailOk(a.email) && !emailFocus
  const s = strength(a.pass)
  const left = 8 - a.pass.length
  const word = left === 1 ? 'символ' : left >= 2 && left <= 4 ? 'символа' : 'символов'
  const passMsg = !a.pass ? '' : left > 0 ? `Ещё ${left} ${word}` : METER_TEXT[s]
  const mism = !!a.pass2 && a.pass2 !== a.pass && (p2blur || a.pass2.length >= a.pass.length)
  const match = !!a.pass2 && a.pass2 === a.pass
  const both = !step || (c.terms && c.data)
  const valid = emailOk(a.email) && a.pass.length >= 8 && a.pass2 === a.pass && both && !taken

  const miss = [!emailOk(a.email) && 'email', a.pass.length < 8 ? 'пароль' : a.pass2 !== a.pass && 'повтор пароля', !both && 'согласия'].filter(Boolean)

  const next = () => {
    setCreating(true)
    later(() => {
      setCreating(false)
      if (isTakenScenario) setTaken(true)
      else go(cfg.next)
    }, 900)
  }

  // Аккаунт с этим email уже есть. Быстрый поток: на вход или восстановление (o05/o06) с тем же email.
  // Пошаговый: вход в нижнем окне, восстановление — тост.
  const toAuth = (to: 'o05' | 'o06') => {
    setBag('o.email', a.email.trim())
    go(to)
  }
  const recover = () => {
    setSheet(null)
    showToast('Ссылка для восстановления отправлена')
  }

  const eye = (k: 'pass' | 'pass2') => (
    <button
      type="button"
      aria-label={show[k] ? 'Скрыть пароль' : 'Показать пароль'}
      onClick={() => setShow({ ...show, [k]: !show[k] })}
      className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground"
    >
      {show[k] ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </button>
  )
  const link = 'text-primary underline underline-offset-4'

  const footer = (
    <Footer className={cn('border-t border-border', step ? 'bg-background' : 'pt-4')}>
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
  )

  const fields = (
    <>
      <Field id={id('email')} label="Email" error={badEmail && !taken ? 'Проверьте адрес — похоже, в нём опечатка' : null}>
        <TextInput
          id={id('email')}
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
          <div className="grid grid-cols-[1fr_1.5fr] gap-2">
            <Button variant="outline" className="h-11" onClick={() => (step ? setSheet('login') : toAuth('o05'))}>
              Войти
            </Button>
            <Button variant="outline" className="h-11" onClick={() => (step ? recover() : toAuth('o06'))}>
              Восстановить пароль
            </Button>
          </div>
        </div>
      )}

      <Field id={id('pass')} label="Пароль" note={passMsg}>
        <div className="relative">
          <TextInput id={id('pass')} type={show.pass ? 'text' : 'password'} autoComplete="new-password" placeholder="Не менее 8 символов" value={a.pass} className="pr-12" onChange={(e) => put({ pass: e.target.value })} />
          {eye('pass')}
        </div>
        <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn('h-1 rounded-full', i < s ? METER[s] : 'bg-border')} />
          ))}
        </div>
      </Field>

      <Field id={id('pass2')} label="Повторите пароль" error={mism ? 'Пароли не совпадают' : null} note={match ? <span className="text-success">Пароли совпадают</span> : null}>
        <div className="relative">
          <TextInput
            id={id('pass2')}
            type={show.pass2 ? 'text' : 'password'}
            autoComplete="new-password"
            value={a.pass2}
            invalid={mism}
            className="pr-12"
            onBlur={() => setP2blur(true)}
            onChange={(e) => put({ pass2: e.target.value })}
          />
          {eye('pass2')}
        </div>
      </Field>
    </>
  )

  if (!step) {
    return (
      <FlowScreen step={4} onBack={() => go('q05')} footer={footer}>
        <Title sub="Email и пароль. На почту придёт код подтверждения.">Создайте аккаунт</Title>
        <div className="mt-7 flex flex-col gap-5">{fields}</div>
      </FlowScreen>
    )
  }

  return (
    <StepShell step={1} go={go} footer={footer}>
      {fields}

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

export const Q06Account = (p: ScreenProps) => <AccountScreen {...p} flow="quick" />
export const S1Account = (p: ScreenProps) => <AccountScreen {...p} flow="step" />
