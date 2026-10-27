import { Clock, Heart, ImageIcon, MessageCircle, Pin, Share, ShieldCheck, Ship } from 'lucide-react'
import { Status } from '@/components/app/status'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import type { Post } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { durText } from '../q/_parts'
import { authorByName, Avatar, Hl, postsBy, roleText, SaveButton, useLikes, useMe, type MyPost } from './_feed-parts'

// Елемент стрічки (на основі FeedItem з g01, для зареєстрованого моряка):
// закладка на кожній публікації й новині, «Нравится», коментарі, «Поделиться»; тап на автора — короткий профіль.

type ItemProps = {
  p: Post
  onOpen: (id: string) => void
  onAuthor: (name: string) => void
  /** слова пошуку для підсвітки */
  words?: string[]
  /** закріплену новину показувати звичайним рядком (у пошуку) */
  flat?: boolean
}

export function FeedItem({ p, onOpen, onAuthor, words = [], flat }: ItemProps) {
  const { showToast } = useProto()
  const likes = useLikes()

  if (p.kind === 'news' && p.pin && !flat) {
    return (
      <article className="mx-4 rounded-xl bg-hero p-5">
        <div className="flex items-center gap-3">
          <span className="flex-1 text-sm font-medium text-primary">Новости Seafolio</span>
          <Badge variant="outline" className="border-primary text-primary">
            <Pin /> Закреплено
          </Badge>
          <SaveButton id={p.id} className="-mr-2" />
        </div>
        <button type="button" onClick={() => onOpen(p.id)} className="mt-2 flex flex-col text-left">
          <span className="text-xl leading-snug font-semibold tracking-tight">{p.title}</span>
          <span className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{p.text}</span>
        </button>
      </article>
    )
  }

  if (p.kind === 'news') {
    return (
      <article className="border-t border-border px-5 py-4 first:border-t-0">
        <div className="flex items-center gap-3">
          <span className="flex-1 text-sm font-medium text-primary">Новости Seafolio</span>
          <span className="text-sm text-muted-foreground">{p.time}</span>
          <SaveButton id={p.id} className="-my-2 -mr-2" />
        </div>
        <button type="button" onClick={() => onOpen(p.id)} className="mt-1 flex flex-col text-left">
          <span className="text-[17px] font-semibold">
            <Hl text={p.title} words={words} />
          </span>
          <span className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
            <Hl text={p.text} words={words} />
          </span>
        </button>
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

  const liked = likes.isLiked(p.id)
  return (
    <article className="border-t border-border px-5 py-4 first:border-t-0">
      <div className="flex items-start gap-3">
        <AuthorButton name={p.name} av={p.av} role={p.role} onAuthor={onAuthor} />
        <span className="pt-0.5 text-sm text-muted-foreground">{p.time}</span>
        <SaveButton id={p.id} className="-mt-1.5 -mr-2" />
      </div>
      <button type="button" onClick={() => onOpen(p.id)} className="mt-3 block w-full text-left text-[15px] leading-relaxed">
        <Hl text={p.text} words={words} />
      </button>
      {p.photo && <PhotoStub className="mt-3" />}
      <div className="mt-3 flex gap-6 text-sm text-muted-foreground">
        <button type="button" aria-pressed={liked} aria-label="Нравится" className={cn('flex items-center gap-1.5', liked && 'text-primary')} onClick={() => likes.toggle(p.id)}>
          <Heart className={cn('size-[18px]', liked && 'fill-current')} />
          <span className="font-mono">{p.likes + (liked ? 1 : 0)}</span>
        </button>
        <button type="button" aria-label="Комментарии" className="flex items-center gap-1.5" onClick={() => onOpen(p.id)}>
          <MessageCircle className="size-[18px]" />
          <span className="font-mono">{p.comments}</span>
        </button>
        <button type="button" className="flex items-center gap-1.5" onClick={() => showToast('Ссылка скопирована (пример)')}>
          <Share className="size-[18px]" /> Поделиться
        </button>
      </div>
    </article>
  )
}

// Автор: аватар, ім'я з відміткою «документ моряка проверен», посада. Тап — короткий профіль.
export function AuthorButton({ name, av, role, onAuthor, onPage }: { name: string; av: string; role: string; onAuthor: (name: string) => void; onPage?: boolean }) {
  return (
    <button type="button" onClick={() => onAuthor(name)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
      <Avatar className={onPage ? 'bg-card' : undefined}>{av}</Avatar>
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-1.5 text-[15px] font-semibold">
          {name}
          <ShieldCheck className="size-4 shrink-0 text-primary" aria-label="Документ моряка проверен" />
        </span>
        <span className="truncate text-sm text-muted-foreground">{roleText(role)}</span>
      </span>
    </button>
  )
}

export function PhotoStub({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-44 items-center justify-center rounded-xl bg-muted text-muted-foreground', className)}>
      <ImageIcon className="size-6" />
    </div>
  )
}

// Своя публікація на перевірці: без відміток і закладки, зі статусом.
export function MyPostItem({ p }: { p: MyPost }) {
  const me = useMe()
  return (
    <article className="border-t border-border px-5 py-4 first:border-t-0">
      <div className="flex items-center gap-3">
        <Avatar>{me.initials}</Avatar>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[15px] font-semibold">{me.name}</span>
          <span className="truncate text-sm text-muted-foreground">3rd Engineer, Chemical Tanker</span>
        </span>
        <span className="self-start pt-0.5 text-sm text-muted-foreground">только что</span>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line">{p.text}</p>
      {p.photo && <PhotoStub className="mt-3 h-32" />}
      {p.vessel && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Ship className="size-4 text-primary" /> {p.vessel}
        </p>
      )}
      <Status className="mt-3">
        <Clock className="size-4" /> на проверке у модератора
      </Status>
    </article>
  )
}

/* ---------- короткий профіль моряка (правка п. 16) ---------- */

// Лише: фото або ініціали, ім'я, «документ моряка проверен», посада, тип судна, загальний стаж, його публікації.
// Без документів, контактів, дати народження, статусу доступності, розбивки стажу і без кнопки повідомлень (моряки між собою не переписуються).
export function AuthorSheet({ name, onClose, onOpenPost }: { name: string | null; onClose: () => void; onOpenPost: (id: string) => void }) {
  const a = name ? authorByName(name) : undefined
  const posts = name ? postsBy(name) : []
  return (
    <Sheet open={!!a} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" showCloseButton={false} onOpenAutoFocus={(e) => e.preventDefault()} className="max-h-[88%] gap-0 overflow-y-auto px-6 pt-6 pb-8">
        {a && (
          <>
            <div className="flex items-center gap-4">
              <Avatar size="lg">{a.av}</Avatar>
              <div className="flex min-w-0 flex-col gap-1">
                <SheetTitle className="text-2xl leading-tight font-semibold tracking-tight">{a.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="size-4 shrink-0 text-primary" /> Документ моряка проверен
                </SheetDescription>
              </div>
            </div>
            <dl className="mt-5 flex flex-col">
              {(
                [
                  ['Должность', a.rank, false],
                  ['Тип судна', a.ship, false],
                  ['Общий стаж', durText(a.months), true],
                ] as const
              ).map(([l, v, mono]) => (
                <div key={l} className="flex items-baseline justify-between gap-4 border-t border-border py-3 first:border-t-0">
                  <dt className="text-[15px] text-muted-foreground">{l}</dt>
                  <dd className={cn('text-right text-[15px] font-medium', mono && 'font-mono')}>{v}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-6 flex items-baseline gap-2 text-base font-semibold">
              Публикации <span className="font-mono text-sm font-normal text-muted-foreground">{posts.length}</span>
            </h3>
            {posts.length ? (
              <ul className="mt-2 flex flex-col overflow-hidden rounded-xl bg-muted">
                {posts.map((p) => (
                  <li key={p.id} className="border-t border-border first:border-t-0">
                    <button type="button" onClick={() => onOpenPost(p.id)} className="flex w-full flex-col gap-1 px-4 py-3 text-left">
                      <span className="line-clamp-3 text-[15px] leading-relaxed">{p.text}</span>
                      <span className="flex items-center gap-4 text-sm text-muted-foreground">
                        {p.time}
                        <span className="flex items-center gap-1" aria-label="Нравится">
                          <Heart className="size-3.5" /> <span className="font-mono">{p.likes}</span>
                        </span>
                        <span className="flex items-center gap-1" aria-label="Комментарии">
                          <MessageCircle className="size-3.5" /> <span className="font-mono">{p.comments}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[15px] text-muted-foreground">Публикаций пока нет.</p>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
