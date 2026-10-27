import { StepShell } from '@/components/app/stepper'
import type { ScreenProps } from '../registry'
import { DocStep, ScrollParam } from './_extra-parts'

// s8 — «Дополнительные сертификаты» (C: docStep(8)): ІІ розпізнає або ввести вручну,
// список доданих. Чипів «Обычно просят агентства» немає (прибрано 27.10).

export function S8ExtraCerts({ go }: ScreenProps) {
  return (
    <StepShell step={8} go={go} optional>
      <ScrollParam />
      <DocStep
        n={8}
        upT="Загрузите сертификаты"
        upS="Фото, скан или PDF — ИИ распознает тип и сроки"
        recSeq={['ECDIS', 'High Voltage', 'DP Basic']}
      />
    </StepShell>
  )
}
