import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { StepProgress } from '@/components/app/form-field'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'

// Спільні шматки екранів «Быстрая регистрация» (q02–q11). Лише для цієї теки.

/* ---------- стан потоку ---------- */

// useProto, але порожнє (null) значення в bag теж дає fallback — «Начать заново» і e-екрани
// скидають ключі в null.
export function useQ() {
  const p = useProto()
  const bag = <T,>(key: string, fallback: T): T => p.bag<T | null>(key, null) ?? fallback
  return { ...p, bag }
}

/* ---------- дані потоку (вигадані, як у вкладці C) ---------- */

export const DOC_TYPES = {
  sid: { n: 'Удостоверение личности моряка', b: 'Удостоверение', s: "Seafarer's ID" },
  diploma: { n: 'Диплом моряка', b: 'Диплом моряка', s: 'Diploma / CoC | CoP' },
} as const

export type DocTypeId = keyof typeof DOC_TYPES
export const otherType = (t: DocTypeId): DocTypeId => (t === 'sid' ? 'diploma' : 'sid')

// Кроки потоку для смуги прогресу зверху.
export const FLOW_TOTAL = 6

// Ключі bag, які належать цьому потоку — «Начать заново» стирає їх усі.
export const Q_KEYS = ['q.consent', 'q.cv', 'q.doc', 'q.doc2', 'q.form', 'q.manual', 'q.acct', 'q.done', 'q.revoked', 'q.medConsent', 'q.avail', 'q03.retake', 'q03.sheet']

export type Upload = { st: 'none' | 'up' | 'done'; p: number }
export type DocUpload = Upload & { pages: number }

/* ---------- каркас екрана потоку ---------- */

export function FlowScreen({
  step,
  label,
  onBack,
  right,
  footer,
  children,
  overlay,
}: {
  step?: number
  label?: string
  onBack?: () => void
  right?: ReactNode
  footer?: ReactNode
  children: ReactNode
  overlay?: ReactNode
}) {
  // ?y=600 в адресі прокручує екран — для посилань і скріншотів нижньої частини форми.
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const y = Number(new URLSearchParams(location.hash.split('?')[1]).get('y'))
    if (y && scroller.current) scroller.current.scrollTop = y
  }, [])

  return (
    <div className="relative flex h-full flex-col">
      <NavBar onBack={onBack} right={right} />
      {step !== undefined && (
        <div className="pb-2">
          <StepProgress step={step} total={FLOW_TOTAL} label={label} />
        </div>
      )}
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6">
        {children}
      </div>
      {footer}
      {overlay}
    </div>
  )
}

export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight text-balance">{children}</h1>
      {sub && <p className="text-base text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function Hint({ children }: { children?: ReactNode }) {
  return <p className="min-h-5 text-center text-sm text-muted-foreground">{children}</p>
}

export { Footer }

/* ---------- поля ---------- */

export type TagKind = 'doc' | 'cv' | 'edited' | 'manual' | 'noexp'

const TAG_TEXT: Record<TagKind, string> = {
  doc: 'из документа',
  cv: 'из CV',
  edited: 'исправлено вами',
  manual: 'введено вручную',
  noexp: 'бессрочно',
}

export function SourceTag({ kind }: { kind: TagKind }) {
  const warn = kind === 'edited' || kind === 'manual'
  return (
    <Badge variant={warn ? 'warning' : 'outline'} className={warn ? 'font-normal' : 'font-normal text-muted-foreground'}>
      {TAG_TEXT[kind]}
    </Badge>
  )
}

export function Field({
  id,
  label,
  tag,
  note,
  error,
  children,
}: {
  id: string
  label: string
  tag?: TagKind | null
  note?: ReactNode
  error?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <Label htmlFor={id} className="text-[15px] font-medium">
          {label}
        </Label>
        {tag && <SourceTag kind={tag} />}
      </div>
      {children}
      {error ? <p className="text-sm text-signal">{error}</p> : note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
    </div>
  )
}

export function TextInput({ mono, invalid, className, ...props }: React.ComponentProps<'input'> & { mono?: boolean; invalid?: boolean }) {
  return (
    <Input
      aria-invalid={invalid || undefined}
      className={cn('h-12 px-4 text-base md:text-base', mono && 'font-mono', invalid && 'border-signal', className)}
      {...props}
    />
  )
}

export function CheckRow({
  id,
  checked,
  onChange,
  children,
  className,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5 size-5 rounded-[6px] border-muted-foreground bg-surface" />
      <label htmlFor={id} className="text-[15px] leading-snug">
        {children}
      </label>
    </div>
  )
}

// Тиха примітка з іконкою (замість «банера» з C).
export function Note({ icon: Icon, tone = 'muted', children, className }: { icon: ComponentType<{ className?: string }>; tone?: 'muted' | 'warning'; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-md bg-card px-4 py-3 text-sm', tone === 'warning' ? 'text-foreground' : 'text-muted-foreground', className)}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', tone === 'warning' ? 'text-warning' : 'text-primary')} />
      <div>{children}</div>
    </div>
  )
}

export function Bar({ value, tone = 'primary', className }: { value: number; tone?: 'primary' | 'warning' | 'success'; className?: string }) {
  const fill = tone === 'warning' ? 'bg-warning' : tone === 'success' ? 'bg-success' : 'bg-primary'
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-border', className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <div className={cn('h-full rounded-full transition-[width] duration-200', fill)} style={{ width: `${value}%` }} />
    </div>
  )
}

