import { useEffect, useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import { useSteps } from '@/components/app/stepper'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { FlowScreen, Footer, Note, Title, useTimers } from '../q/_parts'
import type { Acct } from '../q/q06'
import { useS } from './_core-parts'

// s1c — код з листа на кроці 1 (qCode у C, той самий екран, що q07, інший onSuccess):
// 6 цифр, діє 15 хвилин, 5 спроб, повторна відправка через 60 с. Вірний код — 123456.
// Успіх: крок 1 позначено готовим, відкривається крок 2 і тост «Аккаунт создан».
// Як у C, екран коду — без шапки кроку: «Назад» і «Изменить email» ведуть на s1.
const EMPTY = ['', '', '', '', '', '']
const fmtCd = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

export function S1cCode({ go }: ScreenProps) {
  const { bag, showToast } = useS()
  const { setDone } = useSteps()
  const email = bag<Acct>('s1.acct', { email: '', pass: '', pass2: '' }).email || 'you@example.com'
  const [code, setCode] = useState(EMPTY)
  const [msg, setMsg] = useState<{ text: string; err: boolean }>({
    text: '',
    err: false,
  })
  const [tries, setTries] = useState(5)
  const [cd, setCd] = useState(60)
  const [busy, setBusy] = useState(false)
  const boxes = useRef<(HTMLInputElement | null)[]>([])
  const { later } = useTimers()

  useEffect(() => {
    boxes.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (cd <= 0) return
    const id = window.setTimeout(() => setCd((c) => Math.max(0, c - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [cd])

  const verify = (digits: string[]) => {
    const c = digits.join('')
    if (c.length < 6 || busy) return
    if (tries <= 0) {
      setMsg({
        text: 'Попытки закончились. Отправьте код ещё раз.',
        err: true,
      })
      return
    }
    setBusy(true)
    setMsg({ text: 'Проверяем…', err: false })
    later(() => {
      setBusy(false)
      if (c === '123456') {
        setDone({ 1: true, skip1: undefined })
        go('s2')
        showToast('Аккаунт создан')
        return
      }
      const left = Math.max(0, tries - 1)
      setTries(left)
      setCode(EMPTY)
      setMsg({
        text: left > 0 ? `Неверный код. Осталось попыток: ${left}` : 'Неверный код. Попытки закончились — отправьте код ещё раз.',
        err: true,
      })
      boxes.current[0]?.focus()
    }, 700)
  }

  const input = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, '')
    if (msg.err) setMsg({ text: '', err: false })
    const next = [...code]
    if (v.length > 1) {
      for (let k = 0; k < v.length && i + k < 6; k++) next[i + k] = v.charAt(k)
      boxes.current[Math.min(5, i + v.length)]?.focus()
    } else {
      next[i] = v
      if (v && i < 5) boxes.current[i + 1]?.focus()
    }
    setCode(next)
    if (next.join('').length === 6) verify(next)
  }

  const back = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      const next = [...code]
      next[i - 1] = ''
      setCode(next)
      boxes.current[i - 1]?.focus()
      e.preventDefault()
    }
  }

  const resend = () => {
    setCd(60)
    setTries(5)
    setCode(EMPTY)
    setMsg({ text: '', err: false })
    showToast('Код отправлен ещё раз')
    boxes.current[0]?.focus()
  }

  return (
    <FlowScreen
      onBack={() => go('s1')}
      footer={
        <Footer>
          <Button size="lg" variant="ghost" className="text-primary" onClick={() => go('s1')}>
            Изменить email
          </Button>
        </Footer>
      }
    >
      <Title
        sub={
          <>
            Мы отправили 6-значный код на <span className="font-medium text-foreground">{email}</span>. Он действует 15 минут.
          </>
        }
      >
        Введите код из письма
      </Title>

      <div className="mt-8 grid grid-cols-6 gap-2" role="group" aria-label="Код из письма">
        {code.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el
            }}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Цифра ${i + 1}`}
            aria-invalid={msg.err || undefined}
            value={d}
            disabled={busy}
            onChange={(e) => input(i, e.target.value)}
            onKeyDown={(e) => back(i, e)}
            onFocus={(e) => e.target.select()}
            className={cn(
              'h-16 w-full rounded-md border bg-surface text-center font-mono text-[28px] font-medium outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary',
              msg.err ? 'border-signal' : d ? 'border-primary' : 'border-border',
            )}
          />
        ))}
      </div>

      <p role="status" className={cn('mt-3 min-h-5 text-sm', msg.err ? 'text-signal' : 'text-muted-foreground')}>
        {msg.text}
      </p>

      <div className="mt-2">
        {cd > 0 ? (
          <span className="text-[15px] text-muted-foreground">
            Отправить ещё раз через <span className="font-mono">{fmtCd(cd)}</span>
          </span>
        ) : (
          <button type="button" className="text-[15px] font-medium text-primary" onClick={resend}>
            Отправить ещё раз
          </button>
        )}
      </div>

      <Note icon={Mail} className="mt-8">
        Письма нет? Загляните в папку «Спам» или «Промоакции».
      </Note>
    </FlowScreen>
  )
}
