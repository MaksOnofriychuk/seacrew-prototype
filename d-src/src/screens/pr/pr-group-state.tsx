import { Anchor, Check, MessageSquare } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { MY_REPLIES, MY_TOPICS_SEED, REPLIES, TOPICS, TOPIC_SOLVED, type GroupTopic, type Reply } from '@/lib/data-premium'
import { cn } from '@/lib/utils'
import { usePr } from './_parts'

// Состояние раздела «Обсуждения» (правка №43): одно значение в bag 'pr.gr'. Темы моряка, ответы, «полезно», решение.
export type GroupsState = {
  mine: GroupTopic[]
  deleted: string[]
  helpful: Record<string, boolean>
  solved: Record<string, number | null>
  added: Record<string, Reply[]>
  tab: 'all' | 'mine'
  section: string
}

const INIT: GroupsState = { mine: MY_TOPICS_SEED, deleted: [], helpful: {}, solved: {}, added: {}, tab: 'all', section: 'all' }

export const hKey = (tid: string, i: number) => tid + ':' + i

export function useGroups() {
  const pr = usePr()
  const g = pr.bag<GroupsState>('pr.gr', INIT)
  const patch = (p: Partial<GroupsState>) => pr.setBag('pr.gr', { ...g, ...p })
  const all: GroupTopic[] = [...g.mine, ...TOPICS].filter((t) => !g.deleted.includes(t.id))
  const repliesOf = (id: string): Reply[] => [...(REPLIES[id] ?? MY_REPLIES[id] ?? []), ...(g.added[id] ?? [])]
  const solvedOf = (id: string): number | null => (id in g.solved ? g.solved[id] : (TOPIC_SOLVED[id] ?? null))
  const likesOf = (tid: string, i: number, base: number) => base + (g.helpful[hKey(tid, i)] ? 1 : 0)
  return { ...pr, g, patch, all, repliesOf, solvedOf, likesOf }
}

export function Count({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 min-w-6 items-center justify-center gap-1 rounded-full bg-muted px-2 font-mono text-xs leading-none text-muted-foreground', className)}>
      <MessageSquare className="size-3" />
      {n}
    </span>
  )
}

export function SolvedMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm font-medium text-success', className)}>
      <Check className="size-4" strokeWidth={2.5} /> Решено
    </span>
  )
}

export function ReviewMark({ className }: { className?: string }) {
  return <span className={cn('rounded-full border border-warning/50 px-2 py-0.5 text-xs font-medium text-warning', className)}>На проверке</span>
}

export function TimeText({ children }: { children: string }) {
  return <MonoNums text={children} />
}

// Фото-заглушка: рисунок вместо снимка (в прототипе настоящих фото нет).
export function PhotoBlock({ className, big }: { className?: string; big?: boolean }) {
  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/25 via-muted to-primary/10 text-primary/70', big ? 'aspect-[4/3] w-full' : 'aspect-[2/1] w-full rounded-lg', className)}>
      <Anchor className={big ? 'size-16' : 'size-10'} strokeWidth={1.5} />
    </div>
  )
}
