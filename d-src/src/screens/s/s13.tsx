import { StepShell } from './_stepper'
import type { ScreenProps } from '../registry'
import { ScrollParam, TextArea, useBag } from './_extra-parts'

// s13 — «Заметки» (C: step 13): одне поле для агентств. Правка №30: доступ уже відкритий — «Видят агентства.»
export function S13Notes({ go }: ScreenProps) {
  const { bag, setBag } = useBag()
  const notes = bag('s13.notes', '')
  return (
    <StepShell step={13} go={go} optional>
      <ScrollParam />
      <div id="f-notes" className="flex flex-col gap-2">
        <TextArea
          aria-label="Заметки"
          rows={6}
          value={notes}
          onChange={(e) => setBag('s13.notes', e.target.value)}
          placeholder="Например: не могу выйти на контракт до 1 декабря; рассматриваю только танкеры"
        />
        <p className="text-sm text-muted-foreground">Видят агентства.</p>
      </div>
    </StepShell>
  )
}
