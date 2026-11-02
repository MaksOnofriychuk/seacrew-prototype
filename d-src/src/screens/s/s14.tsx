import { Send } from 'lucide-react'
import type { ScreenProps } from '../registry'
import { CheckRow, Note } from '../q/_parts'
import { ScrollParam, useBag } from './_extra-parts'
import { StepShell } from './_stepper'

// s14 — «Характеристики, промоушены» (Promotions / appraisals), правки №27 і №30.
// Лише галочка «есть»: агентства бачать тільки її. Самі документи моряк надсилає агентству сам,
// після відгуку на вакансію, — тут файлів немає.

export function S14References({ go }: ScreenProps) {
  const { bag, setBag } = useBag()
  const has = bag('s14.has', false)
  return (
    <StepShell step={14} go={go} optional>
      <ScrollParam />
      <div id="f-ref" className="rounded-xl border border-border bg-surface px-4 py-4">
        <CheckRow id="s14-has" checked={has} onChange={(v) => setBag('s14.has', v)}>
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">Есть характеристики или промоушены</span>
            <span className="text-sm text-muted-foreground">Агентства увидят только эту отметку</span>
          </span>
        </CheckRow>
      </div>
      <Note icon={Send}>Сами документы загружать не нужно. Отправите их агентству после отклика на вакансию, если попросят.</Note>
    </StepShell>
  )
}
