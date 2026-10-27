import { useEffect, useRef, type ReactNode } from 'react'
import { Camera, FileText, FolderOpen, Image, Lock, Pencil, ScanLine, Sparkles, Trash2, X } from 'lucide-react'
import { Paper } from '@/components/app/paper'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { CheckRow, TextInput } from '../q/_parts'

// Спільні шматки додаткових кроків (s8–s13). Лише для цих екранів.

/* ---------- стан: bag з fallback і для null ---------- */

export function useBag() {
  const p = useProto()
  const bag = <T,>(key: string, fallback: T): T => p.bag<T | null>(key, null) ?? fallback
  return { ...p, bag }
}

/* ---------- ?y=600 в адресі прокручує крок (для посилань і скріншотів) ---------- */

export function ScrollParam() {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const y = Number(new URLSearchParams(location.hash.split('?')[1]).get('y'))
    if (!y) return
    let el = ref.current?.parentElement ?? null
    while (el && getComputedStyle(el).overflowY !== 'auto') el = el.parentElement
    if (el) el.scrollTop = y
  }, [])
  return <span ref={ref} hidden />
}

/* ---------- розділ кроку: заголовок, пояснення, вміст; між розділами — тонка лінія ---------- */

export function Section({ id, title, note, children, className }: { id?: string; title: string; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('flex flex-col gap-4 border-t border-border pt-5 first-of-type:border-t-0 first-of-type:pt-0', className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

/* ---------- поле: підпис, мітка праворуч, поле, підказка ---------- */

export function XField({ id, label, tag, note, children, className }: { id?: string; label: string; tag?: ReactNode; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <div className="flex min-h-5 items-center justify-between gap-3">
        <Label htmlFor={id} className="text-[15px] font-medium">
          {label}
        </Label>
        {tag}
      </div>
      {children}
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </div>
  )
}

export function TextArea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'w-full resize-none rounded-md border border-input bg-surface px-4 py-3 text-base leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  )
}

export function XSelect({ id, value, onChange, options, placeholder }: { id?: string; value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full px-4 text-base data-[size=default]:h-12">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/* ---------- чіпи: круглі; вибраний — primary, інший — білий з рамкою ---------- */

export function Chip({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-left text-sm transition-colors duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        on ? 'border-primary bg-primary font-medium text-primary-foreground' : 'border-border bg-surface text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function ChipWrap({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}

/* ---------- дати ---------- */

// ДД.ММ.ГГГГ: лише цифри, крапки ставимо самі (як у e07).
export function maskDate(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('.')
}

/* ---------- додавання документа: розпізнати ІІ або ввести вручну (addPanel у C) ---------- */

export function AddPanel({ n, title, sub, onUpload }: { n: number; title: string; sub: string; onUpload: () => void }) {
  const sources = [
    [Camera, 'Камера'],
    [FolderOpen, 'Файл'],
    [Image, 'Галерея'],
  ] as const
  return (
    <div id={`f-up${n}`} className="overflow-hidden rounded-xl border border-dashed border-primary/60 bg-surface">
      <button type="button" onClick={onUpload} className="flex w-full items-center gap-4 px-4 py-4 text-left active:bg-muted">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
          <Sparkles className="size-5" />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-medium">{title}</span>
          <span className="text-sm text-muted-foreground">{sub}</span>
        </span>
      </button>
      <div className="grid grid-cols-3 border-t border-border">
        {sources.map(([Icon, t]) => (
          <button
            key={t}
            type="button"
            onClick={onUpload}
            className="flex items-center justify-center gap-2 border-l border-border py-3 text-sm font-medium text-primary first:border-l-0 active:bg-muted"
          >
            <Icon className="size-4" />
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- крок з документами: s8, s9 (docStep у C) ---------- */

type ManForm = { name: string; num: string; issue: string; exp: string; noExp: boolean; country: string; file: boolean }
const COUNTRIES = ['Украина', 'Филиппины', 'Индия', 'Польша'] as const

export function DocStep({ n, upT, upS, recSeq }: { n: number; upT: string; upS: string; recSeq: string[] }) {
  const { bag, setBag, showToast } = useBag()
  const rec = bag<string[]>(`s${n}.rec`, [])
  const added = bag<string[]>(`s${n}.added`, [])
  const form = bag<ManForm | null>(`s${n}.form`, null)
  const formRef = useRef<HTMLDivElement>(null)
  const opened = useRef(false)

  // Відкрили форму — прокручуємо до неї (як man: у C).
  useEffect(() => {
    if (form && !opened.current) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    opened.current = !!form
  }, [form])

  // C: up:N — ІІ розпізнав документ; кожне наступне завантаження дає наступний тип зі списку.
  const upload = () => {
    const next = recSeq.find((x) => !rec.includes(x))
    if (!next) return showToast('Документ распознан (пример)')
    setBag(`s${n}.rec`, [...rec, next])
    showToast(`Распознано: ${next} — проверьте данные`)
  }

  const open = (name = '') => setBag(`s${n}.form`, { name, num: '', issue: '', exp: '', noExp: false, country: 'Украина', file: false })
  const patch = (p: Partial<ManForm>) => form && setBag(`s${n}.form`, { ...form, ...p })
  // C: man-save:N — документ у списку з позначкою «введено вручную».
  const save = () => {
    if (!form) return
    const nm = form.name.trim() || 'Документ'
    setBag(`s${n}.added`, [...added, nm])
    setBag(`s${n}.form`, null)
    showToast('Сохранено: ' + nm)
  }

  const items = [...rec.map((t) => ({ t, ai: true })), ...added.map((t) => ({ t, ai: false }))]

  return (
    <>
      <div className="flex flex-col gap-3">
        <AddPanel n={n} title={upT} sub={upS} onUpload={upload} />
        {!form && (
          <button type="button" onClick={() => open()} className="flex items-center gap-2 self-start py-1 text-[15px] font-medium text-primary">
            <Pencil className="size-4" />
            Ввести вручную
          </button>
        )}
      </div>

      {form && (
        <div ref={formRef} className="scroll-mt-4">
          <ManualForm n={n} f={form} patch={patch} close={() => setBag(`s${n}.form`, null)} save={save} />
        </div>
      )}

      {items.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-border bg-surface">
          {items.map((x, i) => (
            <li key={x.t + i} className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
              <FileText className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15px] font-medium">{x.t}</span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {x.ai ? <Sparkles className="size-3.5 shrink-0 text-success" /> : <Pencil className="size-3.5 shrink-0 text-warning" />}
                  {x.ai ? 'Распознано ИИ, проверьте данные' : 'Введено вручную, проверит администратор'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// C: manualDoc — форма документа як папір; «Название документа» першим полем.
function ManualForm({ n, f, patch, close, save }: { n: number; f: ManForm; patch: (p: Partial<ManForm>) => void; close: () => void; save: () => void }) {
  const id = (k: string) => `s${n}-man-${k}`
  return (
    <Paper
      title={
        <span className="flex items-center justify-between gap-3">
          <span className="truncate">{f.name.trim() || 'Ввести вручную'}</span>
          <button type="button" onClick={close} aria-label="Закрыть" className="-my-1 -mr-2 flex size-8 shrink-0 items-center justify-center rounded-md">
            <X className="size-4" />
          </button>
        </span>
      }
    >
      <div className="flex flex-col gap-4 py-1">
        <XField id={id('name')} label="Название документа">
          <TextInput id={id('name')} value={f.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Например, Basic Safety Training" />
        </XField>
        <XField id={id('num')} label="Номер">
          <TextInput id={id('num')} mono value={f.num} onChange={(e) => patch({ num: e.target.value })} placeholder="Как в документе" className="placeholder:font-sans" autoComplete="off" />
        </XField>
        <div className="grid grid-cols-2 gap-3">
          <XField id={id('issue')} label="Дата выдачи">
            <TextInput id={id('issue')} mono inputMode="numeric" value={f.issue} onChange={(e) => patch({ issue: maskDate(e.target.value) })} placeholder="ДД.ММ.ГГГГ" />
          </XField>
          <XField id={id('exp')} label="Действителен до">
            <TextInput
              id={id('exp')}
              mono
              inputMode="numeric"
              disabled={f.noExp}
              value={f.noExp ? '' : f.exp}
              onChange={(e) => patch({ exp: maskDate(e.target.value) })}
              placeholder={f.noExp ? 'Бессрочно' : 'ДД.ММ.ГГГГ'}
              className={f.noExp ? 'placeholder:font-sans' : undefined}
            />
          </XField>
        </div>
        <CheckRow id={id('noexp')} checked={f.noExp} onChange={(noExp) => patch({ noExp })}>
          Без срока действия
        </CheckRow>
        <XField id={id('country')} label="Страна выдачи">
          <XSelect id={id('country')} value={f.country} onChange={(country) => patch({ country })} options={COUNTRIES} />
        </XField>

        {f.file ? (
          <div className="flex items-center gap-3 rounded-md border border-border px-4 py-3">
            <Image className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-medium">Фото документа.jpg</span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Lock className="size-3 text-success" aria-hidden="true" />
                JPG, <span className="font-mono">1,1 МБ</span>
              </span>
            </span>
            <Button variant="ghost" size="icon-lg" aria-label="Удалить" className="text-muted-foreground" onClick={() => patch({ file: false })}>
              <Trash2 className="size-5" />
            </Button>
          </div>
        ) : (
          <button type="button" onClick={() => patch({ file: true })} className="flex items-center gap-4 rounded-md border border-dashed border-border px-4 py-3 text-left active:bg-muted">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
              <ScanLine className="size-5" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-medium">Прикрепите фото или файл</span>
              <span className="text-sm text-muted-foreground">Администратор сверит данные с документом</span>
            </span>
          </button>
        )}

        <Button size="lg" variant="outline" className="border-primary text-primary" onClick={save}>
          Сохранить документ
        </Button>
      </div>
    </Paper>
  )
}
