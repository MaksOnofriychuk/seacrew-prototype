import { useState } from 'react'
import { Check, Circle, Clock } from 'lucide-react'
import { Wordmark } from '@/components/app/chrome'
import { Paper } from '@/components/app/paper'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from '../registry'
import { DOC_TYPES, Footer, Note, Q_KEYS, QSheet, type DocTypeId, useQ } from './_parts'

// q11 — моряк повернувся на тому ж телефоні, не закінчивши швидку реєстрацію (до 30 днів).
// «Начать заново» одразу видаляє файли й прочитане; ліміт спроб не обнуляється.
export function Q11Resume({ go }: ScreenProps) {
  const { state, set, setBag } = useQ()
  const [restart, setRestart] = useState(false)

  const rows: [boolean, string, string?][] = [
    [true, 'CV', 'загружено'],
    [true, DOC_TYPES[state.docType as DocTypeId].n, 'загружено'],
    [false, 'Проверка данных, аккаунт и код'],
  ]

  const resume = () => {
    // Файли вже завантажені — q05 відкривається з прочитаними даними.
    setBag('q.cv', { st: 'done', p: 100 })
    setBag('q.doc', { st: 'done', p: 100, pages: 1 })
    go('q05')
  }

  const wipe = () => {
    Q_KEYS.forEach((k) => setBag(k, null))
    set({ docType: 'sid' })
    go('o02')
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center px-6">
        <Wordmark />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-6">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Продолжим регистрацию?</h1>
        <p className="mt-3 text-base text-muted-foreground">Вы начали быструю регистрацию 2 дня назад.</p>

        <Paper title="Быстрая регистрация" className="mt-8">
          <ul className="-my-1">
            {rows.map(([ok, t, v]) => (
              <li key={t} className="flex items-center gap-3 border-t border-border py-3 first:border-t-0">
                {ok ? <Check className="size-5 shrink-0 text-success" /> : <Circle className="size-5 shrink-0 text-border" />}
                <span className={ok ? 'flex-1 text-[15px]' : 'flex-1 text-[15px] text-muted-foreground'}>{t}</span>
                {v && <span className="text-sm text-muted-foreground">{v}</span>}
              </li>
            ))}
          </ul>
        </Paper>

        <Note icon={Clock} tone="warning" className="mt-4">
          Если не закончить, файлы удалятся через <span className="font-mono font-medium">28</span> <span className="font-medium">дней</span>.
        </Note>
      </div>
      <Footer>
        <Button size="lg" onClick={resume}>
          Продолжить
        </Button>
        <Button size="lg" variant="ghost" className="text-signal hover:text-signal" onClick={() => setRestart(true)}>
          Начать заново
        </Button>
      </Footer>
      <QSheet
        open={restart}
        onClose={() => setRestart(false)}
        title="Начать заново?"
        description="Загруженные файлы и прочитанные данные удалятся сразу. Это нельзя отменить. Число попыток регистрации с этого телефона при этом не обнуляется."
      >
        <div className="flex flex-col gap-3">
          <Button size="lg" variant="outline" className="border-signal text-signal hover:text-signal" onClick={wipe}>
            Удалить и начать заново
          </Button>
          <Button size="lg" variant="ghost" className="text-primary" onClick={() => setRestart(false)}>
            Отмена
          </Button>
        </div>
      </QSheet>
    </div>
  )
}
