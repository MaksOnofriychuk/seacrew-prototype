import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { ChevronRight, RotateCw, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ME_DEFAULTS, PROFILE_FIELDS, RANK_DEFAULT, SALARY_PER, type FieldSource, type MeForm, type ProfileField, type Salary } from '@/lib/data-docs-profile'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { FleetValue } from '@/components/app/fleet-picker'
import { MainTopBar } from '@/components/app/top-bar'
import { MOBILE_ROUTES } from '@/lib/mobile-routes'
import { useAppCounts } from '../m/_parts'
import { FieldMsg } from '@/components/app/field-msg'

// Спільні шматки екранів документів і профілю (етап 5). Лише для теки dp.
// Свої копії полів, приміток і тривалості — щоб не залежати від тек q і s, які міняють інші агенти.

export type Icon = ComponentType<{ className?: string }>
export type Go = (id: string) => void

/* ---------- стан ---------- */

// useProto, але null у bag теж дає fallback.
export function useDP() {
  const p = useProto()
  const bag = <T,>(key: string, fallback: T): T => p.bag<T | null>(key, null) ?? fallback
  return { ...p, bag }
}

// Параметр з адреси (#p21?f=birth) — для посилань і скріншотів. Читаємо один раз.
export function useHashParam(name: string) {
  const [v] = useState(() => new URLSearchParams(location.hash.split('?')[1] ?? '').get(name))
  return v
}

// Чи темна тема зараз. Клас .dark на <html> ставиться в ефекті вже після рендера екрана —
// тож стежимо за ним, а не читаємо один раз (інакше «Тема: Светлая» у темній темі).
export function useDarkClass() {
  const el = document.documentElement
  const [dark, setDark] = useState(() => el.classList.contains('dark'))
  useEffect(() => {
    const sync = () => setDark(el.classList.contains('dark'))
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [el])
  return dark
}

/* ---------- профіль: значення, джерела, правки (bag dp.profile) ---------- */

/** Текстові поля профілю (рядок → p21); «Должность» і «Желаемая зарплата» — окремо. */
export type TextField = Exclude<ProfileField, 'rank' | 'salary'>
type Edits = Partial<Record<TextField, string>>

export function useProfile() {
  const { bag, setBag } = useDP()
  // Ім'я, номери документів — з даних швидкої реєстрації, якщо моряк її пройшов (q.form).
  const form = { ...ME_DEFAULTS, ...(bag<{ v: Partial<MeForm> } | null>('q.form', null)?.v ?? {}) } as MeForm
  const email = bag<{ email?: string }>('q.acct', {}).email || ME_DEFAULTS.email
  const edits = bag<Edits>('dp.profile', {})
  const rank = bag<FleetValue>('dp.rank', RANK_DEFAULT)

  const salary = bag<Salary | null>('dp.salary', null)
  const base: Record<TextField, string> = {
    last: String(form.last ?? ''),
    first: String(form.first ?? ''),
    birth: String(form.birth ?? ''),
    cit: String(form.cit ?? ''),
    phone: String(form.phone ?? ''),
    email,
    marital: '',
  }
  const value = (k: TextField) => (edits[k] !== undefined ? edits[k]! : base[k])
  const source = (k: TextField): FieldSource | null => {
    if (!value(k)) return null
    const def = PROFILE_FIELDS.find((f) => f.k === k)!.src
    if (edits[k] !== undefined) return def === 'doc' || def === 'cv' ? 'edited' : 'you'
    return def
  }
  const first = value('first')
  const last = value('last')
  return {
    form,
    value,
    source,
    rank,
    position: rank.positions[0] ?? '',
    salary,
    saveSalary: (v: Salary | null) => setBag('dp.salary', v),
    name: `${first} ${last}`.trim() || 'Без имени',
    initials: ((first[0] ?? '?') + (last[0] ?? '')).toUpperCase(),
    save: (k: TextField, v: string) => setBag('dp.profile', { ...edits, [k]: v }),
    saveRank: (v: FleetValue) => setBag('dp.rank', v),
  }
}

/* ---------- поля ---------- */

const SOURCE_TEXT: Record<FieldSource, string> = {
  doc: 'из документа',
  cv: 'из CV',
  you: 'введено вами',
  edited: 'исправлено вами',
}

export function SourceTag({ kind, className }: { kind: FieldSource | 'check'; className?: string }) {
  if (kind === 'check')
    return (
      <Badge variant="warning" className={cn('font-normal', className)}>
        проверьте
      </Badge>
    )
  return (
    <Badge variant={kind === 'edited' ? 'warning' : 'outline'} className={cn('font-normal', kind !== 'edited' && 'text-muted-foreground', className)}>
      {SOURCE_TEXT[kind]}
    </Badge>
  )
}

export function Field(props: { id: string; label: string; tag?: ReactNode; note?: ReactNode; error?: ReactNode; children: ReactNode }) {
  const { id, label, tag, note, error, children } = props
  const reserve = 'note' in props || 'error' in props
  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <Label htmlFor={id} className="text-[15px] font-medium">
          {label}
        </Label>
        {tag}
      </div>
      {children}
      {reserve && <FieldMsg error={error} note={note} />}
    </div>
  )
}

