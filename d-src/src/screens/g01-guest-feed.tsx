import { Heart, ImageIcon, MessageCircle, Pin, Share, ShieldCheck, UserRound } from 'lucide-react'
import { AppHead, GuestNote } from '@/components/app/app-head'
import { useGate } from '@/components/app/gate-sheet'
import { TabBar } from '@/components/app/tab-bar'
import { Badge } from '@/components/ui/badge'
import { POSTS, type Post } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from './registry'

// g01 — стрічка гостя: зразки публікацій; будь-яка дія → «Зарегистрируйтесь, чтобы…».
// Сильний елемент — закріплена новина; решта — тихий список без карток.
export function G01GuestFeed({ go }: ScreenProps) {
  const { state, set } = useProto()
  const { gate, sheet } = useGate(go)
  const f = state.feedFilter
  const list = POSTS.filter((p) => f === 'all' || (f === 'people' ? p.kind === 'user' : p.kind === 'news'))

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AppHead title="Лента" onAvatar={() => gate('profile')} />
        <div className="flex flex-col gap-4 px-6 pt-4">
          <GuestNote>
            <b className="font-medium text-foreground">Вы смотрите как гость.</b> Это примеры — настоящие публикации появятся после регистрации.
          </GuestNote>
          <button
            type="button"
            onClick={() => gate('post')}
            className="flex h-12 items-center gap-3 rounded-md border border-border bg-surface px-3 text-left text-[15px] text-muted-foreground"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-muted">
              <UserRound className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate">Поделитесь опытом или задайте вопрос</span>
            <ImageIcon className="size-5 text-primary" />
          </button>
          <div className="flex gap-2">
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
        <div className="mt-4 flex flex-col gap-3 pb-4">
          {list.some((p) => p.kind === 'news' && p.pin) && <FeedItem p={list.find((p) => p.kind === 'news' && p.pin)!} onAct={gate} />}
          <div className="mx-4 overflow-hidden rounded-xl bg-surface">
            {list
              .filter((p) => !(p.kind === 'news' && p.pin))
              .map((p) => (
                <FeedItem key={p.id} p={p} onAct={gate} />
              ))}
          </div>
        </div>
      </div>
      <TabBar active="feed" onTab={(t) => (t === 'vac' ? go('g02') : t === 'feed' ? undefined : gate(t))} />
      {sheet}
    </div>
  )
}

function FeedItem({ p, onAct }: { p: Post; onAct: (a: string) => void }) {
  if (p.kind === 'news' && p.pin) {
    return (
      <article className="mx-4 rounded-xl bg-hero p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-primary">Новости Seafolio</span>
          <Badge variant="outline" className="border-primary text-primary">
            <Pin /> Закреплено
          </Badge>
        </div>
        <h2 className="mt-3 text-xl leading-snug font-semibold tracking-tight">{p.title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{p.text}</p>
      </article>
    )
  }
  if (p.kind === 'news') {
    return (
      <article className="border-t border-border px-5 py-4 first:border-t-0">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-primary">Новости Seafolio</span>
          <span className="text-sm text-muted-foreground">{p.time}</span>
        </div>
        <h2 className="mt-2 text-[17px] font-semibold">{p.title}</h2>
        <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{p.text}</p>
      </article>
    )
  }
  if (p.kind === 'ad') {
    return (
      <article className="border-t border-border px-5 py-4 first:border-t-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold">Медосмотр за 1 день</span>
            <span className="text-sm text-muted-foreground">Клиника «Пример», Одесса</span>
          </div>
          <Badge variant="outline">Реклама</Badge>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed">Медкомиссия для моряков по требованиям ПДНВ. Запись онлайн, результат в тот же день.</p>
        <button type="button" className="mt-2 text-sm font-medium text-primary">
          Записаться
        </button>
      </article>
    )
  }
  return (
    <article className="border-t border-border px-5 py-4 first:border-t-0">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">{p.av}</span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1.5 text-[15px] font-semibold">
            {p.name}
            <ShieldCheck className="size-4 text-primary" aria-label="Документ моряка проверен" />
          </span>
          <span className="truncate text-sm text-muted-foreground">{p.role}</span>
        </div>
        <span className="self-start text-sm text-muted-foreground">{p.time}</span>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed">{p.text}</p>
      {p.photo && (
        <div className="mt-3 flex h-44 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <ImageIcon className="size-6" />
        </div>
      )}
      <div className="mt-3 flex gap-6 text-sm text-muted-foreground">
        <button type="button" className="flex items-center gap-1.5" onClick={() => onAct('react')}>
          <Heart className="size-[18px]" /> {p.likes}
        </button>
        <button type="button" className="flex items-center gap-1.5" onClick={() => onAct('react')}>
          <MessageCircle className="size-[18px]" /> {p.comments}
        </button>
        <button type="button" className="flex items-center gap-1.5" onClick={() => onAct('share')}>
          <Share className="size-[18px]" /> Поделиться
        </button>
      </div>
    </article>
  )
}
