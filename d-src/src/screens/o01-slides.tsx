import { useState, type ReactNode } from 'react'
import { Bell, Check, FileText, Globe, IdCard, Send, ShieldCheck, UserRound } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { Wordmark } from '@/components/app/chrome'
import { HeroPanel } from '@/components/app/hero-panel'
import { Paper } from '@/components/app/paper'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from './registry'

// o01 — правка п. 3: статична ілюстрація, заголовок до 5–6 слів, один рядок пояснення;
// без «болю», чіпів і анімації ілюстрацій. Правки №6, №24: 4 слайди, 4-й — про вакансії.
// Правка №37: на першому слайді в куті — мова застосунку (у прототипі лише показуємо вибір, тексти російські).
const SLIDES: { title: string; text: string; art: ReactNode }[] = [
  {
    title: 'Профиль из документов за минуту',
    text: 'Сфотографируйте документы — поля заполнятся сами.',
    art: <PaperId />,
  },
  {
    title: 'Анкета и пакет рекрутеру — в 1 тап',
    text: 'Анкета агентства заполнится из ваших данных профиля автоматически. Вы только проверяете информацию.',
    art: <PaperForm />,
  },
  {
    title: 'Документы под контролем: напомним о сроках',
    text: 'Предупредим заранее, когда истекает документ.',
    art: <PaperDeadlines />,
  },
  {
    title: 'Вакансии — отклик в 1 тап',
    text: 'Откликайтесь на вакансии сразу и получайте уведомления о новых по вашей подписке.',
    art: <PaperJobs />,
  },
]

const LANGS = [
  { id: 'ru', label: 'Русский' },
  { id: 'uk', label: 'Українська' },
  { id: 'en', label: 'English' },
] as const
type Lang = (typeof LANGS)[number]['id']

export function O01Slides({ go }: ScreenProps) {
  return <Slides go={go} />
}

// o07 — той самий перший слайд з відкритим вікном «Язык приложения» (показ у реєстрі).
export function O07Lang({ go }: ScreenProps) {
  return <Slides go={go} langAtStart />
}

function Slides({ go, langAtStart = false }: ScreenProps & { langAtStart?: boolean }) {
  // ?slide=2 в адресі відкриває потрібний слайд, ?lang=1 — вікно мови; для посилань і скріншотів.
  const [i, setI] = useState(() => {
    const n = Number(new URLSearchParams(location.hash.split('?')[1]).get('slide'))
    return n >= 1 && n <= SLIDES.length ? n - 1 : 0
  })
  const [langOpen, setLangOpen] = useState(() => langAtStart || new URLSearchParams(location.hash.split('?')[1]).get('lang') === '1')
  const { bag, setBag } = useProto()
  const lang = LANGS.find((l) => l.id === bag<Lang>('o.lang', 'ru')) ?? LANGS[0]
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
      <HeroPanel className="h-[490px]">
        <div className="relative px-6 pt-[58px]">
          <div className="flex items-center justify-between">
            <Wordmark className="flex-1" />
            {i === 0 && (
              <button
                type="button"
                onClick={() => setLangOpen(true)}
                aria-label={`Язык приложения: ${lang.label}`}
                className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-sm font-medium transition-transform active:scale-95"
              >
                <Globe className="size-4 text-primary" />
                {lang.label}
              </button>
            )}
            <Button variant="ghost" className="-mr-2 ml-1 h-9 px-2 text-primary hover:bg-transparent" onClick={toChoice}>
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
      </HeroPanel>

      <div key={`t${i}`} className={`px-6 pt-6 ${enter}`}>
        <h1 className="text-[36px] leading-[1.1] font-semibold tracking-tight text-balance">{slide.title}</h1>
        <p className="mt-5 text-base text-muted-foreground">{slide.text}</p>
      </div>

      <div className="mt-auto px-6 pb-4">
        <Button size="lg" onClick={() => (last ? toChoice() : show(i + 1))}>
          {last ? 'Начать' : 'Далее'}
        </Button>
      </div>

      <BottomSheet open={langOpen} onClose={() => setLangOpen(false)} title="Язык приложения">
        <ul className="-mt-2 -mb-1" role="radiogroup" aria-label="Язык приложения">
          {LANGS.map((l) => {
            const on = l.id === lang.id
            return (
              <li key={l.id} className="border-t border-border first:border-t-0">
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setBag('o.lang', l.id)
                    setLangOpen(false)
                  }}
                  className={cn('flex h-14 w-full items-center justify-between gap-4 text-left text-[17px]', on && 'font-semibold')}
                >
                  {l.label}
                  {on && <Check className="size-5 text-primary" />}
                </button>
              </li>
            )
          })}
        </ul>
      </BottomSheet>
    </div>
  )
}

/* ---------- «папір»: документи на панелі, лише токени ---------- */

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
        <div className="flex h-[92px] w-[74px] shrink-0 items-center justify-center rounded-md bg-muted">
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

// Слайд 4: вакансії з підписки — нова й та, на яку вже відгукнулися, і сповіщення про нові.
function PaperJobs() {
  const rows = [
    { t: '3rd Engineer', ship: 'Chemical Tanker', sal: '$4 200–4 600 / мес', badge: <Badge variant="outline" className="border-primary text-primary">Новая</Badge> },
    {
      t: '3rd Engineer',
      ship: 'LPG Carrier',
      sal: '$4 500 / мес',
      badge: (
        <Badge variant="success">
          <Check /> Отклик отправлен
        </Badge>
      ),
    },
  ]
  return (
    <Paper title="Подписка: 3rd Engineer, танкеры">
      <div className="-mt-2">
        {rows.map((r) => (
          <div key={r.ship} className="flex flex-col gap-1 border-t border-border py-2.5 first:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] font-semibold">{r.t}</span>
              {r.badge}
            </div>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{r.ship}</span>
              <span className="font-semibold text-primary">{r.sal}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-3 text-sm">
        <Bell className="size-4 text-primary" />
        <span className="flex-1 font-medium">Уведомлять о новых</span>
        {/* статичний перемикач — ілюстрація, не елемент керування */}
        <span aria-hidden="true" className="flex h-5 w-9 items-center justify-end rounded-full bg-primary p-0.5">
          <span className="size-4 rounded-full bg-primary-foreground" />
        </span>
      </div>
    </Paper>
  )
}
