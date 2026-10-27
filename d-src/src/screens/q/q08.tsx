import { CircleCheck } from 'lucide-react'
import { Wordmark } from '@/components/app/chrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from '../registry'
import { DOC_TYPES, Footer, readiness, ReadinessBlock, type DocTypeId, type QForm, useQ } from './_parts'

// q08 — аккаунт створено: файли перенесені до моряка й зашифровані, підтверджене — у профілі.
// Нижче — прогрес заповнення профілю. Без конфеті й кільця з C: лише статичний знак.
export function Q08Done({ go }: ScreenProps) {
  const { state, bag } = useQ()
  const form = bag<{ v: QForm } | null>('q.form', null)
  const first = String(form?.v.first ?? 'Andrii').trim()
  const r = readiness(false)

  const rows: [string, string][] = [
    ['Email', 'подтверждён'],
    ['Данные из документов', 'в профиле'],
    ['CV', 'зашифровано'],
    [DOC_TYPES[state.docType as DocTypeId].n, 'зашифровано'],
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center px-6">
        <Wordmark />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-6">
        <CircleCheck className="size-14 text-success" strokeWidth={1.5} />
        <h1 className="mt-5 text-[32px] leading-[1.1] font-semibold tracking-tight">Аккаунт создан</h1>
        <p className="mt-3 text-base text-muted-foreground">Добро пожаловать, {first || 'моряк'}!</p>

        <ul className="mt-8 rounded-xl border border-border bg-surface px-4">
          {rows.map(([t, v]) => (
            <li key={t} className="flex items-center justify-between gap-3 border-t border-border py-3.5 first:border-t-0">
              <span className="text-[15px]">{t}</span>
              <Badge variant="success">{v}</Badge>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <ReadinessBlock pct={r.pct} />
        </div>
      </div>
      <Footer>
        <Button size="lg" onClick={() => go('q09')}>
          Перейти в профиль
        </Button>
      </Footer>
    </div>
  )
}
