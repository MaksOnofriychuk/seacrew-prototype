import { StepShell } from './_stepper'
import type { ScreenProps } from '../registry'
import { DocStep, ScrollParam } from './_extra-parts'

// s9 — «Подфлажные документы» (правка №28; C: docStep(9)): подфлажные паспорта, разрешения на работу, другое.

export function S9FlagDocs({ go }: ScreenProps) {
  return (
    <StepShell step={9} go={go} optional>
      <ScrollParam />
      <DocStep
        n={9}
        upT="Сфотографируйте или загрузите подфлажный документ."
        upS="Паспорт, разрешение на работу или другой документ"
        recSeq={['Liberia Endorsement', 'Panama Endorsement', 'Malta Endorsement']}
      />
    </StepShell>
  )
}
