import { StepShell } from '@/components/app/stepper'
import { Badge } from '@/components/ui/badge'
import type { ScreenProps } from '../registry'
import { TextInput } from '../q/_parts'
import { ScrollParam, Section, useBag, XField, XSelect } from './_extra-parts'

// s12 — «Дополнительная информация» (C: step 12): рост, вес, размеры; ближайший аэропорт;
// близкий человек. Правка п. 13: у близкого человека — «Имя и фамилия», «Кем приходится»,
// «Телефон», «Email» (необязательно), «Адрес». Адресу самого моряка тут немає.

type Info = { height: string; weight: string; suit: string; shoe: string; airport: string; kinName: string; kinRel: string; kinPhone: string; kinEmail: string; kinAddr: string }
const EMPTY: Info = { height: '', weight: '', suit: '', shoe: '', airport: '', kinName: '', kinRel: '', kinPhone: '', kinEmail: '', kinAddr: '' }
const SUITS = ['M', 'L', 'XL', 'XXL'] as const

const num = (v: string, n: number) => v.replace(/\D/g, '').slice(0, n)

export function S12Extra({ go }: ScreenProps) {
  const { bag, setBag } = useBag()
  const f = bag<Info>('s12.form', EMPTY)
  const patch = (p: Partial<Info>) => setBag('s12.form', { ...f, ...p })

  return (
    <StepShell step={12} go={go} optional>
      <ScrollParam />

      <Section id="f-size" title="Рост, вес и размеры" note="Нужны агентству для спецодежды и обуви.">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <XField id="s12-height" label="Рост, см">
            <TextInput id="s12-height" mono inputMode="numeric" value={f.height} onChange={(e) => patch({ height: num(e.target.value, 3) })} placeholder="180" />
          </XField>
          <XField id="s12-weight" label="Вес, кг">
            <TextInput id="s12-weight" mono inputMode="numeric" value={f.weight} onChange={(e) => patch({ weight: num(e.target.value, 3) })} placeholder="80" />
          </XField>
          <XField id="s12-suit" label="Комбинезон">
            <XSelect id="s12-suit" value={f.suit} onChange={(suit) => patch({ suit })} options={SUITS} placeholder="Размер" />
          </XField>
          <XField id="s12-shoe" label="Обувь">
            <TextInput id="s12-shoe" mono inputMode="numeric" value={f.shoe} onChange={(e) => patch({ shoe: num(e.target.value, 2) })} placeholder="43" />
          </XField>
        </div>
      </Section>

      <Section title="Ближайший аэропорт">
        <TextInput aria-label="Ближайший аэропорт" value={f.airport} onChange={(e) => patch({ airport: e.target.value })} placeholder="Одесса (ODS)" />
      </Section>

      <Section id="f-kin" title="Близкий человек" note="С кем связаться в экстренном случае.">
        <XField id="s12-kin-name" label="Имя и фамилия">
          <TextInput id="s12-kin-name" value={f.kinName} onChange={(e) => patch({ kinName: e.target.value })} placeholder="Например, Olena Koval" autoComplete="off" />
        </XField>
        <div className="grid grid-cols-2 gap-3">
          <XField id="s12-kin-rel" label="Кем приходится">
            <TextInput id="s12-kin-rel" value={f.kinRel} onChange={(e) => patch({ kinRel: e.target.value })} placeholder="Жена" />
          </XField>
          <XField id="s12-kin-phone" label="Телефон">
            <TextInput id="s12-kin-phone" mono type="tel" inputMode="tel" value={f.kinPhone} onChange={(e) => patch({ kinPhone: e.target.value })} placeholder="+380 …" />
          </XField>
        </div>
        <XField
          id="s12-kin-email"
          label="Email"
          tag={
            <Badge variant="outline" className="font-normal text-muted-foreground">
              необязательно
            </Badge>
          }
        >
          <TextInput
            id="s12-kin-email"
            type="email"
            inputMode="email"
            value={f.kinEmail}
            onChange={(e) => patch({ kinEmail: e.target.value })}
            placeholder="name@example.com"
            autoComplete="off"
          />
        </XField>
        <XField id="s12-kin-addr" label="Адрес">
          <TextInput id="s12-kin-addr" value={f.kinAddr} onChange={(e) => patch({ kinAddr: e.target.value })} placeholder="Страна, город, улица, дом" autoComplete="off" />
        </XField>
      </Section>
    </StepShell>
  )
}
