import type { ReactNode } from 'react'
import { Bell } from 'lucide-react'
import { APP_COUNTS } from '@/lib/data'
import { cn } from '@/lib/utils'
import { Wordmark } from './chrome'
import { CountBadge } from './count-badge'

// Верхня панель головного екрана (правка №16): Seafolio ліворуч; праворуч — свої кнопки (extra, напр. пошук),
// дзвіночок «Уведомления» з лічильником і аватар (меню) поруч.
export function MainTopBar({
  onBell,
  onAvatar,
  avatar,
  notifications = APP_COUNTS.notifications,
  extra,
  className,
}: {
  onBell: () => void
  onAvatar: () => void
  /** ініціали або значок у кружку аватара */
  avatar: ReactNode
  /** лічильник на дзвіночку; 0 — без лічильника */
  notifications?: number
  extra?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex h-10 items-center gap-2', className)}>
      <Wordmark className="flex-1" />
      {extra}
      <BellButton n={notifications} onClick={onBell} />
      <button type="button" aria-label="Меню" onClick={onAvatar} className="flex size-10 items-center justify-center rounded-full bg-card text-sm font-semibold text-primary">
        {avatar}
      </button>
    </div>
  )
}

// Кругла кнопка верхньої панелі (той самий вигляд, що в пошуку стрічки).
export function TopBarButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="relative flex size-10 items-center justify-center rounded-full bg-card text-muted-foreground">
      {children}
    </button>
  )
}

export function BellButton({ n, onClick }: { n?: number; onClick: () => void }) {
  return (
    <TopBarButton label={n ? `Уведомления, новых: ${n}` : 'Уведомления'} onClick={onClick}>
      <Bell className="size-5" />
      <CountBadge n={n} className="-top-0.5 left-auto -right-0.5" />
    </TopBarButton>
  )
}
