import { useRef, useState } from 'react'
import { Heart, MessageCircle, Pin, SendHorizontal, Share } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { POSTS } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { AuthorButton, AuthorSheet, PhotoStub } from './_feed-item'
import { Avatar, COMMENTS, hashParam, SaveButton, useLikes, useMe } from './_feed-parts'

// p07 — публікація з коментарями (C: postScreen). «Нравится», коментарі, «Поделиться», закладка.
// Тап на автора публікації чи коментаря — короткий профіль моряка (правка п. 16).
// Сильний елемент — сама публікація великим текстом; коментарі — тихий білий список.
export function P07Post({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useProto()
  const me = useMe()
  const likes = useLikes()
  const [author, setAuthor] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  const [linked] = useState(() => hashParam('post'))
  const id = bag<string>('feed.post', linked ?? 'u1')
  const p = POSTS.find((x) => x.id === id && x.kind !== 'ad') ?? POSTS[1]
  const myComments = bag<Record<string, string[]>>('post.mine', {})
  const own = myComments[p.id] ?? []

  const send = () => {
    const t = draft.trim()
    if (!t) return
    setBag('post.mine', { ...myComments, [p.id]: [...own, t] })
    setDraft('')
  }

  return (
    <div className="flex h-full flex-col">
      <NavBar title="Публикация" onBack={() => go('p01')} right={<SaveButton id={p.id} className="size-11" />} />
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        {p.kind === 'news' ? (
          <article className="pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-primary">Новости Seafolio</span>
              {p.pin ? (
                <Badge variant="outline" className="border-primary text-primary">
                  <Pin /> Закреплено
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">{p.time}</span>
              )}
            </div>
            <h1 className="mt-3 text-[28px] leading-tight font-semibold tracking-tight">{p.title}</h1>
            <p className="mt-3 text-[17px] leading-relaxed">{p.text}</p>
          </article>
        ) : p.kind === 'user' ? (
          <>
            <article className="pt-3">
              <div className="flex items-start gap-3">
                <AuthorButton name={p.name} av={p.av} role={p.role} onAuthor={setAuthor} onPage />
                <span className="pt-0.5 text-sm text-muted-foreground">{p.time}</span>
              </div>
              <p className="mt-4 text-[17px] leading-relaxed">{p.text}</p>
              {p.photo && <PhotoStub className="mt-4 bg-card" />}
              <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
                <button
                  type="button"
                  aria-pressed={likes.isLiked(p.id)}
                  className={cn('flex items-center gap-1.5', likes.isLiked(p.id) && 'text-primary')}
                  onClick={() => likes.toggle(p.id)}
                >
                  <Heart className={cn('size-[18px]', likes.isLiked(p.id) && 'fill-current')} />
                  Нравится <span className="font-mono">{p.likes + (likes.isLiked(p.id) ? 1 : 0)}</span>
                </button>
                <button type="button" aria-label="Комментировать" className="flex items-center gap-1.5" onClick={() => input.current?.focus()}>
                  <MessageCircle className="size-[18px]" />
                  <span className="font-mono">{p.comments + own.length}</span>
                </button>
                <button type="button" className="flex items-center gap-1.5" onClick={() => showToast('Ссылка скопирована (пример)')}>
                  <Share className="size-[18px]" /> Поделиться
                </button>
              </div>
            </article>

            <h2 className="mt-7 mb-2 text-base font-semibold">Комментарии</h2>
            <ul className="overflow-hidden rounded-xl border border-border bg-surface">
              {COMMENTS.map(([av, name, time, text]) => (
                <Comment key={name} av={av} name={name} time={time} text={text} onAuthor={() => setAuthor(name)} />
              ))}
              {own.map((text, i) => (
                <Comment key={i} av={me.initials} name={me.name} time="только что" text={text} />
              ))}
            </ul>
          </>
        ) : null}
      </div>
      {p.kind === 'user' && (
        <Footer className="flex-row items-center gap-2 border-t border-border bg-surface">
          <input
            ref={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Напишите комментарий"
            aria-label="Комментарий"
            className="h-11 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-primary"
          />
          <Button size="icon-lg" className="size-11" aria-label="Отправить" disabled={!draft.trim()} onClick={send}>
            <SendHorizontal className="size-5" />
          </Button>
        </Footer>
      )}
      <AuthorSheet
        name={author}
        onClose={() => setAuthor(null)}
        onOpenPost={(pid) => {
          setAuthor(null)
          setBag('feed.post', pid)
          setDraft('')
          scroller.current?.scrollTo({ top: 0 })
        }}
      />
    </div>
  )
}

function Comment({ av, name, time, text, onAuthor }: { av: string; name: string; time: string; text: string; onAuthor?: () => void }) {
  const head = (
    <>
      <Avatar size="sm">{av}</Avatar>
      <span className="text-[15px] font-semibold">{name}</span>
    </>
  )
  return (
    <li className="flex flex-col gap-1.5 border-t border-border px-4 py-3 first:border-t-0">
      <div className="flex items-center gap-2.5">
        {onAuthor ? (
          <button type="button" onClick={onAuthor} className="flex min-w-0 items-center gap-2.5 text-left">
            {head}
          </button>
        ) : (
          <span className="flex min-w-0 items-center gap-2.5">{head}</span>
        )}
        <span className="ml-auto text-sm text-muted-foreground">{time}</span>
      </div>
      <p className="pl-[42px] text-[15px] leading-relaxed">{text}</p>
    </li>
  )
}
