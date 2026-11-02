import { Eye, UserRound } from 'lucide-react'
import { MainTopBar } from './top-bar'

// Шапка робочого екрана без «Назад»: Seafolio, дзвіночок і аватар (меню), великий заголовок.
// Для гостя: аватар — значок людини, дзвіночок без лічильника (notifications={0}).
export function AppHead({ title, onAvatar, onBell, notifications }: { title: string; onAvatar: () => void; onBell?: () => void; notifications?: number }) {
  return (
    <div className="shrink-0 px-6 pt-2">
      <MainTopBar onAvatar={onAvatar} onBell={onBell ?? onAvatar} notifications={notifications} avatar={<UserRound className="size-5 text-muted-foreground" />} />
      <h1 className="mt-3 text-[32px] leading-tight font-semibold tracking-tight">{title}</h1>
    </div>
  )
}

// Тиха примітка для гостя (тексти з C).
export function GuestNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-md bg-card px-4 py-3 text-sm text-muted-foreground">
      <Eye className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>{children}</span>
    </p>
  )
}
