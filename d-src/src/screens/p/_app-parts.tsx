import type { ComponentType, ReactNode } from 'react'
import { BadgeCheck, Bookmark, Check } from 'lucide-react'
import { Wordmark } from '@/components/app/chrome'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import type { Tab } from '@/components/app/tab-bar'
import { JOBS, type Job } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { useMe } from './_feed-parts'
import { Dateish, JobTags } from '../g02-guest-jobs'

// Спільні шматки екранів застосунку вкладки D (вакансії, документи, збережене). Лише для теки p.

/* ---------- навігація ---------- */

export const TAB_TO: Record<Tab, string> = { feed: 'p01', vac: 'p05', docs: 'p02', profile: 'q09' }

// useProto, але null у bag теж дає fallback (як useQ / useS).
export function useApp() {
  const p = useProto()
  const bag = <T,>(key: string, fallback: T): T => p.bag<T | null>(key, null) ?? fallback
  return { ...p, bag }
}

// Шапка вкладки без «Назад»: Seafolio, кнопка меню, великий заголовок і (необов'язково) дія праворуч від нього.
export function TabHead({ title, onMenu, action }: { title: string; onMenu: () => void; action?: ReactNode }) {
  // аватар з ініціалами — як у шапці стрічки (p01)
  const me = useMe()
  return (
    <div className="shrink-0 px-6 pt-2">
      <div className="flex h-10 items-center justify-between">
        <Wordmark />
        <button type="button" aria-label="Меню" onClick={onMenu} className="flex size-10 items-center justify-center rounded-full bg-card text-sm font-semibold text-primary">
          {me.initials}
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{title}</h1>
        {action}
      </div>
    </div>
  )
}

/* ---------- збережені вакансії (спільний ключ saved.jobs: індекси в JOBS) ---------- */

export function useSavedJobs() {
  const { bag, setBag, showToast } = useApp()
  const saved = bag<number[]>('saved.jobs', [0, 3])
  const isSaved = (k: number) => saved.includes(k)
  const toggle = (k: number) => {
    const on = !isSaved(k)
    setBag('saved.jobs', on ? [...saved, k] : saved.filter((x) => x !== k))
    showToast(on ? 'Вакансия сохранена' : 'Убрано из сохранённых')
  }
  return { saved, isSaved, toggle }
}

// Скільки вимог вакансії вже є в профілі моряка.
export const matchOf = (j: Job) => j.req.filter((r) => r[1]).length

export function SaveButton({ on, onClick, className }: { on: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={on ? 'Убрать из сохранённых' : 'Сохранить'}
      aria-pressed={on}
      onClick={onClick}
      className={cn('flex size-10 shrink-0 items-center justify-center rounded-md transition-colors', on ? 'text-primary' : 'text-muted-foreground', className)}
    >
      <Bookmark className={cn('size-5', on && 'fill-current')} />
    </button>
  )
}

// Рядок вакансії в білій групі (як у g02) + «Подходит по профилю» — для моряка, що увійшов.
export function JobRow({ k, onOpen, saved, onSave }: { k: number; onOpen: () => void; saved: boolean; onSave: () => void }) {
  const j = JOBS[k]
  return (
    <li className="flex gap-3 border-t border-border px-5 py-4 first:border-t-0">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 flex-col gap-1.5 text-left">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[17px] font-semibold">{j.t}</span>
          <JobTags tags={j.tags} />
        </span>
        <span className="text-[15px] font-semibold text-primary">{j.sal}</span>
        <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
          <span>{j.ship}</span>
          <span>
            посадка <Dateish v={j.board} />
          </span>
          <span>{j.dur}</span>
        </span>
        <span className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1">
            <span className="truncate">{j.co}</span>
            <BadgeCheck className="size-4 shrink-0 text-success" aria-label="Агентство проверено" />
          </span>
          <span className="shrink-0">{j.ago}</span>
        </span>
        <Match j={j} className="mt-1" />
      </button>
      <SaveButton on={saved} onClick={onSave} className="self-start" />
    </li>
  )
}

export function Match({ j, prefix = 'Подходит по профилю', className }: { j: Job; prefix?: string; className?: string }) {
  return (
    <span className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
      <Check className="size-4 shrink-0 text-success" strokeWidth={2.5} />
      <span>
        {prefix}: <span className="font-mono">{matchOf(j)}</span> из <span className="font-mono">{j.req.length}</span>
      </span>
    </span>
  )
}

/* ---------- дрібниці ---------- */

export function plural(n: number, one: string, few: string, many: string) {
  const m = n % 10
  const h = n % 100
  return m === 1 && h !== 11 ? one : m >= 2 && m <= 4 && (h < 12 || h > 14) ? few : many
}

// Порожній стан: що тут буде і що зробити, щоб з'явилося.
export function Empty({ icon: Icon, title, text, action }: { icon: ComponentType<{ className?: string }>; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface px-5 py-6">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-primary">
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-[15px] text-muted-foreground">{text}</p>
      </div>
      {action}
    </div>
  )
}

// Заголовок розділу над білою групою.
export function SectionLabel({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
      <h2 className="text-sm font-medium text-muted-foreground">{children}</h2>
      {aside}
    </div>
  )
}

// Числа й дати всередині тексту — Plex Mono, слова — звичайним шрифтом.
export function MonoNums({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d[\d.,/]*)/).map((part, i) =>
        i % 2 ? (
          <span key={i} className="font-mono">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}

// Вікно знизу: шапка (назва + дія праворуч), прокручуваний вміст, нижня дія завжди на виду.
// Фокус — на саме вікно, а не на перше поле: інакше клавіатура й рамка фокуса з'являються без запиту.
export function AppSheet({
  open,
  onClose,
  title,
  description,
  aside,
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  aside?: ReactNode
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[90%] gap-0 p-0 outline-none"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement | null)?.focus()
        }}
      >
        <div className="shrink-0 px-6 pt-6">
          <div className="flex items-baseline justify-between gap-4">
            <SheetTitle className="text-2xl leading-tight font-semibold tracking-tight">{title}</SheetTitle>
            {aside}
          </div>
          {description ? <SheetDescription className="mt-2 text-base">{description}</SheetDescription> : <SheetDescription className="sr-only">{typeof title === 'string' ? title : ''}</SheetDescription>}
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-5 pb-4 *:shrink-0">{children}</div>
        {footer && <div className="flex shrink-0 flex-col gap-2 border-t border-border px-6 pt-3 pb-6">{footer}</div>}
      </SheetContent>
    </Sheet>
  )
}