export function TextInput({ mono, invalid, className, ...props }: React.ComponentProps<'input'> & { mono?: boolean; invalid?: boolean }) {
  return (
    <Input
      aria-invalid={invalid || undefined}
      className={cn('h-12 px-4 text-base md:text-base', mono && 'font-mono placeholder:font-sans', invalid && 'border-signal', className)}
      {...props}
    />
  )
}

/* ---------- текст ---------- */

// «3 500 $ в месяц»: число — моноширинним, з пробілами між тисячами.
export function SalaryText({ s }: { s: Salary }) {
  const n = s.amount.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (
    <span>
      <span className="font-mono">{n}</span> {s.cur} {SALARY_PER.find((p) => p.id === s.per)?.short}
    </span>
  )
}

export function plural(n: number, one: string, few: string, many: string) {
  const m = n % 10
  const h = n % 100
  return m === 1 && h !== 11 ? one : m >= 2 && m <= 4 && (h < 12 || h > 14) ? few : many
}

// Тривалість: цифри — моноширинним. long: «3 года 9 месяцев»; коротко: «3 г 9 мес».
export function Dur({ m, long, className }: { m: number; long?: boolean; className?: string }) {
  const y = Math.floor(m / 12)
  const mo = m % 12
  const parts: [number, string][] = []
  if (y) parts.push([y, long ? plural(y, 'год', 'года', 'лет') : 'г'])
  if (mo || !y) parts.push([mo, long ? plural(mo, 'месяц', 'месяца', 'месяцев') : 'мес'])
  return (
    <span className={className}>
      {parts.map(([n, w], i) => (
        <span key={i}>
          {i > 0 && ' '}
          <span className="font-mono">{n}</span> {w}
        </span>
      ))}
    </span>
  )
}

/* ---------- примітки, рядки, групи ---------- */

// Тиха примітка з іконкою.
export function Note({ icon: I, tone = 'muted', children, className }: { icon: Icon; tone?: 'muted' | 'warning'; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-md bg-card px-4 py-3 text-sm', tone === 'warning' ? 'text-foreground' : 'text-muted-foreground', className)}>
      <I className={cn('mt-0.5 size-4 shrink-0', tone === 'warning' ? 'text-warning' : 'text-primary')} />
      <div>{children}</div>
    </div>
  )
}

// Біла група з роздільниками й заголовком над нею (як «Мой профиль» у q09).
export function ListGroup({ title, aside, children, className }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('mt-7', className)}>
      {(title || aside) && (
        <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
          <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
          {aside}
        </div>
      )}
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">{children}</div>
    </section>
  )
}

