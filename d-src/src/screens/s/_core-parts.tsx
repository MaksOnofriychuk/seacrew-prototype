import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import {
  Camera,
  ChevronRight,
  FileText,
  Flag,
  FolderOpen,
  GraduationCap,
  HeartPulse,
  IdCard,
  Image,
  Info,
  LoaderCircle,
  Lock,
  PenLine,
  Ship,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Paper } from '@/components/app/paper'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { CheckRow, Field, TextInput } from '../q/_parts'
import { STCW_LEVELS, STCW_RULES } from '../q/q05'

// Спільні шматки основних кроків покрокової реєстрації (s1–s7, sx). Лише для цих екранів.

/* ---------- іконки розділів (як STEP_HEAD[n][0] у C) ---------- */

export const STEP_ICON: Record<number, ComponentType<{ className?: string }>> = {
  1: Lock,
  2: UserRound,
  3: IdCard,
  4: FileText,
  5: HeartPulse,
  6: Ship,
  8: ShieldCheck,
  9: Flag,
  10: GraduationCap,
  11: UserRound,
  12: Info,
  13: PenLine,
}

/* ---------- стан ---------- */

// useProto, але null у bag теж дає fallback (так само, як useQ у швидкому потоці).
export function useS() {
  const p = useProto()
  const bag = <T,>(key: string, fallback: T): T => p.bag<T | null>(key, null) ?? fallback
  return { ...p, bag }
}

// Параметри з адреси (#s5?form=1) — лише для посилань і скріншотів станів екрана.
// Читаємо один раз: після першого рендера адреса переписується на #id?t=…
export function useHashParams() {
  const [p] = useState(() => new URLSearchParams(location.hash.split('?')[1] ?? ''))
  return p
}

// ?y=600 прокручує екран кроку. Невидимий якір шукає найближчий прокручуваний контейнер StepShell.
export function ScrollAnchor() {
  const ref = useRef<HTMLSpanElement>(null)
  const params = useHashParams()
  useEffect(() => {
    const y = Number(params.get('y'))
    const box = ref.current?.closest('.overflow-y-auto')
    if (y && box) box.scrollTop = y
  }, [params])
  return <span ref={ref} className="hidden" />
}

/* ---------- маски дат ---------- */

// ДД.ММ.ГГГГ: лише цифри, крапки ставимо самі.
export function maskDate(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('.')
}

// ММ.ГГГГ для періодів рейсу.
export function maskMonth(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 6)
  return [d.slice(0, 2), d.slice(2)].filter(Boolean).join('.')
}

/* ---------- тривалість: цифри — Plex Mono, слова — звичайним шрифтом ---------- */

function word(n: number, a: string, b: string, c: string) {
  const m = n % 10
  const h = n % 100
  return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c
}

