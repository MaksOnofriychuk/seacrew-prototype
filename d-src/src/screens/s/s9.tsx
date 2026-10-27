import { StepShell } from '@/components/app/stepper'
import type { ScreenProps } from '../registry'
import { DocStep, ScrollParam } from './_extra-parts'

// s9 — «Флаговые документы» (C: docStep(9)): подтверждения флагов и книжки других стран.

export function S9FlagDocs({ go }: ScreenProps) {
  return (
    <StepShell step={9} go={go} optional>
      <ScrollParam />
      <DocStep
        n={9}
        upT="Загрузите флаговый документ"
        upS="Подтверждения флагов и книжки других стран"
        recSeq={['Liberia Endorsement', 'Panama Endorsement', 'Malta Endorsement']}
      />
    </StepShell>
  )
}
