import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, Check, ChevronRight, MapIcon } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'

/* ---------- кроки покрокової реєстрації (дані й поведінка — з вкладки C) ---------- */

export type StepKind = 'core' | 'extra' | 'final'
export type StepDef = { n: number; t: string; k: StepKind; req?: boolean }

// Порядок як у C: основне, додаткове, «Проверка» в кінці.
export const STEPS: StepDef[] = [
  { n: 1, t: 'Аккаунт', req: true, k: 'core' },
  { n: 2, t: 'Личные данные', k: 'core' },
  { n: 3, t: 'Документ моряка', req: true, k: 'core' },
  { n: 4, t: 'Дипломы и сертификаты', k: 'core' },
  { n: 5, t: 'Медицинские документы', k: 'core' },
  { n: 6, t: 'Морской стаж', k: 'core' },
  { n: 8, t: 'Доп. сертификаты', k: 'extra' },
  { n: 9, t: 'Флаговые документы', k: 'extra' },
  { n: 10, t: 'Образование', k: 'extra' },
  { n: 11, t: 'О себе', k: 'extra' },
  { n: 12, t: 'Доп. информация', k: 'extra' },
  { n: 13, t: 'Заметки', k: 'extra' },
  { n: 7, t: 'Проверка', k: 'final' },
]

// Заголовок і пояснення кроку (C: STEP_HEAD). Стаж — увесь, без «за 5 лет» (правка п. 7).
export const STEP_HEAD: Record<number, [string, string]> = {
  1: ['Создайте аккаунт', 'Email и пароль. Затем код из письма.'],
  2: ['Личные данные', 'Подставятся во все анкеты агентств.'],
  3: ['Документ моряка', 'Удостоверение или диплом — один из них обязателен.'],
  4: ['Дипломы и сертификаты', 'Диплом, подтверждения и обязательные сертификаты STCW.'],
  5: ['Медицинские документы', 'Отдельное согласие. Файлы удаляются после окончания срока.'],
  6: ['Морской стаж', 'Все рейсы — главное, что смотрят агентства.'],
  8: ['Дополнительные сертификаты', 'Танкерные, DP, ECDIS и другие — повышают шансы на вакансию.'],
  9: ['Флаговые документы', 'Подтверждения флагов и мореходные книжки других стран.'],
  10: ['Образование', 'Морское учебное заведение и специальность.'],
  11: ['О себе', 'Языки, желаемая должность и пара слов о себе.'],
  12: ['Дополнительная информация', 'Размеры спецодежды, ближайший аэропорт, близкий человек.'],
  13: ['Заметки', 'Всё, что агентству стоит знать заранее.'],
  7: ['Проверка', 'Последний взгляд перед завершением.'],
}

// Що вважається пропущеним, якщо крок пропустили (C: MISS). id — DOM id поля для «Показать».
export const MISS: Record<number, [string, string][]> = {
  2: [['Дата рождения', 'f-birth'], ['Гражданство', 'f-cit'], ['Телефон', 'f-phone']],
  3: [['Документ моряка', 'f-sid']],
  4: [['Диплом (CoC)', 'f-up4'], ['Сертификаты STCW', 'f-up4']],
  5: [['Медицинский документ', 'f-up5']],
  6: [['Морской стаж', 'f-up6']],
  8: [['Дополнительные сертификаты', 'f-up8']],
  9: [['Флаговые подтверждения', 'f-up9']],
  10: [['Учебное заведение', 'f-up10']],
  11: [['Английский язык', 'f-lang'], ['Желаемая должность', 'f-pos']],
  12: [['Размеры спецодежды', 'f-size'], ['Близкий человек', 'f-kin']],
  13: [['Заметки', 'f-notes']],
}

export const stepInfo = (n: number) => STEPS.find((s) => s.n === n)!
const stepIdx = (n: number) => STEPS.findIndex((s) => s.n === n)

export type StepState = 'done' | 'skip' | 'todo'

