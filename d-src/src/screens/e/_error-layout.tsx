import { useEffect, useState, type ReactNode } from 'react'
import { X, type LucideIcon } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'

// Спільний каркас екранів помилок e01–e06 (як qError у C):
// невеликий знак ліворуч, заголовок-проблема, пояснення, блок «що робити», дії внизу.
// Без великого значка в колі по центру — сильний елемент тут заголовок.

export type Tone = 'signal' | 'warning' | 'primary' | 'muted'

const TONE: Record<Tone, string> = {
  signal: 'text-signal',
  warning: 'text-warning',
  primary: 'text-primary',
  muted: 'text-muted-foreground',
}

export function ErrorLayout({
  icon: Icon,
  tone,
  title,
  text,
  onBack,
  onClose,
  children,
  actions,
  toast,
}: {
  icon: LucideIcon
  tone: Tone
  title: string
  text: ReactNode
  /** «Назад» — до завантаження документа (e01, e02, e03, e06) */
  onBack?: () => void
  /** хрестик — вихід з реєстрації (e04, e05) */
  onClose?: () => void
  children?: ReactNode
  actions: ReactNode
  toast?: string | null
}) {
  return (
    <div className="flex h-full flex-col">
      <NavBar
        onBack={onBack}
        right={
          onClose && (
            <button type="button" onClick={onClose} aria-label="Закрыть" className="flex size-11 items-center justify-center rounded-md text-muted-foreground active:scale-95">
              <X className="size-6" />
            </button>
          )
        }
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-3 pb-4">
        <Icon className={cn('size-7 shrink-0', TONE[tone])} strokeWidth={1.75} aria-hidden="true" />
        <h1 className="mt-4 text-[32px] leading-[1.1] font-semibold tracking-tight text-balance">{title}</h1>
        <p className="mt-3 text-base text-muted-foreground">{text}</p>
        {children}
      </div>
      <Footer className="relative">
        {toast && <Toast text={toast} />}
        {actions}
      </Footer>
    </div>
  )
}

// Тихий заголовок блоку «что делать» всередині екрана.
export function BlockTitle({ children }: { children: ReactNode }) {
  return <h2 className="mt-8 text-base font-semibold">{children}</h2>
}

// Три виходи, коли документ не підійшов (e01, e02) — поведінка C: retake, upload-file, c:e07.
export function RetryActions({ go }: { go: (id: string) => void }) {
  const { set, setBag } = useProto()
  const back = (sheet: 'doc' | null) => {
    set({ scenario: 'ok' })
    setBag('q03.sheet', sheet)
    // q03 показує документ як ще не завантажений (як retake у C)
    setBag('q03.retake', true)
    go('q03')
  }
  return (
    <>
      <Button size="lg" onClick={() => back(null)}>
        Сфотографировать ещё раз
      </Button>
      <Button size="lg" variant="outline" onClick={() => back('doc')}>
        Загрузить файл
      </Button>
      <Button size="lg" variant="ghost" className="text-primary" onClick={() => go('e07')}>
        Ввести вручную
      </Button>
    </>
  )
}

// Коротке повідомлення над кнопками; зникає саме за 4 с (як showToast у C).
function Toast({ text }: { text: string }) {
  return (
    <div role="status" className="absolute inset-x-6 bottom-full mb-2 rounded-md bg-foreground px-4 py-3 text-sm text-surface animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
      {text}
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])
  return [toast, setToast] as const
}

// Вікно «Вход» — як у o02 (тексти з C, S.sheet === 'login').
export function LoginSheet({ open, onOpenChange, onLogin, onRecover }: { open: boolean; onOpenChange: (v: boolean) => void; onLogin: () => void; onRecover: () => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="gap-0 px-6 pt-6 pb-8">
        <SheetTitle className="text-2xl font-semibold tracking-tight">Вход</SheetTitle>
        <div className="mt-5 flex flex-col gap-2">
          <Label htmlFor="e06-email">Email</Label>
          <Input id="e06-email" type="email" placeholder="you@example.com" className="h-12" />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Label htmlFor="e06-pass">Пароль</Label>
          <Input id="e06-pass" type="password" className="h-12" />
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <Button size="lg" onClick={onLogin}>
            Войти
          </Button>
          <Button size="lg" variant="ghost" className="text-primary" onClick={onRecover}>
            Восстановить пароль
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Як fmtCd у C: 872 → «14:32».
export function fmtCd(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}