/* ---------- вікна знизу ---------- */

export function QSheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[88%] gap-0 overflow-y-auto px-6 pt-6 pb-8">
        <SheetTitle className="text-2xl leading-tight font-semibold tracking-tight">{title}</SheetTitle>
        {description ? (
          <SheetDescription className="mt-2 text-base">{description}</SheetDescription>
        ) : (
          <SheetDescription className="sr-only">{typeof title === 'string' ? title : ''}</SheetDescription>
        )}
        <div className="mt-5 flex flex-col">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

// Рядок дії у вікні знизу: іконка, назва, підпис.
export function ActionRow({ icon: Icon, title, sub, onClick }: { icon: ComponentType<{ className?: string }>; title: string; sub?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-4 border-t border-border py-3 text-left first:border-t-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
        <Icon className="size-5" />
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-base font-medium">{title}</span>
        {sub && <span className="text-sm text-muted-foreground">{sub}</span>}
      </span>
      <ChevronRight className="size-5 text-muted-foreground" />
    </button>
  )
}

/* ---------- коротке повідомлення внизу (toast) ---------- */

type Toast = { text: string; undo?: () => void; id: number }

export function useToast() {
  const [t, setT] = useState<Toast | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const show = (text: string, undo?: () => void) => {
    window.clearTimeout(timer.current)
    setT({ text, undo, id: Date.now() })
    timer.current = window.setTimeout(() => setT(null), 4000)
  }

  const node = t ? (
    <div key={t.id} role="status" className="screen-in absolute inset-x-6 bottom-28 z-40 flex items-center gap-3 rounded-md bg-foreground px-4 py-3 text-sm text-background">
      <span className="flex-1">{t.text}</span>
      {t.undo && (
        <button
          type="button"
          className="font-medium underline underline-offset-4"
          onClick={() => {
            t.undo?.()
            setT(null)
          }}
        >
          Отменить
        </button>
      )}
    </div>
  ) : null

  return { toast: show, toastNode: node }
}

/* ---------- таймери, що зникають разом з екраном ---------- */

export function useTimers() {
  const ids = useRef<number[]>([])
  useEffect(() => () => ids.current.forEach((i) => window.clearTimeout(i)), [])
  const later = (fn: () => void, ms: number) => {
    ids.current.push(window.setTimeout(fn, ms))
  }
  const clear = () => {
    ids.current.forEach((i) => window.clearTimeout(i))
    ids.current = []
  }
  return { later, clear }
}

/* ---------- профіль ---------- */

export type QForm = Record<string, string | boolean>

export const FORM_DEFAULTS: QForm = {
  first: 'Andrii',
  last: 'Koval',
  birth: '14.03.1991',
  cit: 'Украина',
  phone: '+380 00 000 0000',
  docName: "Seafarer's Identity Document",
  docNum: 'AB 123456',
  docIssue: '12.05.2022',
  docExp: '12.05.2027',
  docNoExp: false,
  docCountry: 'Украина',
  dipName: 'Certificate of Competency',
  dipNum: 'UA-2021-0457',
  dipIssue: '20.06.2021',
  dipExp: '20.06.2029',
  dipNoExp: false,
  dipCountry: 'Украина',
  dipRank: '3rd Engineer',
  dipStcw: 'III/1',
  dipLevel: 'Operational',
  vessel1: 'MV Example Star',
  rank1: '3rd Engineer',
  per1: '02.2024 – 09.2024',
  vessel2: 'MV Example Wave',
  rank2: '4th Engineer',
  per2: '05.2022 – 12.2023',
}

export function months(per: string) {
  const m = String(per || '').match(/(\d{2})\.(\d{4})\D+(\d{2})\.(\d{4})/)
  if (!m) return 0
  return Math.max(0, (+m[4] - +m[2]) * 12 + (+m[3] - +m[1]) + 1)
}

function plural(n: number, a: string, b: string, c: string) {
  const m = n % 10
  const h = n % 100
  return `${n} ${m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c}`
}

export function durText(n: number) {
  if (!n) return ''
  const y = Math.floor(n / 12)
  const mo = n % 12
  return [y ? plural(y, 'год', 'года', 'лет') : '', mo ? plural(mo, 'месяц', 'месяца', 'месяцев') : ''].filter(Boolean).join(' ')
}

export function durShort(n: number) {
  const y = Math.floor(n / 12)
  const mo = n % 12
  return [y ? `${y} г.` : '', mo ? `${mo} мес.` : ''].filter(Boolean).join(' ')
}

// Готовність до анкет — як у C після швидкої реєстрації: усе, крім медичних (80 %).
export function readiness(full: boolean) {
  const items: [string, boolean][] = [
    ['Личные данные', true],
    ['Документ моряка', true],
    ['Диплом', true],
    ['Медицинские', full],
    ['Морской стаж', true],
  ]
  const n = items.filter((x) => x[1]).length
  return { items, pct: n * 20 }
}

export function ReadinessBlock({ pct, children }: { pct: number; children?: ReactNode }) {
  const full = pct === 100
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">{children ? 'Готовность к анкетам' : 'Профиль заполнен'}</h2>
        <span className={cn('font-mono text-lg font-medium', full ? 'text-success' : 'text-primary')}>{pct} %</span>
      </div>
      <Bar value={pct} tone={full ? 'success' : 'primary'} />
      {children}
    </section>
  )
}