/* ---------- стан кроків: bag 's.done' (як S.done у C) ---------- */

export function useSteps() {
  const { bag, setBag, state, showToast } = useProto()
  const done = bag<Record<string, boolean>>('s.done', {})
  const full = bag<boolean>('s.full', false)

  const stepState = (n: number): StepState => (done[n] ? 'done' : done['skip' + n] ? 'skip' : 'todo')

  // C: readiness — готовність до анкет за п'ятьма розділами, по 20 %.
  const readiness = () => {
    const items: [string, boolean][] = [
      ['Личные данные', !!done[2]],
      ['Документ моряка', !!done[3]],
      ['Диплом', !!(done[4] || state.docType === 'diploma' || bag<unknown>('s3.doc2', null))],
      ['Медицинские', !!(done[5] && bag<boolean>('s5.has', false))],
      ['Морской стаж', !!done[6]],
    ]
    if (full) items.forEach((x) => (x[1] = true))
    const n = items.filter((x) => x[1]).length
    return { items, n, pct: n * 20 }
  }

  const missingList = () =>
    STEPS.flatMap((s) => (done['skip' + s.n] && MISS[s.n] ? MISS[s.n].map(([t, id]) => ({ n: s.n, t, id, k: s.k })) : []))

  // C: nextStep — після стажу «Основное заполнено», далі перший незроблений крок.
  const nextStep = (n: number) => {
    if (n === 6) return 'sx'
    let i = stepIdx(n) + 1
    while (i < STEPS.length - 1 && done[STEPS[i].n]) i++
    return 's' + STEPS[Math.min(i, STEPS.length - 1)].n
  }

  const setDone = (patch: Record<string, boolean | undefined>) => {
    const next = { ...done, ...patch }
    Object.keys(next).forEach((k) => next[k] === undefined && delete next[k])
    setBag('s.done', next)
  }

  // C: done:N — крок завершено; 7 → профіль, 6 → «Основное заполнено».
  const complete = (n: number, go: (id: string) => void) => {
    setDone({ [n]: true, ['skip' + n]: undefined })
    if (n === 7) return go('q09')
    go(nextStep(n))
  }

  // C: skip:N — позначка «пропущено» і тост.
  const skip = (n: number, go: (id: string) => void) => {
    setDone({ ['skip' + n]: true })
    showToast('Пропущено — вернуться можно в любой момент')
    go(nextStep(n))
  }

  return { done, stepState, readiness, missingList, nextStep, complete, skip, setDone }
}

/* ---------- оболонка кроку ---------- */

type ShellProps = {
  step: number
  go: (id: string) => void
  children: ReactNode
  /** «Продолжить» активна */
  canNext?: boolean
  /** показати «Пропустить» */
  optional?: boolean
  /** свій обробник «Продолжить» замість стандартного complete() */
  onNext?: () => void
  /** підказка під кнопкою, напр. «Осталось: …» */
  hint?: ReactNode
  /** повністю свій низ екрана замість стандартних кнопок */
  footer?: ReactNode
}

