import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { Wordmark } from '@/components/app/chrome'
import { HeroPanel } from '@/components/app/hero-panel'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { usePhonePortal } from '@/lib/phone-portal'
import { useProto } from '@/lib/proto-state'
import { R1_INVITE_LABEL, R1_INVITES, type R1Invite, type R1InviteStatus } from '@/lib/data-recruiter-1'
import { cn } from '@/lib/utils'
import { SCREENS } from '../registry'

// Спільне для екранів «Веб рекрутера, частина 1».

/** Перехід на екран, а якщо його ще немає в прототипі — тост (жодних мертвих кнопок). */
export function useGoOr(go: (id: string) => void) {
  const { showToast } = useProto()
  return (id: string, fallback: string) => (SCREENS.some((s) => s.id === id) ? go(id) : showToast(fallback))
}

/** Вибраний моряк (пошук → профіль) і кандидат (кандидати → картка). */
export function useSelected(key: 'r1.seafarer' | 'r1.candidate', fallback: string) {
  const { bag, setBag } = useProto()
  return [bag<string>(key, fallback), (id: string) => setBag(key, id)] as const
}

/** Запрошення живуть між екранами: «Позвать на работу» з профілю з'являється в «Приглашениях». */
export function useInvites() {
  const { bag, setBag } = useProto()
  const list = bag<R1Invite[]>('r1.invites', R1_INVITES)
  return {
    list,
    add: (i: Omit<R1Invite, 'id'>) => setBag('r1.invites', [{ ...i, id: `new-${list.length + 1}` }, ...list]),
    setStatus: (id: string, status: R1InviteStatus) => setBag('r1.invites', list.map((i) => (i.id === id ? { ...i, status } : i))),
  }
}

const INVITE_TONE: Record<R1InviteStatus, Tone> = { pending: 'warning', accepted: 'success', declined: 'muted', cancelled: 'muted' }
export const InviteDot = ({ s }: { s: R1InviteStatus }) => <StatusDot tone={INVITE_TONE[s]}>{R1_INVITE_LABEL[s]}</StatusDot>

// Вікно посередині вікна браузера (як BottomSheet у телефоні): заголовок, вміст, дії внизу праворуч.
export function WebDialog({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const container = usePhonePortal()
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="absolute inset-0 z-50 bg-black/40 duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'absolute inset-0 z-50 m-auto flex h-fit max-h-[85%] w-[520px] flex-col rounded-xl border border-border bg-surface outline-none duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]',
            className,
          )}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement | null)?.focus()
          }}
        >
          <div className={cn('flex items-start justify-between gap-4 px-6 pt-5', !children && 'pb-5')}>
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-xl leading-tight font-semibold tracking-tight">{title}</Dialog.Title>
              {description ? <Dialog.Description className="text-sm text-muted-foreground">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{typeof title === 'string' ? title : ''}</Dialog.Description>}
            </div>
            <Dialog.Close aria-label="Закрыть" className="-mt-1 -mr-2 flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {children && <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-6 pt-5 pb-6">{children}</div>}
          {footer && <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Вхід і реєстрація — без оболонки кабінету: ліворуч панель з морською сіткою (як в онбордингу), праворуч форма.
export function AuthLayout({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex h-full min-h-0">
      <HeroPanel className="w-[560px] justify-between border-r border-border">
        <div className="relative flex items-center gap-2 px-12 pt-10">
          <Wordmark />
          <span className="text-sm text-muted-foreground">для агентств</span>
        </div>
        <div className="relative flex flex-col gap-3 px-12 pb-10">{aside}</div>
      </HeroPanel>
      <div className="flex min-h-0 flex-1 overflow-y-auto bg-background">
        <div className="m-auto w-full max-w-[440px] px-6 py-12">{children}</div>
      </div>
    </div>
  )
}

// Тихий текст на панелі ліворуч: що це за кабінет. Без гасел.
export function Pitch() {
  return (
    <>
      <p className="max-w-[400px] text-[28px] leading-[1.2] font-semibold tracking-tight">Кабинет для крюинговых агентств</p>
      <p className="max-w-[400px] text-[15px] text-muted-foreground">Ищите моряков по флоту, должности и готовности к контракту, зовите на работу и ведите переписку в одном месте.</p>
    </>
  )
}
