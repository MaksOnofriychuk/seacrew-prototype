import { Group } from '@/components/app/group'
import { StepShell } from '@/components/app/stepper'
import type { ScreenProps } from '../registry'
import { SourceTag, TextInput } from '../q/_parts'
import { AddPanel, ScrollParam, useBag, XField } from './_extra-parts'

// s10 — «Образование» (C: step 10): завантажити диплом (ІІ візьме поля) або заповнити вручну.
// Поля — як справжній папір «Диплом об образовании». Після розпізнавання поля заповнені
// з міткою «из документа»; виправлене моряком — «исправлено вами».

type Edu = { inst: string; spec: string; from: string; to: string; src: boolean }
const EMPTY: Edu = { inst: '', spec: '', from: '', to: '', src: false }
// Вигадані дані «з документа».
const REC = { inst: 'Морская академия', spec: 'Судовые энергетические установки', from: '2008', to: '2013' }

const year = (v: string) => v.replace(/\D/g, '').slice(0, 4)

export function S10Education({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useBag()
  const f = bag<Edu>('s10.form', EMPTY)
  const patch = (p: Partial<Edu>) => setBag('s10.form', { ...f, ...p })

  // C: up:10 — «Документ распознан (пример)».
  const upload = () => {
    setBag('s10.form', { ...REC, src: true })
    showToast('Документ распознан (пример)')
  }

  const tag = (k: keyof typeof REC) => (!f.src || !f[k] ? null : <SourceTag kind={f[k] === REC[k] ? 'doc' : 'edited'} />)

  return (
    <StepShell step={10} go={go} optional>
      <ScrollParam />
      <AddPanel n={10} title="Загрузите диплом об образовании" sub="ИИ возьмёт учебное заведение, специальность и годы" onUpload={upload} />

      <Group title="Диплом об образовании">
        <div className="flex flex-col gap-4 py-1">
          <XField id="s10-inst" label="Учебное заведение" tag={tag('inst')}>
            <TextInput id="s10-inst" value={f.inst} onChange={(e) => patch({ inst: e.target.value })} placeholder="Одесская морская академия" />
          </XField>
          <XField id="s10-spec" label="Специальность" tag={tag('spec')}>
            <TextInput id="s10-spec" value={f.spec} onChange={(e) => patch({ spec: e.target.value })} placeholder="Судовые энергоустановки" />
          </XField>
          <div className="grid grid-cols-2 gap-3">
            <XField id="s10-from" label="Начало" tag={tag('from')}>
              <TextInput id="s10-from" mono inputMode="numeric" value={f.from} onChange={(e) => patch({ from: year(e.target.value) })} placeholder="ГГГГ" />
            </XField>
            <XField id="s10-to" label="Окончание" tag={tag('to')}>
              <TextInput id="s10-to" mono inputMode="numeric" value={f.to} onChange={(e) => patch({ to: year(e.target.value) })} placeholder="ГГГГ" />
            </XField>
          </div>
        </div>
      </Group>
    </StepShell>
  )
}
