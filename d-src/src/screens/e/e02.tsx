import { FileQuestion, GraduationCap, IdCard } from 'lucide-react'
import type { ScreenProps } from '../registry'
import { BlockTitle, ErrorLayout, RetryActions } from './_error-layout'

// e02 — ІІ бачить інший тип документа (qError('e02') у C).
// Блок «Подойдёт» — два документи, які приймаємо (назви з DOC_TYPES у C).
const FITS = [
  { icon: IdCard, title: 'Удостоверение личности моряка', en: "Seafarer's ID" },
  { icon: GraduationCap, title: 'Диплом моряка', en: 'Diploma / CoC | CoP' },
]

export function E02NotSeafarer({ go }: ScreenProps) {
  return (
    <ErrorLayout
      icon={FileQuestion}
      tone="signal"
      title="Это не похоже на документ моряка"
      text="Похоже, это загранпаспорт. Он не подтверждает, что вы моряк."
      onBack={() => go('q03')}
      actions={<RetryActions go={go} />}
    >
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