// long: «1 год 8 месяцев»; коротко: «1 г 8 мес» (як у правці п. 7).
export function Dur({ m, long, className }: { m: number; long?: boolean; className?: string }) {
  const y = Math.floor(m / 12)
  const mo = m % 12
  const parts: [number, string][] = []
  if (y) parts.push([y, long ? word(y, 'год', 'года', 'лет') : 'г'])
  if (mo || !y) parts.push([mo, long ? word(mo, 'месяц', 'месяца', 'месяцев') : 'мес'])
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

/* ---------- вибір зі списку ---------- */

export function Pick({
  id,
  label,
  value,
  options,
  onChange,
  mono,
  placeholder = 'Выберите',
}: {
  id: string
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  mono?: boolean
  placeholder?: string
}) {
  return (
    <Field id={id} label={label}>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id={id} className={cn('h-12 w-full px-4 text-base data-[size=default]:h-12', mono && 'font-mono')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-64">
          {options.map((o) => (
            <SelectItem key={o} value={o} className={cn('py-2 text-base', mono && 'font-mono')}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

/* ---------- блок «загрузить — ИИ распознает» (addPanel у C) ---------- */

// Верх — велика зона: тап запускає розпізнавання. Під нею — джерела: камера, файл, галерея.
// «Ввести вручную» — тихе посилання під блоком (ховається, коли форма вже відкрита).
export function AddPanel({ id, title, sub, busy, onUpload, onManual }: { id?: string; title: string; sub: string; busy?: boolean; onUpload: () => void; onManual?: () => void }) {
  const sources: [ComponentType<{ className?: string }>, string][] = [
    [Camera, 'Камера'],
    [FolderOpen, 'Файл'],
    [Image, 'Галерея'],
  ]
  return (
    <div id={id} className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <button type="button" disabled={busy} onClick={onUpload} className="flex w-full items-center gap-4 px-4 py-4 text-left disabled:opacity-100">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
            {busy ? <LoaderCircle className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[15px] font-medium">{title}</span>
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {busy ? 'Распознаём…' : sub}
            </span>
          </span>
        </button>
        <div className="grid grid-cols-3 border-t border-border">
          {sources.map(([Icon, label]) => (
            <button
              key={label}
              type="button"
              disabled={busy}
              onClick={onUpload}
              className="flex items-center justify-center gap-2 border-l border-border py-3 text-sm font-medium text-primary first:border-l-0 disabled:opacity-50"
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
      {onManual && (
        <button type="button" onClick={onManual} className="flex items-center gap-2 self-start text-[15px] font-medium text-primary">
          <PenLine className="size-4" />
          Ввести вручную
        </button>
      )}
    </div>
  )
}

// Імітація розпізнавання: коротка пауза, потім результат.
export function useBusy() {
  const [busy, setBusy] = useState(false)
  const t = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(t.current), [])
  const run = (fn: () => void, ms = 800) => {
    setBusy(true)
    t.current = window.setTimeout(() => {
      setBusy(false)
      fn()
    }, ms)
  }
  return { busy, run }
}

/* ---------- список документів: одна біла група з роздільниками ---------- */

export type Row = {
  key: string
  icon: ComponentType<{ className?: string }>
  title: ReactNode
  meta?: ReactNode
  badge?: {
    text: string
    variant: 'success' | 'warning' | 'outline' | 'error'
  }
  onClick?: () => void
}

export function RowList({ rows, className }: { rows: Row[]; className?: string }) {
  if (!rows.length) return null
  return (
    <ul className={cn('overflow-hidden rounded-xl border border-border bg-surface', className)}>
      {rows.map((r) => {
        const inner = (
          <>
            <r.icon className="size-5 shrink-0 text-primary" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-medium">{r.title}</span>
              {(r.meta || r.badge) && (
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  {r.meta}
                  {r.badge && (
                    <Badge variant={r.badge.variant} className={r.badge.variant === 'outline' ? 'font-normal text-muted-foreground' : 'font-normal'}>
                      {r.badge.text}
                    </Badge>
                  )}
                </span>
              )}
            </span>
            {r.onClick && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
          </>
        )
        return (
          <li key={r.key} className="border-t border-border first:border-t-0">
            {r.onClick ? (
              <button type="button" onClick={r.onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                {inner}
              </button>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">{inner}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mt-2 -mb-1 flex items-center justify-between gap-3 px-1">
      <h2 className="text-sm font-medium text-muted-foreground">{children}</h2>
      {aside}
    </div>
  )
}

/* ---------- форма документа як папір (manualDoc у C) ---------- */

export type DocData = {
  name: string
  num: string
  issue: string
  exp: string
  noExp: boolean
  country: string
  file: boolean
  /** лише для диплома (CoC): посада, правило STCW, рівень — правка п. 6 */
  rank?: string
  stcw?: string
  level?: string
}

export const EMPTY_DOC: DocData = {
  name: '',
  num: '',
  issue: '',
  exp: '',
  noExp: false,
  country: 'Украина',
  file: false,
}

export function DocForm({
  id,
  initial,
  coc,
  namePh = 'Например, Basic Safety Training',
  fallbackTitle = 'Новый документ',
  onSave,
  onCancel,
  onDelete,
}: {
  id: string
  initial: DocData
  coc?: boolean
  namePh?: string
  fallbackTitle?: string
  onSave: (d: DocData) => void
  onCancel: () => void
  onDelete?: () => void
}) {
  const [d, setD] = useState<DocData>(initial)
  const put = (p: Partial<DocData>) => setD((x) => ({ ...x, ...p }))
  const f = (k: string) => `${id}-${k}`
  const ref = useRef<HTMLDivElement>(null)

  // Як у C: відкрита форма прокручується в поле зору.
  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div ref={ref} className="scroll-mt-4">
      <Paper title={d.name.trim() || fallbackTitle}>
        <div className="flex flex-col gap-5 py-1">
          <Field id={f('name')} label="Название документа">
            <TextInput id={f('name')} value={d.name} placeholder={namePh} onChange={(e) => put({ name: e.target.value })} />
          </Field>
          <Field id={f('num')} label="Номер">
            <TextInput id={f('num')} mono value={d.num} placeholder="Как в документе" className="placeholder:font-sans" onChange={(e) => put({ num: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id={f('issue')} label="Дата выдачи">
              <TextInput id={f('issue')} mono inputMode="numeric" value={d.issue} placeholder="ДД.ММ.ГГГГ" onChange={(e) => put({ issue: maskDate(e.target.value) })} />
            </Field>
            <Field id={f('exp')} label="Действителен до">
              <TextInput
                id={f('exp')}
                mono={!d.noExp}
                inputMode="numeric"
                disabled={d.noExp}
                value={d.noExp ? '' : d.exp}
                placeholder={d.noExp ? 'Бессрочно' : 'ДД.ММ.ГГГГ'}
                onChange={(e) => put({ exp: maskDate(e.target.value) })}
              />
            </Field>
          </div>
          <CheckRow id={f('noexp')} checked={d.noExp} onChange={(v) => put({ noExp: v })}>
            Без срока действия
          </CheckRow>
          <Field id={f('country')} label="Страна выдачи">
            <TextInput id={f('country')} value={d.country} onChange={(e) => put({ country: e.target.value })} />
          </Field>
          {coc && (
            <>
              <Field id={f('rank')} label="Должность по диплому">
                <TextInput id={f('rank')} value={d.rank ?? ''} placeholder="3rd Engineer" onChange={(e) => put({ rank: e.target.value })} />
              </Field>
              <Pick id={f('stcw')} label="Правило STCW" value={d.stcw ?? ''} options={STCW_RULES} mono onChange={(v) => put({ stcw: v })} />
              <Pick id={f('level')} label="Уровень" value={d.level ?? ''} options={STCW_LEVELS} onChange={(v) => put({ level: v })} />
            </>
          )}

          <div className="border-t border-border pt-4">
            {d.file ? (
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                  <Image className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-medium">Фото документа.jpg</span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Lock className="size-3 text-success" aria-hidden="true" />
                    JPG, <span className="font-mono">1,1 МБ</span>
                  </span>
                </span>
                <Button variant="ghost" size="icon-lg" aria-label="Удалить файл" className="text-muted-foreground" onClick={() => put({ file: false })}>
                  <Trash2 className="size-5" />
                </Button>
              </div>
            ) : (
              <button
                id={f('file')}
                type="button"
                onClick={() => put({ file: true })}
                className="flex w-full items-center gap-3 rounded-md border border-dashed border-primary/60 px-3 py-3 text-left active:scale-[0.99]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                  <Camera className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[15px] font-medium">Прикрепить фото или файл</span>
                  <span className="text-sm text-muted-foreground">Администратор сверит данные с документом</span>
                </span>
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" className="h-11 text-[15px] text-muted-foreground" onClick={onCancel}>
              Отмена
            </Button>
            <Button variant="secondary" className="h-11 flex-1 text-[15px] text-primary" disabled={!d.name.trim()} onClick={() => onSave({ ...d, name: d.name.trim() })}>
              Сохранить документ
            </Button>
          </div>
          {onDelete && (
            <button type="button" onClick={onDelete} className="-mt-1 flex items-center gap-2 self-start text-sm font-medium text-signal">
              <Trash2 className="size-4" />
              Удалить документ
            </button>
          )}
        </div>
      </Paper>
    </div>
  )
}

// Підпис під назвою документа: строк дії.
export function docMeta(d: DocData): ReactNode {
  if (d.noExp) return 'Без срока действия'
  if (d.exp)
    return (
      <>
        до <span className="font-mono">{d.exp}</span>
      </>
    )
  return d.num ? <span className="font-mono">{d.num}</span> : 'Без номера'
}

/* ---------- згода на обробку даних (sheet 'consent' у C; той самий текст, що в q02) ---------- */

export const LEGAL: [string, string][] = [
  ['Что мы обрабатываем.', 'CV и документы, которые вы загрузите, а также email и данные, которые вы введёте сами.'],
  ['Зачем.', 'Чтобы создать ваш профиль моряка, помогать с работой и защищать платформу от повторных и поддельных аккаунтов.'],
  ['Как.', 'CV и документы читает ИИ целиком: личные данные, документы, диплом, морской стаж. ИИ-сервисы работают как наши подрядчики. Файлы шифруются.'],
  ['Кто видит.', 'Вы. Агентства — только то, к чему вы откроете доступ. Администратор — для поддержки и безопасности.'],
  [
    'Сколько храним.',
    'Пока у вас есть аккаунт. Если регистрацию не закончить — файлы удаляются через 30 дней. После удаления аккаунта для безопасности платформы храним отпечаток номера документа, а не сам номер.',
  ],
  ['Ваши права.', 'Отозвать согласие, удалить аккаунт и получить копию данных можно в профиле: «Отозвать согласие» и «Скачать мои данные».'],
]
