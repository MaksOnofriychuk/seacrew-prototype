import type { ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { Button } from '@/components/ui/button'
import type { Tone } from '@/components/web/status-badge'
import { APPLICATIONS, WEB_JOBS, type Assignment, type ApplicationStatus, type JobStatus, type WebJob } from '@/lib/data-web'
import { CHATS, type Chat, type ChatMsg } from '@/lib/data-recruiter-2'
import { usePhonePortal } from '@/lib/phone-portal'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { SCREENS } from '../registry'

// Спільне для екранів вебу рекрутера (частина 2): вибраний запис між екранами, зміни статусів у межах сесії,
// перехід з запасним варіантом, вікно підтвердження, дрібні елементи.
// Ключі bag — з префіксом 'r2.'.

export type Go = (id: string) => void

export const ASSIGNMENT_TONE: Record<Assignment['status'], Tone> = { sent: 'primary', in_progress: 'warning', submitted: 'success' }

/** ISO-дата → «05.12.2026» */
export const ruDate = (iso: string) => (iso ? iso.split('-').reverse().join('.') : '')

/** Перейти на перший уже намальований екран зі списку; якщо жодного — показати тост. */
export function useGoOr(go: Go) {
  const { showToast } = useProto()
  return (ids: string[], toast: string) => {
    const id = ids.find((x) => SCREENS.some((s) => s.id === x))
    if (id) go(id)
    else showToast(toast)
  }
}

export function useR2() {
  const { bag, setBag, showToast } = useProto()

  const jobStatus = bag<Record<string, JobStatus>>('r2.jobStatus', {})
  const created = bag<WebJob | null>('r2.newJob', null)
  const edits = bag<Record<string, WebJob>>('r2.jobEdits', {})
  const jobs: WebJob[] = [...(created ? [created] : []), ...WEB_JOBS].map((j) => ({ ...(edits[j.id] ?? j), status: jobStatus[j.id] ?? (edits[j.id] ?? j).status }))

  const appStatus = bag<Record<string, ApplicationStatus>>('r2.appStatus', {})
  const apps = APPLICATIONS.map((a) => ({ ...a, status: appStatus[a.id] ?? a.status }))

  const sent = bag<Record<string, ChatMsg[]>>('r2.sent', {})
  const readChats = bag<string[]>('r2.read', [])
  const chats: Chat[] = CHATS.map((c) => ({ ...c, unread: readChats.includes(c.id) ? 0 : c.unread, messages: [...c.messages, ...(sent[c.id] ?? [])] }))

  return {
    showToast,
    jobs,
    jobId: bag<string>('r2.job', 'j01'),
    openJob: (id: string) => setBag('r2.job', id),
    setJobStatus: (id: string, s: JobStatus) => setBag('r2.jobStatus', { ...jobStatus, [id]: s }),
    /** 'new' — нова вакансія, інакше id вакансії для редагування */
    editId: bag<string>('r2.edit', 'new'),
    setEdit: (id: string) => setBag('r2.edit', id),
    saveJob: (j: WebJob) => {
      if (j.id === 'j-new') setBag('r2.newJob', j)
      else setBag('r2.jobEdits', { ...edits, [j.id]: j })
    },

    apps,
    setAppStatus: (id: string, s: ApplicationStatus) => setBag('r2.appStatus', { ...appStatus, [id]: s }),
    appId: bag<string>('r2.app', 'ap03'),
    selectApp: (id: string) => setBag('r2.app', id),

    chats,
    chatId: bag<string>('r2.chat', 'ap01'),
    openChat: (id: string) => {
      setBag('r2.chat', id)
      if (!readChats.includes(id)) setBag('r2.read', [...readChats, id])
    },
    send: (chatId: string, m: ChatMsg) => setBag('r2.sent', { ...sent, [chatId]: [...(sent[chatId] ?? []), m] }),

    formId: bag<string>('r2.form', 'f01'),
    openForm: (id: string) => setBag('r2.form', id),
    assignmentId: bag<string>('r2.as', 'as01'),
    openAssignment: (id: string) => setBag('r2.as', id),
  }
}

// Вікно підтвердження по центру вікна браузера (для незворотних дій: закрити вакансію, відхилити).
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  text,
  confirm,
  onConfirm,
  danger = false,
  children,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  text?: ReactNode
  confirm: string
  onConfirm: () => void
  danger?: boolean
  children?: ReactNode
}) {
  const container = usePhonePortal()
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="absolute inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="absolute top-1/2 left-1/2 z-50 flex w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-border bg-surface p-6 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] motion-reduce:animate-none">
          <div className="flex flex-col gap-1.5">
            <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
            {text && <Dialog.Description className="text-[15px] text-muted-foreground">{text}</Dialog.Description>}
          </div>
          {children}
          <div className="mt-2 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline">Отмена</Button>
            </Dialog.Close>
            <Button
              variant={danger ? 'destructive' : 'default'}
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
            >
              {confirm}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Тихий заголовок блоку всередині сторінки (без карток): назва і необов'язкова дія праворуч.
export function BlockHead({ title, aside, className }: { title: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-baseline justify-between gap-4', className)}>
      <h2 className="text-base font-semibold">{title}</h2>
      {aside}
    </div>
  )
}

// Перегляди за 14 днів: тихі стовпчики, останній день — основним кольором.
export function ViewBars({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(1, ...data)
  return (
    <div className={cn('flex h-10 items-end gap-[3px]', className)} aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className={cn('w-2 rounded-[2px]', i === data.length - 1 ? 'bg-primary' : 'bg-primary/25')}
          style={{ height: v ? `${Math.max(8, (v / max) * 100)}%` : '2px' }}
        />
      ))}
    </div>
  )
}

/** «1 отклик / 3 отклика / 5 откликов» */
export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}
