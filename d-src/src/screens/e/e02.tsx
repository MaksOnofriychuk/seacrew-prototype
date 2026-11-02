import { useEffect } from 'react'
import { FileQuestion, GraduationCap, IdCard, TriangleAlert } from 'lucide-react'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../registry'
import { BlockTitle, ErrorLayout, RetryActions } from './_error-layout'

// e02 — ІІ бачить інший тип документа (qError('e02') у C).
// Правка №12: це перша помилка — попереджаємо, що друга поспіль заблокує акаунт (e08).
// Лічильник — bag 'q.wrongDocs'; сценарій лишається «Это не документ моряка», тож наступне
// читання (q04) веде на e08. Успішне читання лічильник обнуляє.
// Блок «Подойдёт» — два документи, які приймаємо (назви з DOC_TYPES у C).
const FITS = [
  { icon: IdCard, title: 'Удостоверение личности моряка', en: "Seafarer's ID" },
  { icon: GraduationCap, title: 'Диплом моряка', en: 'Diploma / CoC | CoP' },
]

export function E02NotSeafarer({ go }: ScreenProps) {
  const { state, set, bag, setBag } = useProto()

  useEffect(() => {
    if (bag<number>('q.wrongDocs', 0) < 1) setBag('q.wrongDocs', 1)
    if (state.scenario !== 'notSeafarer') set({ scenario: 'notSeafarer' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ErrorLayout
      icon={FileQuestion}
      tone="signal"
      title="Это не документ моряка"
      text="Загрузите удостоверение или диплом."
      onBack={() => go('q03')}
      actions={<RetryActions go={go} keepScenario />}
    >
      <p role="alert" className="mt-5 flex items-start gap-3 rounded-md bg-warning/10 px-4 py-3 text-[15px] leading-snug">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        Ещё одна ошибка — и аккаунт будет заблокирован
      </p>
      <BlockTitle>Подойдёт</BlockTitle>
      <ul className="mt-3 rounded-xl border border-border bg-surface px-4">
        {FITS.map((d) => (
          <li key={d.title} className="flex items-center gap-4 border-t border-border py-3 first:border-t-0">
            <d.icon className="size-6 shrink-0 text-primary" strokeWidth={1.75} />
            <span className="flex flex-col">
              <span className="text-[15px] font-medium">{d.title}</span>
              <span className="text-sm text-muted-foreground">{d.en}</span>
            </span>
          </li>
        ))}
      </ul>
    </ErrorLayout>
  )
}
