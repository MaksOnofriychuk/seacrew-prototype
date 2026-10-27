import { Briefcase, FileText, Newspaper, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Tab = 'feed' | 'vac' | 'docs' | 'profile'

const TABS: { id: Tab; label: string; icon: typeof Newspaper }[] = [
  { id: 'feed', label: 'Лента', icon: Newspaper },
  { id: 'vac', label: 'Вакансии', icon: Briefcase },
  { id: 'docs', label: 'Документы', icon: FileText },
  { id: 'profile', label: 'Профиль', icon: UserRound },
]

// Нижні вкладки застосунку. Активна — кольором primary, без крапок і підсвічування.
export function TabBar({ active, onTab }: { active: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="grid shrink-0 grid-cols-4 border-t border-border bg-surface pt-2">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onTab(t.id)}
          aria-current={t.id === active ? 'page' : undefined}
          className={cn('flex flex-col items-center gap-1 py-1 text-[11px] font-medium', t.id === active ? 'text-primary' : 'text-muted-foreground')}
        >
          <t.icon className="size-6" strokeWidth={t.id === active ? 2 : 1.75} />
          {t.label}
        </button>
      ))}
    </nav>
  )
}
