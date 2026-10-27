import { useState, type ReactNode } from 'react'
import { Check, FileText, IdCard, Send, ShieldCheck, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from './registry'

// o01 — правка п. 3: 3 слайди, статична ілюстрація, заголовок до 5–6 слів,
// один рядок пояснення; без «болю», чіпів і анімації ілюстрацій.
const SLIDES: { title: string; text: string; art: ReactNode }[] = [
  {
    title: 'Профиль из документов за минуту',
    text: 'Сфотографируйте документы — поля заполнятся сами.',
    art: <PaperId />,
  },
  {
    title: 'Анкета и пакет рекрутеру — в 1 тап',
    text: 'Анкета агентства заполнится из вашего профиля.',
    art: <PaperForm />,
  },
  {
    title: 'Документы под контролем: напомним о сроках',
    text: 'Предупредим заранее, когда истекает документ.',
    art: <PaperDeadlines />,
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
  const enter = back ? 'screen-in-back' : 'screen-in'
  const toChoice = () => go('o02')

  const show = (n: number) => {
    setBack(n < i)
    setI(n)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Герой: панель із сіткою морської карти і документом на ній */}
      <section className="relative flex h-[490px] shrink-0 flex-col overflow-hidden bg-hero">
        <ChartGrid />
        <div className="relative px-6 pt-[58px]">
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold tracking-tight text-primary">Seafolio</span>
            <Button variant="ghost" className="-mr-2 h-9 px-2 text-primary hover:bg-transparent" onClick={toChoice}>
              Пропустить
            </Button>
          </div>
          <div className="mt-3 flex gap-1.5" role="progressbar" aria-label="Слайд" aria-valuemin={1} aria-valuemax={SLIDES.length} aria-valuenow={i + 1}>
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
        </div>
        <div key={i} className={`relative flex flex-1 flex-col justify-center px-6 ${enter}`}>
          {slide.art}
        </div>
        <span className="relative px-6 pb-3 font-mono text-[11px] text-muted-foreground">46°28′N 30°44′E</span>
      </section>

      <div key={`t${i}`} className={`px-6 pt-6 ${enter}`}>
        <h1 className="text-[36px] leading-[1.1] font-semibold tracking-tight text-balance">{slide.title}</h1>
        <p className="mt-5 text-base text-muted-foreground">{slide.text}</p>
      </div>

      <div className="mt-auto px-6 pb-4">
        <Button size="lg" onClick={() => (last ? toChoice() : show(i + 1))}>
          {last ? 'Начать' : 'Далее'}
        </Button>
      </div>
    </div>
  )
}

/* ---------- морська карта: тонка сітка кольору border ---------- */

function ChartGrid() {
  return (
    <svg className="absolute inset-0 size-full dark:opacity-50" aria-hidden="true">
      <defs>
        <pattern id="chart-minor" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="var(--border)" strokeWidth="0.75" />
        </pattern>
        <pattern id="chart-major" width="96" height="96" patternUnits="userSpaceOnUse">
          <rect width="96" height="96" fill="url(#chart-minor)" />
          <path d="M96 0H0V96" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#chart-major)" />
    </svg>
  )
}

/* ---------- «папір»: документи на панелі, лише токени ---------- */

// Смужка-шапка кольору primary — щоб читалось як документ, а не картка.
function Paper({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">{title}</div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-[15px]' : 'text-[15px] font-medium'}>{value}</span>
    </div>
  )
}

function PaperId() {
  return (
    <Paper title="Seafarer's Identity Document · Ukraine">
      <div className="flex gap-4">
        <div className="flex h-[92px] w-[74px] shrink-0 items-center justify-center rounded-md bg-card">
          <UserRound className="size-12 text-muted-foreground" strokeWidth={1.25} />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-3">
          <Field label="Фамилия" value="Koval" />
          <Field label="Имя" value="Andrii" />
        </div>
        <Badge variant="success" className="self-start">
          <Check /> Распознано
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <Field label="Номер" value="AB 123456" mono />
        <Field label="Действителен до" value="12.05.2027" mono />
      </div>
      <div className="mt-3 border-t border-border pt-2.5 font-mono text-[11px] leading-5 tracking-[0.08em] text-muted-foreground">
        <div>I&lt;UKRKOVAL&lt;&lt;ANDRII&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
        <div>AB1234567UKR9103145M2705124&lt;&lt;</div>
      </div>
    </Paper>
  )
}

function PaperForm() {
  const rows: [string, string, boolean][] = [
    ['Фамилия', 'Koval', false],
    ['Имя', 'Andrii', false],
    ['Должность', '3rd Engineer', false],
    ['Диплом CoC, до', '20.06.2029', true],
    ['Медосмотр, до', '14.11.2026', true],
  ]
  return (
    <Paper title="Application form · BlueWave Crewing">
      <div className="-mt-2">
        {rows.map(([k, v, mono]) => (
          <div key={k} className="flex items-center gap-3 border-t border-border py-2.5 first:border-t-0">
            <Check className="size-4 shrink-0 text-success" />
            <span className="flex-1 text-sm text-muted-foreground">{k}</span>
            <span className={mono ? 'font-mono text-sm' : 'text-sm font-medium'}>{v}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 border-t border-border pt-3 text-sm font-medium text-primary">
        <Send className="size-4" /> Пакет рекрутеру
      </div>
    </Paper>
  )
}

function PaperDeadlines() {
  const rows = [
    { icon: FileText, name: 'Медосмотр (PEME)', until: '14.11.2026', badge: <Badge variant="warning">Истекает через 18 дней</Badge> },
    { icon: ShieldCheck, name: 'CoC — 3rd Engineer', until: '20.06.2029', badge: <Badge variant="success">Действует</Badge> },
    { icon: IdCard, name: "Seafarer's ID", until: '12.05.2027', badge: <Badge variant="success">Действует</Badge> },
  ]
  return (
    <Paper title="Мои документы">
      <div className="-my-2.5">
        {rows.map((r) => (
          <div key={r.name} className="flex items-start gap-3 border-t border-border py-2.5 first:border-t-0">
            <r.icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
              <div className="flex w-full items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{r.name}</span>
                <span className="font-mono text-sm whitespace-nowrap text-muted-foreground">до {r.until}</span>
              </div>
              {r.badge}
            </div>
          </div>
        ))}
      </div>
    </Paper>
  )
}
