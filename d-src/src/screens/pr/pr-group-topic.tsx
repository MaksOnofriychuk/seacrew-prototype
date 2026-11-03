import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, Check, Flag, MessageSquareText, MoreHorizontal, Send, Share2, ThumbsUp, Trash2 } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { MediaViewer } from '@/components/app/media-viewer'
import { ShareSheet } from '@/components/app/share-sheet'
import { SourceSheet } from '@/components/app/source-sheet'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { TOPIC_PHOTOS } from '@/lib/data-premium'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { plural } from '../p/_app-parts'
import { Initials } from './_parts'
import { PhotoBlock, ReviewMark, SolvedMark, TimeText, hKey, useGroups } from './pr-group-state'

// pr-group — экран темы (правка №43): вопрос с фото, ответы, «Полезно», «Это решение» для автора,
// поле «Ответить» внизу, «Поделиться» и меню «⋯» (пожаловаться; для своей темы — удалить).

export function PrGroup({ go }: ScreenProps) {
  const { bag, setBag, showToast, g, patch, all, repliesOf, solvedOf, likesOf } = useGroups()
  const id = bag<string>('pr.topic', 't1')
  const t = all.find((x) => x.id === id) ?? all[0]
  const [viewer, setViewer] = useState(false)
  const [share, setShare] = useState(false)
  const [menu, setMenu] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const replies = t ? repliesOf(t.id) : []
  const solved = t ? solvedOf(t.id) : null
  const photo = t?.photo ?? (t ? TOPIC_PHOTOS[t.id] : undefined)
  const [seen, setSeen] = useState(replies.length)
  useEffect(() => {
    if (replies.length > seen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      setSeen(replies.length)
    }
  }, [replies.length, seen])
  if (!t) {
    go('pr-groups')
    return null
  }
  const back = bag<string>('back.pr-group', 'pr-groups')

  const toggleHelpful = (i: number) => {
    const k = hKey(t.id, i)
    const on = !g.helpful[k]
    patch({ helpful: { ...g.helpful, [k]: on } })
    showToast(on ? 'Отмечено как полезное' : 'Отметка убрана')
  }
  const toggleSolved = (i: number) => {
    const on = solved !== i
    patch({ solved: { ...g.solved, [t.id]: on ? i : null } })
    showToast(on ? 'Тема отмечена как решённая' : 'Отметка «Решено» снята')
  }
  const send = () => {
    const text = draft.trim()
    if (!text) return
    patch({ added: { ...g.added, [t.id]: [...(g.added[t.id] ?? []), { av: 'Я', name: 'Вы', rank: 'Моряк', time: 'сейчас', text, likes: 0 }] } })
    setDraft('')
  }
  const remove = () => {
    patch({ deleted: [...g.deleted, t.id] })
    setConfirm(false)
    setBag('pr.topic', null)
    go('pr-groups')
    showToast('Тема удалена')
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="grid h-12 shrink-0 grid-cols-[48px_1fr_96px] items-center px-2">
        <button type="button" onClick={() => go(back)} aria-label="Назад" className="flex size-11 items-center justify-center rounded-md text-primary active:scale-95">
          <ChevronLeft className="size-6" />
        </button>
        <span className="truncate text-center text-[15px] font-semibold">Тема</span>
        <span className="flex justify-end">
          <button type="button" onClick={() => setShare(true)} aria-label="Поделиться" className="flex size-11 items-center justify-center rounded-md text-primary active:scale-95">
            <Share2 className="size-5" />
          </button>
          <button type="button" onClick={() => setMenu(true)} aria-label="Ещё" className="flex size-11 items-center justify-center rounded-md text-primary active:scale-95">
            <MoreHorizontal className="size-5" />
          </button>
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <ViewState loading={{ kind: 'cards', rows: 3 }} empty={{ icon: MessageSquareText, title: 'Ответов пока нет', text: 'Станьте первым, кто ответит.' }}>
          <article className="px-6 pt-2">
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>{t.tag}</span>
              {t.status === 'review' ? <ReviewMark /> : solved != null ? <SolvedMark /> : null}
            </div>
            <h1 className="mt-2 text-[24px] leading-tight font-semibold tracking-tight">{t.title}</h1>
            <div className="mt-3 flex items-center gap-3">
              <Initials className="size-8 text-xs">{t.av}</Initials>
              <span className="text-[15px] font-medium">{t.author}</span>
              <span className="ml-auto text-sm text-muted-foreground">
                <TimeText>{t.last}</TimeText>
              </span>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed">{t.text}</p>
            {photo && (
              <button type="button" onClick={() => setViewer(true)} aria-label="Открыть фото" className="mt-3 block w-full overflow-hidden rounded-lg border border-border transition-opacity active:opacity-80">
                <PhotoBlock className="rounded-none" />
              </button>
            )}
          </article>

          {t.status === 'review' ? (
            <p className="mx-6 mt-6 rounded-lg border border-border px-4 py-3 text-[15px] text-muted-foreground">Тема на проверке. Другие моряки увидят её и смогут ответить после модерации.</p>
          ) : (
            <>
              <h2 className="mt-7 mb-2 px-6 text-base font-semibold">
                <span className="font-mono">{replies.length}</span> {plural(replies.length, 'ответ', 'ответа', 'ответов')}
              </h2>
              {replies.length === 0 ? (
                <p className="mx-6 text-[15px] text-muted-foreground">Пока никто не ответил. Напишите первым.</p>
              ) : (
                <ul className="mx-4 overflow-hidden rounded-xl border border-border bg-surface">
                  {replies.map((r, i) => {
                    const on = !!g.helpful[hKey(t.id, i)]
                    const isSol = solved === i
                    return (
                      <li key={r.name + r.time + i} className={cn('flex gap-3 border-t border-border px-4 py-4 transition-colors duration-200 first:border-t-0 animate-in fade-in-0 duration-200 motion-reduce:animate-none', isSol && 'bg-success/10')}>
                        <Initials className="size-9 text-xs">{r.av}</Initials>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="text-[15px] font-medium">{r.name}</span>
                            <span className="shrink-0 text-sm text-muted-foreground">
                              <TimeText>{r.time}</TimeText>
                            </span>
                          </span>
                          <span className="text-sm text-muted-foreground">{r.rank}</span>
                          {isSol && (
                            <span className="inline-flex items-center gap-1 self-start text-sm font-medium text-success">
                              <Check className="size-4" strokeWidth={2.5} /> Решение
                            </span>
                          )}
                          <p className="mt-1 text-[15px] leading-relaxed">{r.text}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              aria-pressed={on}
                              onClick={() => toggleHelpful(i)}
                              className={cn('flex h-9 items-center gap-2 rounded-full border pr-1.5 pl-3 text-sm font-medium transition-colors duration-200 active:scale-95', on ? 'border-primary bg-muted text-primary' : 'border-border text-foreground')}
                            >
                              <ThumbsUp className="size-4" /> Полезно
                              <span className={cn('inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 font-mono text-xs', on ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>{likesOf(t.id, i, r.likes)}</span>
                            </button>
                            {t.mine && (
                              <button type="button" onClick={() => toggleSolved(i)} className={cn('flex h-9 items-center gap-1.5 rounded-full px-2 text-sm font-medium whitespace-nowrap transition-colors duration-200', isSol ? 'text-success' : 'text-muted-foreground')}>
                                <Check className="size-4" /> {isSol ? 'Снять' : 'Это решение'}
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          )}
          <div ref={endRef} />
        </ViewState>
      </div>

      {t.status !== 'review' && (
        <div className="flex shrink-0 items-center gap-2 border-t border-border bg-background px-4 pt-3 pb-4">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ответить"
            aria-label="Ответить"
            className="h-11 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            aria-label="Отправить"
            onClick={send}
            disabled={!draft.trim()}
            className={cn('flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-200 active:scale-95', draft.trim() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
          >
            <Send className="size-5" />
          </button>
        </div>
      )}

      <ShareSheet open={share} onClose={() => setShare(false)} title="Поделиться темой" description={t.title} />
      <SourceSheet
        open={menu}
        onClose={() => setMenu(false)}
        title="Тема"
        items={[
          ...(t.mine
            ? [
                {
                  icon: Trash2,
                  title: 'Удалить тему',
                  sub: 'Тема и ответы пропадут',
                  onClick: () => {
                    setMenu(false)
                    setConfirm(true)
                  },
                },
              ]
            : [
                {
                  icon: Flag,
                  title: 'Пожаловаться',
                  sub: 'Спам, оскорбления, неверные сведения',
                  onClick: () => {
                    setMenu(false)
                    showToast('Жалоба отправлена — модератор посмотрит')
                  },
                },
              ]),
        ]}
      />
      <BottomSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Удалить тему?"
        description="Её не увидят другие моряки, ответы тоже пропадут."
        footer={
          <>
            <Button size="lg" variant="destructive" onClick={remove}>
              Удалить
            </Button>
            <Button size="lg" variant="outline" onClick={() => setConfirm(false)}>
              Оставить
            </Button>
          </>
        }
      >
        <p className="text-[15px] text-muted-foreground">{t.title}</p>
      </BottomSheet>
      <MediaViewer open={viewer} onClose={() => setViewer(false)} title={t.title} caption={photo} onShare={() => setShare(true)}>
        <PhotoBlock big className="bg-white/10 from-white/15 via-white/5 to-white/10 text-white/60" />
      </MediaViewer>
    </div>
  )
}
