import { Eye, UserRound } from 'lucide-react'
import { Wordmark } from './chrome'

// Шапка робочого екрана без «Назад»: Seafolio, аватар (меню), великий заголовок.
export function AppHead({ title, onAvatar }: { title: string; onAvatar: () => void }) {
  return (
    <div className="shrink-0 px-6 pt-2">
      <div className="flex h-10 items-center justify-between">
        <Wordmark />
        <button type="button" aria-label="Меню" onClick={onAvatar} className="flex size-10 items-center justify-center rounded-full bg-card text-muted-foreground">
          <UserRound className="size-5" />
        </button>
      </div>
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