export function MenuRow({ icon: I, title, value, onClick }: { icon?: Icon; title: ReactNode; value?: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-13 w-full items-center gap-3 border-t border-border px-4 py-3 text-left first:border-t-0 active:bg-muted/60">
      {I && <I className="size-5 shrink-0 text-primary" />}
      <span className="flex-1 text-[15px]">{title}</span>
      {value !== undefined && <span className="text-[15px] text-muted-foreground">{value}</span>}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

/* ---------- сторінка документа (мініатюра) ---------- */

// Сторінка як аркуш: фото ліворуч, рядки тексту, внизу — MRZ. Без справжніх зображень (дані вигадані).
export function PageArt({ n, rot = 0, className }: { n: number; rot?: number; className?: string }) {
  const line = 'block h-[3px] rounded-full bg-muted-foreground/25'
  return (
    <span className={cn('flex aspect-[3/4] w-full flex-col overflow-hidden rounded-md border border-border bg-card p-[9%] transition-transform duration-200', className)} style={{ transform: rot ? `rotate(${rot}deg)` : undefined }}>
      <span className={cn('flex gap-[8%]', n % 2 === 0 && 'flex-row-reverse')}>
        <span className="aspect-[3/4] w-[34%] shrink-0 rounded-[3px] bg-primary/15" />
        <span className="flex flex-1 flex-col gap-[5px] pt-[2px]">
          <span className={cn(line, 'w-[90%]')} />
          <span className={cn(line, 'w-[70%]')} />
          <span className={cn(line, 'w-[80%]')} />
          <span className={cn(line, 'w-[55%]')} />
        </span>
      </span>
      <span className="mt-[10%] flex flex-col gap-[5px]">
        <span className={cn(line, 'w-full')} />
        <span className={cn(line, 'w-[85%]')} />
        <span className={cn(line, 'w-[60%]')} />
      </span>
      <span className="mt-auto flex flex-col gap-[4px]">
        <span className="block h-[3px] w-full rounded-full bg-foreground/30" />
        <span className="block h-[3px] w-full rounded-full bg-foreground/30" />
      </span>
    </span>
  )
}

// Мініатюра сторінки з номером і діями «повернуть» / «убрать».
export function PageThumb({ n, rot, onOpen, onRotate, onRemove }: { n: number; rot?: number; onOpen?: () => void; onRotate?: () => void; onRemove?: () => void }) {
  return (
    <div className="flex w-[104px] shrink-0 flex-col gap-1.5">
      <div className="relative">
        <button type="button" onClick={onOpen} aria-label={`Страница ${n}, открыть`} className="block w-full active:scale-[0.98]">
          <PageArt n={n} rot={rot} />
        </button>
        {onRemove && (
          <button type="button" onClick={onRemove} aria-label={`Убрать страницу ${n}`} className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground">
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between px-0.5">
        <span className="text-sm text-muted-foreground">
          Стр. <span className="font-mono">{n}</span>
        </span>
        {onRotate && (
          <button type="button" onClick={onRotate} aria-label={`Повернуть страницу ${n}`} className="-mr-1.5 flex size-8 items-center justify-center rounded-md text-primary">
            <RotateCw className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------- таймери, що зникають разом з екраном ---------- */

export function useLater() {
  const ids = useRef<number[]>([])
  useEffect(() => () => ids.current.forEach((i) => window.clearTimeout(i)), [])
  return (fn: () => void, ms: number) => {
    ids.current.push(window.setTimeout(fn, ms))
  }
}

// Імітація роботи: коротка пауза, потім результат.
export function useBusy() {
  const [busy, setBusy] = useState(false)
  const later = useLater()
  const run = (fn: () => void, ms = 800) => {
    setBusy(true)
    later(() => {
      setBusy(false)
      fn()
    }, ms)
  }
  return { busy, run }
}

/* ---------- шапка вкладки (без «Назад») ---------- */

// Аватар (бокове меню), Seafolio, дзвіночок «Уведомления» з живим лічильником; нижче — великий заголовок і дія праворуч.
// here — id цього екрана: «Назад» з «Уведомлений» (p10) повертає сюди (як TabHead у p/).
export function TabHeader({ title, go, action, here }: { title?: string; go: Go; action?: ReactNode; here?: string }) {
  const { initials } = useProfile()
  const { notifications } = useAppCounts()
  const { setBag } = useProto()
  const bell = () => {
    if (here) setBag('back.p10', here)
    go(MOBILE_ROUTES.notifications)
  }
  return (
    <div className="shrink-0 px-6 pt-2">
      <MainTopBar onAvatar={() => go('p04')} onBell={bell} avatar={initials} notifications={notifications} />
      {title && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{title}</h1>
          {action}
        </div>
      )}
    </div>
  )
}
