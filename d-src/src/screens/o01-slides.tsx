import { useState, type ReactNode } from 'react'
import { Check, FileText, Send, ShieldCheck, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { ScreenProps } from './registry'

// o01 — правка п. 3: 3 слайди, статична ілюстрація, заголовок до 5–6 слів,
// один рядок пояснення; без «болю», чіпів і анімації ілюстрацій.
const SLIDES: { title: string; text: string; art: ReactNode }[] = [
  {
    title: 'Профиль из документов за минуту',
    text: 'Сфотографируйте документы — поля заполнятся сами.',
    art: <ArtDocument />,
  },
  {
    title: 'Анкета и пакет рекрутеру — в 1 тап',
    text: 'Анкета агентства заполнится из вашего профиля.',
    art: <ArtForm />,
  },
  {
    title: 'Документы под контролем: напомним о сроках',
    text: 'Предупредим заранее, когда истекает документ.',
    art: <ArtDeadlines />,
  },
]

export function O01Slides({ go }: ScreenProps) {
  // ?slide=2 в адресі відкриває потрібний слайд — для посилань і скріншотів.
  const [i, setI] = useState(() => {
    const n = Number(new URLSearchParams(location.hash.split('?')[1]).get('slide'))
    return n >= 1 && n <= SLIDES.length ? n - 1 : 0
  })
  const [back, setBack] = useState(false)
  const last = i === SLIDES.length - 1
  const slide = SLIDES[i]
  const toChoice = () => go('o02')

  const show = (n: number) => {
    setBack(n < i)
    setI(n)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 px-6 pt-2">
        <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={SLIDES.length} aria-valuenow={i + 1} aria-label="Слайд">
          {SLIDES.map((_, n) => (
            <button
              key={n}
              type="button"
              aria-label={`Слайд ${n + 1}`}
              onClick={() => show(n)}
              className={`h-1 flex-1 rounded-full transition-colors ${n <= i ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>
        <Button variant="ghost" className="h-9 px-2 text-primary" onClick={toChoice}>
          Пропустить
        </Button>
      </div>

      <div key={i} className={`flex flex-1 flex-col px-6 pt-12 ${back ? 'screen-in-back' : 'screen-in'}`}>
        <div className="flex h-[300px] items-center justify-center">{slide.art}</div>
        <h1 className="mt-10 text-[28px] leading-[1.15] font-semibold tracking-tight text-balance">{slide.title}</h1>
        <p className="mt-3 text-base text-muted-foreground">{slide.text}</p>
      </div>

      <div className="px-6 pb-4">
        <Button size="lg" onClick={() => (last ? toChoice() : show(i + 1))}>
          {last ? 'Начать' : 'Далее'}
        </Button>
      </div>
    </div>
  )
}

/* ---------- статичні ілюстрації: лише токени, без градієнтів і тіней ---------- */

function ArtDocument() {
  return (
    <div className="flex w-[290px] flex-col gap-4">
      <Badge variant="success" className="self-end">
        <Check /> Распознано
      </Badge>
      <div className="flex gap-4 rounded-xl border border-border bg-card p-5">
        <UserRound className="size-14 shrink-0 text-muted-foreground" strokeWidth={1.25} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Seafarer's ID</div>
          <div className="text-base font-semibold">Andrii Koval</div>
          <div className="font-mono text-sm">AB 123456</div>
          <div className="font-mono text-sm text-muted-foreground">до 12.05.2027</div>
        </div>
      </div>
    </div>
  )
}

function ArtForm() {
  const rows = [
    ['Фамилия', 'Koval'],
    ['Должность', '3rd Engineer'],
    ['Диплом', 'до 20.06.2029'],
  ]
  return (
    <div className="flex w-[290px] flex-col gap-4">
      <div className="flex flex-col rounded-xl border border-border bg-card px-5 py-2">
        <div className="py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Application form</div>
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center gap-3 border-t border-border py-3">
            <Check className="size-4 shrink-0 text-success" />
            <span className="flex-1 text-sm text-muted-foreground">{k}</span>
            <span className="font-mono text-sm">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Send className="size-4 text-primary" /> Пакет рекрутеру
      </div>
    </div>
  )
}

function ArtDeadlines() {
  return (
    <div className="flex w-[290px] flex-col rounded-xl border border-border bg-card px-5 py-1">
      <div className="flex items-start gap-3 py-4">
        <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="text-sm font-medium">Медосмотр (PEME)</div>
          <div className="font-mono text-sm text-muted-foreground">до 14.11.2026</div>
          <Badge variant="warning">Истекает через 18 дней</Badge>
        </div>
      </div>
      <Separator />
      <div className="flex items-start gap-3 py-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="text-sm font-medium">CoC — 3rd Engineer</div>
          <div className="font-mono text-sm text-muted-foreground">до 20.06.2029</div>
          <Badge variant="success">Действует</Badge>
        </div>
      </div>
    </div>
  )
}
