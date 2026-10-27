import { useState } from 'react'
import { ImageIcon, Search, X } from 'lucide-react'
import { Wordmark } from '@/components/app/chrome'
import { TabBar, type Tab } from '@/components/app/tab-bar'
import { POSTS, type Post } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { FeedDrawer } from './_feed-drawer'
import { AuthorSheet, FeedItem, MyPostItem } from './_feed-item'
import { Avatar, hashParam, useMe, useMyPosts } from './_feed-parts'

// Стрічка моряка (C: feedScreen(false)) — спільна для p01 і p04 (p04 — та сама стрічка з відкритим меню).
// Сильний елемент — закріплена новина Seafolio; решта — тихий білий список з роздільниками.
// Правка п. 16: закладка на кожній публікації, пошук за словами (лупа нагорі), короткий профіль автора.

const TAB_TO: Record<Tab, string> = { feed: 'p01', vac: 'p05', docs: 'p02', profile: 'q09' }
const FILTERS = [
  ['all', 'Все'],
  ['people', 'Моряки'],
  ['news', 'Новости'],
] as const

export function FeedScreen({ go, drawer: drawerAtStart = false }: { go: (id: string) => void; drawer?: boolean }) {
  const { state, set, setBag } = useProto()
  const me = useMe()
  const { mine } = useMyPosts()
  const [drawer, setDrawer] = useState(drawerAtStart || hashParam('drawer') === '1')
  const [searching, setSearching] = useState(hashParam('s') === 'search')
  const [query, setQuery] = useState(hashParam('q') ?? '')
  const [author, setAuthor] = useState<string | null>(hashParam('author'))

  const f = state.feedFilter
  const words = searching ? query.toLowerCase().split(/\s+/).filter(Boolean) : []
  const byFilter = (p: Post) => f === 'all' || (f === 'people' ? p.kind === 'user' : p.kind === 'news')
  const matches = (p: Post) => {
    if (p.kind === 'ad') return !searching
    if (!words.length) return true
    const hay = (p.kind === 'news' ? p.title + ' ' + p.text : p.text).toLowerCase()
    return words.every((w) => hay.includes(w))
  }
  const list = POSTS.filter((p) => byFilter(p) && matches(p))
  const pinned = !searching ? list.find((p) => p.kind === 'news' && p.pin) : undefined
  const rest = list.filter((p) => p !== pinned)
  const showMine = !searching && f !== 'news' && mine.length > 0

  const openPost = (id: string) => {
    setBag('feed.post', id)
    go('p07')
  }
  const closeDrawer = () => (drawerAtStart ? go('p01') : setDrawer(false))
  const closeSearch = () => {
    setSearching(false)
    setQuery('')
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {searching ? (
          <div className="flex items-center gap-3 px-4 pt-2">
            <label className="flex h-11 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 focus-within:border-primary">
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Слова из публикаций и новостей"
                aria-label="Поиск по ленте"
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button type="button" aria-label="Очистить" onClick={() => setQuery('')} className="text-muted-foreground">
                  <X className="size-4" />
                </button>
              )}
            </label>
            <button type="button" onClick={closeSearch} className="text-[15px] font-medium text-primary">
              Отмена
            </button>
          </div>
        ) : (
          <div className="px-6 pt-2">
            <div className="flex h-10 items-center gap-2">
              <Wordmark className="flex-1" />
              <button type="button" aria-label="Поиск по ленте" onClick={() => setSearching(true)} className="flex size-10 items-center justify-center rounded-full bg-card text-muted-foreground">
                <Search className="size-5" />
              </button>
              <button type="button" aria-label="Меню" onClick={() => setDrawer(true)} className="flex size-10 items-center justify-center rounded-full bg-card text-sm font-semibold text-primary">
                {me.initials}
              </button>
            </div>
            <h1 className="mt-3 text-[32px] leading-tight font-semibold tracking-tight">Лента</h1>
          </div>
        )}

        <div className={cn('flex flex-col gap-4 px-6', searching ? 'pt-3' : 'pt-4')}>
          {!searching && (
            <button
              type="button"
              onClick={() => go('p06')}
              className="flex h-12 items-center gap-3 rounded-md border border-border bg-surface px-3 text-left text-[15px] text-muted-foreground"
            >
              <Avatar size="sm">{me.initials}</Avatar>
              <span className="min-w-0 flex-1 truncate">Поделитесь опытом или задайте вопрос</span>
              <ImageIcon className="size-5 text-primary" />
            </button>
          )}
          <div className="flex gap-2" role="group" aria-label="Что показывать">
            {FILTERS.map(([id, label]) => (
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
          {searching && words.length > 0 && rest.length > 0 && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Найдено: <span className="font-mono">{rest.length}</span>
            </p>
          )}
        </div>

        <div className={cn('flex flex-col gap-3 pb-4', searching && words.length ? 'mt-2' : 'mt-4')}>
          {pinned && <FeedItem p={pinned} onOpen={openPost} onAuthor={setAuthor} />}
          {(rest.length > 0 || showMine) && (
            <div className="mx-4 overflow-hidden rounded-xl border border-border bg-surface">
              {showMine && mine.map((p) => <MyPostItem key={p.id} p={p} />)}
              {rest.map((p) => (
                <FeedItem key={p.id} p={p} onOpen={openPost} onAuthor={setAuthor} words={words} flat={searching} />
              ))}
            </div>
          )}
          {rest.length === 0 && !showMine && searching && (
            <div className="px-6 pt-6">
              <p className="text-lg font-semibold">Ничего не нашли</p>
              <p className="mt-1 text-[15px] text-muted-foreground">
                {f === 'all' ? 'Попробуйте другое слово.' : 'Попробуйте другое слово или выберите «Все».'}
              </p>
            </div>
          )}
        </div>
      </div>
      <TabBar active="feed" onTab={(t) => (t === 'feed' ? (searching ? closeSearch() : undefined) : go(TAB_TO[t]))} />
      <AuthorSheet
        name={author}
        onClose={() => setAuthor(null)}
        onOpenPost={(id) => {
          setAuthor(null)
          openPost(id)
        }}
      />
      <FeedDrawer open={drawer} onClose={closeDrawer} go={go} />
    </div>
  )
}