// Крок: «Назад», назва, «Позже»; розділ і готовність профілю; прогрес; заголовок і пояснення;
// вміст; внизу «Пропущено N полей», «Продолжить» і «Пропустить».
export function StepShell({ step, go, children, canNext = true, optional = false, onNext, hint, footer }: ShellProps) {
  const steps = useSteps()
  const { done, setDone } = steps
  const [sheet, setSheet] = useState<'route' | 'missing' | 'later' | null>(null)
  const info = stepInfo(step)
  const [title, sub] = STEP_HEAD[step]
  const r = steps.readiness()
  const group = STEPS.filter((s) => s.k === info.k)
  const pos = group.indexOf(info) + 1
  const groupName = info.k === 'core' ? 'Основное' : info.k === 'extra' ? 'Дополнительно' : 'Финиш'
  const missing = steps.missingList()

  // C: demoSteps — якщо відкрили крок із середини, кроки 1 і 3 вже пройдені, 2 пропущено.
  useEffect(() => {
    if (step > 3 && Object.keys(done).length === 0) setDone({ 1: true, 3: true, skip2: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const i = stepIdx(step)
  const back = step === 8 ? 'sx' : i > 0 ? 's' + STEPS[i - 1].n : 'o04'

  return (
    <div className="flex h-full flex-col">
      <NavBar
        title={info.t}
        onBack={() => go(back)}
        right={
          step > 1 ? (
            <button type="button" onClick={() => setSheet('later')} className="px-2 text-[15px] font-semibold text-primary">
              Позже
            </button>
          ) : undefined
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-6 pt-1">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setSheet('route')} className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <MapIcon className="size-4" />
              <span>
                {groupName}
                {info.k !== 'final' && (
                  <span className="text-muted-foreground">
                    , <span className="font-mono">{pos}</span> из <span className="font-mono">{group.length}</span>
                  </span>
                )}
              </span>
              <ChevronRight className="size-4" />
            </button>
            <span className="text-sm text-muted-foreground">
              Профиль <span className="font-mono font-medium text-foreground">{r.pct} %</span>
            </span>
          </div>
          {info.k !== 'final' && (
            <div className="mt-3 flex gap-1.5" role="progressbar" aria-label={groupName} aria-valuemin={1} aria-valuemax={group.length} aria-valuenow={pos}>
              {group.map((s) => {
                const st = s.n === step ? 'cur' : steps.stepState(s.n)
                return (
                  <span
                    key={s.n}
                    className={cn('h-1 flex-1 rounded-full', st === 'done' || st === 'cur' ? 'bg-primary' : st === 'skip' ? 'bg-warning' : 'bg-border')}
                  />
                )
              })}
            </div>
          )}
          <h1 className="mt-5 text-[30px] leading-[1.1] font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-base text-muted-foreground">{sub}</p>
        </div>
        <div className="flex flex-col gap-4 px-6 pt-5 pb-6">{children}</div>
      </div>

      {footer ?? (
        <Footer className="border-t border-border bg-surface">
          {missing.length > 0 && (
            <button type="button" onClick={() => setSheet('missing')} className="flex items-center gap-2 text-left text-sm">
              <AlertTriangle className="size-4 shrink-0 text-warning" />
              <span className="flex-1">
                Пропущено <span className="font-mono font-medium">{missing.length}</span> {plural(missing.length, 'поле', 'поля', 'полей')}
                {missing.every((m) => m.k !== 'core') && <span className="text-muted-foreground">, необязательные</span>}
              </span>
              <span className="flex items-center font-medium text-primary">
                Показать <ChevronRight className="size-4" />
              </span>
            </button>
          )}
          <Button size="lg" disabled={!canNext} onClick={() => (onNext ? onNext() : steps.complete(step, go))}>
            {step === 7 ? 'Готово' : 'Продолжить'}
          </Button>
          {hint && <p className="text-center text-sm text-muted-foreground">{hint}</p>}
          {optional && (
            <Button size="lg" variant="ghost" className="text-primary" onClick={() => steps.skip(step, go)}>
              Пропустить
            </Button>
          )}
        </Footer>
      )}

      <Sheet open={sheet !== null} onOpenChange={(o) => !o && setSheet(null)}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[85%] gap-0 overflow-y-auto px-6 pt-6 pb-8">
          {sheet === 'route' && <RouteSheet step={step} go={go} close={() => setSheet(null)} />}
          {sheet === 'missing' && <MissingSheet go={go} close={() => setSheet(null)} />}
          {sheet === 'later' && (
            <>
              <SheetTitle className="text-2xl font-semibold tracking-tight">Продолжить позже?</SheetTitle>
              <SheetDescription className="mt-2 text-base">
                Всё, что вы заполнили, сохранено. Продолжить можно с этого шага в любой момент и с любого устройства.
              </SheetDescription>
              <div className="mt-6 flex flex-col gap-3">
                <Button size="lg" onClick={() => go('c08')}>
                  Выйти и продолжить позже
                </Button>
                <Button size="lg" variant="outline" onClick={() => setSheet(null)}>
                  Остаться
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// C: sheet 'route' — «Разделы профиля», переходи в будь-який розділ.
function RouteSheet({ step, go, close }: { step: number; go: (id: string) => void; close: () => void }) {
  const { stepState } = useSteps()
  const groups: [StepKind, string][] = [
    ['core', 'Основное, для анкет'],
    ['extra', 'Дополнительно, по желанию'],
    ['final', 'Финиш'],
  ]
  return (
    <>
      <SheetTitle className="text-2xl font-semibold tracking-tight">Разделы профиля</SheetTitle>
      <SheetDescription className="mt-2 text-base">Переходите в любой раздел — порядок не важен.</SheetDescription>
      {groups.map(([k, label]) => (
        <section key={k} className="mt-5">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">{label}</h3>
          <ul className="overflow-hidden rounded-xl border border-border">
            {STEPS.filter((s) => s.k === k).map((s) => {
              const st = s.n === step ? 'cur' : stepState(s.n)
              return (
                <li key={s.n} className="border-t border-border first:border-t-0">
                  <button
                    type="button"
                    onClick={() => {
                      close()
                      go('s' + s.n)
                    }}
                    className={cn('flex w-full items-center gap-3 px-4 py-3 text-left text-[15px]', st === 'cur' && 'font-semibold')}
                  >
                    <span className="flex-1">{s.t}</span>
                    {st === 'done' ? (
                      <Badge variant="success">
                        <Check /> готово
                      </Badge>
                    ) : st === 'skip' ? (
                      <Badge variant="warning">пропущено</Badge>
                    ) : st === 'cur' ? (
                      <Badge variant="outline" className="border-primary text-primary">
                        сейчас
                      </Badge>
                    ) : s.req ? (
                      <Badge variant="outline">обязательно</Badge>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
  )
}

// C: sheet 'missing' — «Пропущенные поля»; тап → крок і підсвічене поле.
function MissingSheet({ go, close }: { go: (id: string) => void; close: () => void }) {
  const { missingList } = useSteps()
  const list = missingList()
  const groups: [StepKind, string][] = [
    ['core', 'Основное'],
    ['extra', 'Дополнительно'],
  ]
  const jump = (n: number, id: string) => {
    close()
    go('s' + n)
    window.setTimeout(() => {
      const el = document.getElementById(id)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const hl = ['outline-2', 'outline-offset-4', 'outline-warning', 'rounded-md']
      el.classList.add(...hl)
      window.setTimeout(() => el.classList.remove(...hl), 1600)
    }, 260)
  }
  return (
    <>
      <SheetTitle className="text-2xl font-semibold tracking-tight">Пропущенные поля</SheetTitle>
      <SheetDescription className="mt-2 text-base">Нажмите — перейдём к полю. Основное влияет на готовность к анкетам.</SheetDescription>
      {groups.map(([k, label]) => {
        const items = list.filter((x) => x.k === k)
        if (!items.length) return null
        return (
          <section key={k} className="mt-5">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">{label}</h3>
            <ul className="overflow-hidden rounded-xl border border-border">
              {items.map((x) => (
                <li key={x.id} className="border-t border-border first:border-t-0">
                  <button type="button" onClick={() => jump(x.n, x.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <AlertTriangle className="size-4 shrink-0 text-warning" />
                    <span className="flex flex-1 flex-col">
                      <span className="text-[15px]">{x.t}</span>
                      <span className="text-sm text-muted-foreground">{stepInfo(x.n).t}</span>
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      <Button size="lg" variant="outline" className="mt-6" onClick={close}>
        Закрыть
      </Button>
    </>
  )
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}
