import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronLeft, ChevronRight, Download, FileText, Image as ImageIcon, Link2, Mail, Send, Share2, X, ZoomIn, ZoomOut } from 'lucide-react'
import { WebCheckbox } from '@/components/web/fields'
import { WebDatePick } from '@/components/web/web-pickers'
import { TODAY, addYears, isoToRu, ruToIso, parseDate } from '@/lib/dates'
import { usePhonePortal } from '@/lib/phone-portal'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { WebShell } from '@/components/web/shell'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'

// Спільне для екранів адмінки (етап 9): каркас, вибраний запис, факти, бокове вікно підтвердження.

export function AdminPage({ active, go, children }: { active: string; go: (id: string) => void; children: ReactNode }) {
  return (
    <WebShell variant="admin" active={active} go={go}>
      {children}
    </WebShell>
  )
}

/** Значення в спільному сховищі прототипу: так список бачить, що змінили на деталі. */
export function useBagState<T>(key: string, fallback: T): [T, (v: T) => void] {
  const { bag, setBag } = useProto()
  return [bag<T>(key, fallback), (v: T) => setBag(key, v)]
}

/** '2026-11-02 09:40' → '02.11.2026 09:40'; '2026-11-02' → '02.11.2026' */
export function dt(s: string) {
  const [d, t] = s.split(' ')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return s
  return d.split('-').reverse().join('.') + (t ? ' ' + t : '')
}

export const Mono = ({ children, className }: { children: ReactNode; className?: string }) => <span className={cn('font-mono', className)}>{children}</span>

