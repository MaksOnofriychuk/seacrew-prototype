import { useState } from 'react'
import { Eye, EyeOff, TriangleAlert } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from '../types'
import { Field, TextInput } from '../q/_parts'

// m-delete — «Удаление аккаунта» (gaps №8, вимога App Store; тексти з коду delete-account).
// Пароль обов'язковий. Для показу помилки — пароль коротший за 6 знаків → «Пароль неверный».

export function MDelete({ go }: ScreenProps) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [done, setDone] = useState(false)

  if (done)
    return (
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-20">
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Аккаунт удалён</h1>
          <p className="mt-3 text-base text-muted-foreground">Профиль, документы, формы и сообщения удалены.</p>
        </div>
        <Footer>
          <Button size="lg" onClick={() => go('o01')}>
            На главный экран
          </Button>
        </Footer>
      </div>
    )

  const submit = () => {
    if (password.length < 6) return setError(true)
    setDone(true)
  }

  return (
    <div className="flex h-full flex-col">
      <NavBar title="Удаление аккаунта" onBack={() => go('m-settings')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Удалить аккаунт?</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Ваш профиль, документы, фото, формы и сообщения будут удалены. Первым уничтожается ключ, защищающий фото ваших документов, поэтому ни одну из их копий уже нельзя будет открыть.
        </p>
        <p className="mt-5 flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-[15px] font-medium">
          <TriangleAlert className="size-5 shrink-0 text-warning" />
          Это нельзя отменить.
        </p>
        <div className="mt-6">
          <Field id="del-pass" label="Ваш пароль" error={error ? 'Пароль неверный.' : undefined}>
            <div className="relative">
              <TextInput
                id="del-pass"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                invalid={error}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(false)
                }}
                onKeyDown={(e) => e.key === 'Enter' && password && submit()}
                className="pr-12"
              />
              <button type="button" aria-label={show ? 'Скрыть пароль' : 'Показать пароль'} onClick={() => setShow(!show)} className="absolute top-0 right-0 flex size-12 items-center justify-center text-muted-foreground">
                {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </Field>
        </div>
      </div>
      <Footer>
        <Button size="lg" variant="destructive" disabled={!password} onClick={submit}>
          Удалить мой аккаунт
        </Button>
        <Button size="lg" variant="ghost" className="text-primary" onClick={() => go('m-settings')}>
          Отмена
        </Button>
      </Footer>
    </div>
  )
}
