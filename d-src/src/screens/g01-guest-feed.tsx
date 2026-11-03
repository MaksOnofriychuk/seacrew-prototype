import { Bookmark, Heart, ImageIcon, MessageCircle, Newspaper, Pin, Share, ShieldCheck, UserRound } from 'lucide-react'
import { AppHead } from '@/components/app/app-head'
import { useGate } from '@/components/app/gate-sheet'
import { ViewState } from '@/components/app/states'
import { TabBar } from '@/components/app/tab-bar'
import { Badge } from '@/components/ui/badge'
import { POSTS, type Post } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from './registry'

// g01 — стрічка гостя (правка №9): ті самі публікації, що бачить моряк, без плашки «Вы смотрите как гость».
// Читати можна; будь-яка дія (лайк, коментар, закладка, «Поделиться», автор, нова публікація) → спільне вікно гостя.
// Сильний елемент — закріплена новина; решта — тихий список з роздільниками, як у p01.
export function G01GuestFeed({ go }: ScreenProps) {
  const { state, set } = useProto()
  const { gate, sheet } = useGate(go)
  const f = state.feedFilter
  const list = POSTS.filter((p) => f === 'all' || (f === 'people' ? p.kind === 'user' : p.kind === 'news'))
  const pinned = list.find((p) => p.kind === 'news' && p.pin)
  const rest = list.filter((p) => p !== pinned)

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AppHead title="Лента" onAvatar={() => gate('profile')} onBell={() => gate('notifications')} notifications={0} />
        <div className="flex flex-col gap-4 px-6 pt-4">
          <button
            type="button"
            onClick={() => gate('post')}
            className="flex h-12 items-center gap-3 rounded-md border border-border bg-surface px-3 text-left text-[15px] text-muted-foreground"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-muted">
              <UserRound className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate">Расскажите что-то интересное</span>
            <ImageIcon className="size-5 text-primary" />
          </button>
          <div className="flex gap-2" role="group" aria-label="Что показывать">
            {(
              [
                ['all', 'Все'],
                ['people', 'Моряки'],
                ['news', 'Новости'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={f === id}
                onClick={() => set({ feedFilter: id })}
                className={cn(
                  'h-9 rounded-full border px-4 text-sm font-medium transition-colors',
                  f === id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <ViewState
          empty={{
            icon: Newspaper,
            title: 'Публикаций пока нет',
            text: 'Здесь появятся новости Seafolio и истории моряков.',
          }}
          loading={{ kind: 'list', rows: 4 }}
        >
          <div className="mt-4 flex flex-col gap-3 pb-4">
            {pinned && <FeedItem p={pinned} onAct={gate} />}
            {rest.length > 0 && (
              <div className="mx-4 overflow-hidden rounded-xl border border-border bg-surface">
                {rest.map((p) => (
                  <FeedItem key={p.id} p={p} onAct={gate} />
                ))}
              </div>
            )}
          </div>
        </ViewState>
      </div>
      <TabBar active="feed" counts={{}} onTab={(t) => (t === 'vac' ? go('g02') : t === 'feed' ? undefined : gate(t))} />
      {sheet}
    </div>
  )
}

function SaveGate({ onAct, className }: { onAct: (a: string) => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label="Сохранить"
      onClick={() => onAct('save')}
      className={cn('flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground active:scale-95', className)}
    >
      <Bookmark className="size-5" />
    </button>
  )
}

function FeedItem({ p, onAct }: { p: Post; onAct: (a: string) => void }) {
  if (p.kind === 'news' && p.pin) {
    return (
      <article className="mx-4 rounded-xl bg-hero p-5">
        <div className="flex items-center gap-3">
          <span className="flex-1 text-sm font-medium text-primary">Новости Seafolio</span>
          <Badge variant="outline" className="border-primary text-primary">
            <Pin /> Закреплено
          </Badge>
          <SaveGate onAct={onAct} className="-mr-2" />
        </div>
        <h2 className="mt-2 text-xl leading-snug font-semibold tracking-tight">{p.title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{p.text}</p>
      </article>
    )
  }
  if (p.kind === 'news') {
    return (
      <article className="border-t border-border px-5 py-4 first:border-t-0">
        <div className="flex items-center gap-3">
          <span className="flex-1 text-sm font-medium text-primary">Новости Seafolio</span>
          <span className="text-sm text-muted-foreground">{p.time}</span>
          <SaveGate onAct={onAct} className="-my-2 -mr-2" />
        </div>
        <h2 className="mt-1 text-[17px] font-semibold">{p.title}</h2>
        <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{p.text}</p>
      </article>
    )
  }
  return (
    <article className="border-t border-border px-5 py-4 first:border-t-0">
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => onAct('author')} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">{p.av}</span>
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1.5 text-[15px] font-semibold">
              {p.name}
              <ShieldCheck className="size-4 shrink-0 text-primary" aria-label="Документ моряка проверен" />
            </span>
            <span className="truncate text-sm text-muted-foreground">{p.role}</span>
          </span>
        </button>
        <span className="pt-0.5 text-sm text-muted-foreground">{p.time}</span>
        <SaveGate onAct={onAct} className="-mt-1.5 -mr-2" />
      </div>
      <p className="mt-3 text-[15px] leading-relaxed">{p.text}</p>
      {p.photo && (
        <div className="mt-3 flex h-44 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <ImageIcon className="size-6" />
        </div>
      )}
      <div className="mt-3 flex gap-6 text-sm text-muted-foreground">
        <button type="button" aria-label="Нравится" className="flex items-center gap-1.5" onClick={() => onAct('react')}>
          <Heart className="size-[18px]" /> <span className="font-mono">{p.likes}</span>
        </button>
        <button type="button" aria-label="Комментарии" className="flex items-center gap-1.5" onClick={() => onAct('comment')}>
          <MessageCircle className="size-[18px]" /> <span className="font-mono">{p.comments}</span>
        </button>
        <button type="button" className="flex items-center gap-1.5" onClick={() => onAct('share')}>
          <Share className="size-[18px]" /> Поделиться
        </button>
      </div>
    </article>
  )
}