// Пари «підпис — значення» у дві колонки, без карток.
export function Facts({ items, cols = 2, className }: { items: [string, ReactNode][]; cols?: 2 | 3; className?: string }) {
  return (
    <dl className={cn('grid gap-x-8 gap-y-4', cols === 3 ? 'grid-cols-3' : 'grid-cols-2', className)}>
      {items.map(([k, v]) => (
        <div key={k} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-sm text-muted-foreground">{k}</dt>
          <dd className="truncate text-[15px]">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function SectionTitle({ children, aside, className }: { children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn('mt-8 mb-3 flex items-end justify-between gap-4', className)}>
      <h2 className="text-lg font-semibold">{children}</h2>
      {aside}
    </div>
  )
}

// Бокове вікно праворуч у вікні браузера: підтвердження дії або короткий перегляд запису.
export function SideSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[460px] gap-0 sm:max-w-[460px]">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="pr-6 text-lg">{title}</SheetTitle>
          {description ? <SheetDescription className="text-[15px]">{description}</SheetDescription> : <SheetDescription className="sr-only">{title}</SheetDescription>}
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-6 py-4">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}

export function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick}>
      Отмена
    </Button>
  )
}

// Тиха плашка-пояснення над таблицею або в деталі (не картка, а смуга з лівою межею).
export function Note({ tone = 'muted', children, className }: { tone?: 'muted' | 'warning' | 'error'; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'border-l-2 py-1 pl-4 text-[15px]',
        tone === 'muted' && 'border-border text-muted-foreground',
        tone === 'warning' && 'border-warning text-foreground',
        tone === 'error' && 'border-signal text-foreground',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ===== Локальные компоненты адмінки (правила перевірки 03.11) ===== */

/** Вкладки одной страницы: переключают содержимое на месте. Счётчик — круглая плашка, больше 99 — «99+» (правило 10). */
export function AdminTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: string; count?: number }[]
  value: T
  onChange: (id: T) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn('mb-6 flex gap-6 overflow-x-auto border-b border-border', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === value}
          onClick={() => onChange(t.id)}
          className={cn(
            '-mb-px flex h-10 shrink-0 items-center gap-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors',
            t.id === value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={cn('flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-xs', t.id === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
              {t.count > 99 ? '99+' : t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

const PERIOD_MIN = new Date(2026, 0, 1)

/** Период «с … по»: даты только выбором. «По» не раньше «с», обе не позже сегодня (правило 2). */
export function PeriodFilter({ from, to, onChange, label = 'Период', future = false }: { from: string; to: string; onChange: (from: string, to: string) => void; label?: string; future?: boolean }) {
  const top = future ? addYears(TODAY, 1) : TODAY
  const f = parseDate(isoToRu(from))
  const t = parseDate(isoToRu(to))
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <span className="text-sm text-muted-foreground">{label}:</span>
      <WebDatePick value={isoToRu(from)} onChange={(v) => onChange(ruToIso(v), to && ruToIso(v) > to ? '' : to)} min={PERIOD_MIN} max={t ?? top} clearable placeholder="С" className="w-[150px]" />
      <span className="text-muted-foreground">—</span>
      <WebDatePick value={isoToRu(to)} onChange={(v) => onChange(from, ruToIso(v))} min={f ?? PERIOD_MIN} max={top} clearable placeholder="По" className="w-[150px]" />
    </div>
  )
}

/** Попадает ли дата (ISO, можно со временем) в период. */
export const inPeriod = (iso: string, from: string, to: string) => {
  const d = iso.slice(0, 10)
  return (!from || d >= from) && (!to || d <= to)
}

/** Фильтр с несколькими значениями: выбранные плашки «×» и список с галочками (правило 8). */
export function MultiFilter({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])
  return (
    <div ref={ref} className="relative">
      <div
        className={cn('flex min-h-10 min-w-[200px] cursor-pointer flex-wrap items-center gap-1.5 rounded-md border bg-surface py-1 pr-2 pl-3', value.length ? 'border-primary' : 'border-border')}
        onClick={() => setOpen(!open)}
        role="button"
        aria-expanded={open}
        aria-label={label}
      >
        <span className="text-sm text-muted-foreground">{label}:</span>
        {value.length === 0 && <span className="text-sm">Все</span>}
        {value.map((v) => (
          <span key={v} className="flex h-6 items-center gap-1 rounded-full bg-muted pr-1 pl-2.5 text-xs font-medium">
            {v}
            <button type="button" aria-label={`Убрать ${v}`} onClick={(e) => (e.stopPropagation(), toggle(v))} className="flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-border">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <ChevronDown className="ml-auto size-4 text-muted-foreground" />
      </div>
      {open && (
        <div className="absolute left-0 z-40 mt-1 w-full min-w-[220px] rounded-lg border border-border bg-surface p-1 shadow-lg animate-in fade-in-0 duration-150">
          {options.map((o, i) => (
            <WebCheckbox key={o} id={`mf-${label}-${i}`} checked={value.includes(o)} onChange={() => toggle(o)} className="h-9 rounded-md px-2 hover:bg-muted">
              {o}
            </WebCheckbox>
          ))}
        </div>
      )}
    </div>
  )
}

/** Строки, которые раскрываются, открыта одна; меньшие отступы (правило 22). */
export function ExpandRows({ rows, defaultOpen }: { rows: { id: string; title: string; summary?: ReactNode; body: ReactNode }[]; defaultOpen?: string }) {
  const [open, setOpen] = useState<string | undefined>(defaultOpen ?? rows[0]?.id)
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border">
      {rows.map((r) => {
        const on = open === r.id
        return (
          <div key={r.id} className="border-t border-border first:border-t-0">
            <button type="button" aria-expanded={on} onClick={() => setOpen(on ? undefined : r.id)} className="flex min-h-11 w-full items-center gap-3 px-4 text-left hover:bg-muted">
              <span className="text-sm font-medium">{r.title}</span>
              {!on && r.summary && <span className="min-w-0 flex-1 truncate text-right text-sm text-muted-foreground">{r.summary}</span>}
              <ChevronDown className={cn('ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none', on && 'rotate-180')} />
            </button>
            {on && <div className="flex flex-col gap-3 border-t border-border bg-background/50 px-4 py-4">{r.body}</div>}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Просмотр файла или фото на весь экран страницы (правило 13): закрыть, название, «Поделиться» и «Скачать».
 * Содержимое — условный лист (в прототипе настоящих файлов нет).
 */
export function FileViewer({ open, onClose, title, subtitle, pages = 1, kind = 'doc', startPage = 0 }: { open: boolean; onClose: () => void; title: string; subtitle?: string; pages?: number; kind?: 'doc' | 'photo'; startPage?: number }) {
  const portal = usePhonePortal()
  const { showToast } = useProto()
  const [page, setPage] = useState(startPage)
  const [zoom, setZoom] = useState(false)
  const [share, setShare] = useState(false)
  useEffect(() => {
    if (open) {
      setPage(startPage)
      setZoom(false)
      setShare(false)
    }
  }, [open, startPage])
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open || !portal) return null
  const done = (t: string) => (setShare(false), showToast(t))
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="absolute inset-0 z-[60] flex flex-col bg-black/95 text-white animate-in fade-in-0 duration-200 motion-reduce:animate-none">
      <div className="relative flex h-16 shrink-0 items-center gap-3 px-4">
        <button type="button" onClick={onClose} aria-label="Закрыть" className="flex size-10 items-center justify-center rounded-full hover:bg-white/10">
          <X className="size-5" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[15px] font-medium">{title}</span>
          {(subtitle || pages > 1) && (
            <span className="truncate text-sm text-white/65">
              {subtitle}
              {subtitle && pages > 1 && ', '}
              {pages > 1 && (
                <>
                  стр. <span className="font-mono">{page + 1}</span> из <span className="font-mono">{pages}</span>
                </>
              )}
            </span>
          )}
        </div>
        <button type="button" onClick={() => setZoom(!zoom)} aria-label={zoom ? 'Уменьшить' : 'Увеличить'} className="flex size-10 items-center justify-center rounded-full hover:bg-white/10">
          {zoom ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}
        </button>
        <button type="button" onClick={() => setShare(!share)} aria-label="Поделиться" aria-expanded={share} className="flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium hover:bg-white/10">
          <Share2 className="size-4" /> Поделиться
        </button>
        <button type="button" onClick={() => done(`${title} скачан`)} aria-label="Скачать" className="flex size-10 items-center justify-center rounded-full hover:bg-white/10">
          <Download className="size-5" />
        </button>
        {share && (
          <div className="absolute top-14 right-16 z-10 flex w-[260px] flex-col rounded-lg border border-white/15 bg-neutral-900 p-1 text-sm shadow-lg">
            {[
              [Link2, 'Скопировать ссылку', 'Ссылка скопирована'],
              [Mail, 'Отправить по почте', 'Письмо со ссылкой подготовлено'],
              [Send, 'Передать коллеге', 'Файл передан коллеге'],
            ].map(([I, l, t]) => {
              const Icon = I as typeof Link2
              return (
                <button key={l as string} type="button" onClick={() => done(t as string)} className="flex h-10 items-center gap-3 rounded-md px-3 text-left hover:bg-white/10">
                  <Icon className="size-4 text-white/70" /> {l as string}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-4 overflow-auto px-6 pb-6">
        {pages > 1 && (
          <button type="button" aria-label="Предыдущая страница" disabled={page === 0} onClick={() => setPage(page - 1)} className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30">
            <ChevronLeft className="size-6" />
          </button>
        )}
        <div
          className={cn(
            'flex shrink-0 flex-col gap-3 rounded-md bg-neutral-100 p-8 text-neutral-400 transition-transform duration-200 motion-reduce:transition-none',
            kind === 'doc' ? 'aspect-[3/4] h-[640px]' : 'aspect-[4/3] h-[520px] items-center justify-center bg-neutral-300',
            zoom && 'scale-125',
          )}
        >
          {kind === 'doc' ? (
            <>
              <span className="h-4 w-2/5 rounded bg-neutral-300" />
              <span className="mb-4 h-3 w-1/4 rounded bg-neutral-200" />
              {Array.from({ length: 14 }, (_, i) => (
                <span key={i} className="h-2.5 rounded bg-neutral-200" style={{ width: `${95 - ((i * 37 + page * 11) % 40)}%` }} />
              ))}
              <span className="mt-auto self-end rounded border-2 border-neutral-300 px-3 py-1 text-xs font-medium">образец</span>
            </>
          ) : (
            <>
              <ImageIcon className="size-14" />
              <span className="text-sm">Фото, образец</span>
            </>
          )}
        </div>
        {pages > 1 && (
          <button type="button" aria-label="Следующая страница" disabled={page === pages - 1} onClick={() => setPage(page + 1)} className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30">
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>
    </div>,
    portal,
  )
}

export type DocItem = { name: string; type: string; pages: number; size: string; uploaded: string }

/** Список файлов компании: «Открыть» показывает файл на весь экран, просмотр пишется в журнал. */
export function DocList({ docs, onOpen }: { docs: DocItem[]; onOpen?: (d: DocItem) => void }) {
  const [view, setView] = useState<DocItem | null>(null)
  const isPhoto = (d: DocItem) => /\.(jpe?g|png)$/i.test(d.name)
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {docs.map((d) => (
          <div key={d.name} className="flex items-center gap-4 border-t border-border px-4 py-3 first:border-t-0">
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <button type="button" onClick={() => (setView(d), onOpen?.(d))} className="flex min-w-0 flex-1 flex-col text-left leading-tight">
              <span className="truncate font-medium hover:text-primary">{d.type}</span>
              <span className="truncate text-sm text-muted-foreground">
                <Mono>{d.name}</Mono>, <Mono>{d.pages}</Mono> стр., <Mono>{d.size}</Mono>
              </span>
            </button>
            <Mono className="shrink-0 text-sm text-muted-foreground">{dt(d.uploaded)}</Mono>
            <Button variant="outline" size="sm" onClick={() => (setView(d), onOpen?.(d))}>
              Открыть
            </Button>
          </div>
        ))}
      </div>
      <FileViewer open={!!view} onClose={() => setView(null)} title={view?.type ?? ''} subtitle={view?.name} pages={view?.pages} kind={view && isPhoto(view) ? 'photo' : 'doc'} />
    </>
  )
}
