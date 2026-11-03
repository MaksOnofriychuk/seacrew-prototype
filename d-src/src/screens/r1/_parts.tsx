import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Wordmark } from '@/components/app/chrome'
import { HeroPanel } from '@/components/app/hero-panel'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { useProto } from '@/lib/proto-state'
import { profilePct, R1_INVITE_LABEL, R1_INVITES, type R1Invite, type R1InviteStatus } from '@/lib/data-recruiter-1'
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

/** «Профиль неполный» (ТЗ §6): тиха позначка біля імені, поки профіль моряка не заповнено на 100 %. */
export function IncompleteMark({ id, className }: { id: string; className?: string }) {
  const pct = profilePct(id)
  if (pct >= 100) return null
  return (
    <span title={`Профиль заполнен на ${pct} %`} className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border border-warning/40 px-2 py-0.5 text-xs font-normal tracking-normal whitespace-nowrap text-foreground', className)}>
      <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
      Профиль неполный
    </span>
  )
}

const INVITE_TONE: Record<R1InviteStatus, Tone> = { pending: 'warning', accepted: 'success', declined: 'muted', cancelled: 'muted' }
export const InviteDot = ({ s }: { s: R1InviteStatus }) => <StatusDot tone={INVITE_TONE[s]}>{R1_INVITE_LABEL[s]}</StatusDot>

// WebDialog переїхав у components/web/dialog.tsx; тут лишається для старих імпортів.
export { WebDialog } from '@/components/web/dialog'

// Вхід і реєстрація — без оболонки кабінету: ліворуч панель з морською сіткою (як в онбордингу), праворуч форма.
// go — «На сайт» угорі панелі веде на публічну головну (pub-landing).
export function AuthLayout({ children, aside, go }: { children: ReactNode; aside?: ReactNode; go?: (id: string) => void }) {
  return (
    <div className="flex h-full min-h-0">
      <HeroPanel className="w-[560px] justify-between border-r border-border">
        <div className="relative flex items-center gap-2 px-12 pt-10">
          <Wordmark />
          <span className="text-sm text-muted-foreground">для агентств</span>
          {go && (
            <button type="button" onClick={() => go('pub-landing')} className="ml-auto flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <ArrowLeft className="size-4" /> На сайт
            </button>
          )}
        </div>
        <div className="relative flex flex-col gap-3 px-12 pb-10">{aside}</div>
      </HeroPanel>
      <div className="flex min-h-0 flex-1 overflow-y-auto bg-background">
        <div className="m-auto w-full max-w-[440px] px-6 py-8">{children}</div>
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
