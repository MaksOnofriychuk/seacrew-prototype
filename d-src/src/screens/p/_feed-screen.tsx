import { useState } from 'react'
import { Newspaper, Plus, Search, X } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { TAB_SCREENS as TAB_TO } from '@/components/app/tab-bar'
import { TabBar } from '@/components/app/tab-bar'
import { MainTopBar, TopBarButton } from '@/components/app/top-bar'
import { MOBILE_ROUTES } from '@/lib/mobile-routes'
import { POSTS, type Post } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { FeedDrawer } from './_feed-drawer'
import { FeedItem, MyPostItem } from './_feed-item'
import { Avatar, hashParam, useMe, useMyPosts } from './_feed-parts'
import { OfflineBanner, useOffline } from './_app-parts'
import { useAppCounts } from '../m/_parts'

// Стрічка моряка (C: feedScreen(false)) — спільна для p01 і p04 (p04 — та сама стрічка з відкритим меню).
// Сильний елемент — закріплена новина Seafolio; решта — тихий білий список з роздільниками.
// Правка п. 16: закладка на кожній публікації, пошук за словами (лупа нагорі); тап на автора — короткий профіль p16.
// Правка №32: поле нової публікації — «Расскажите что-то интересное».

const FILTERS = [
  ['all', 'Все'],
  ['people', 'Моряки'],
  ['news', 'Новости'],
] as const

export function FeedScreen({ go, drawer: drawerAtStart = false }: { go: (id: string) => void; drawer?: boolean }) {
  const { state, set, setBag } = useProto()
  const me = useMe()
  const { mine } = useMyPosts()
  const counts = useAppCounts()
  const offline = useOffline()
  const [drawer, setDrawer] = useState(drawerAtStart || hashParam('drawer') === '1')
  const [searching, setSearching] = useState(hashParam('s') === 'search')
  const [query, setQuery] = useState(hashParam('q') ?? '')

  const f = state.feedFilter
  const words = searching ? query.toLowerCase().split(/\s+/).filter(Boolean) : []
  const byFilter = (p: Post) => f === 'all' || (f === 'people' ? p.kind === 'user' : p.kind === 'news')
  const matches = (p: Post) => {
    if (p.kind === 'ad') return !words.length
    if (!words.length) return true
    const hay = (p.kind === 'news' ? p.title + ' ' + p.text : p.text).toLowerCase()
    return words.every((w) => hay.includes(w))
  }
  const list = POSTS.filter((p) => byFilter(p) && matches(p))
  const pinned = !words.length ? list.find((p) => p.kind === 'news' && p.pin) : undefined
  const rest = list.filter((p) => p !== pinned)
  const showMine = !words.length && f !== 'news' && mine.length > 0

  const openPost = (id: string) => {
    setBag('feed.post', id)
    go('p07')
  }
  // Короткий профіль автора — окремий екран p16; «Назад» з нього повертає сюди.
  const openAuthor = (name: string) => {
    setBag('feed.author', name)
    setBag('feed.author.back', 'p01')
    go('p16')
  }
  const closeDrawer = () => (drawerAtStart ? go('p01') : setDrawer(false))
  const closeSearch = () => {
    setSearching(false)
    setQuery('')
  }

  // Без мережі (стан «Ошибка» / сценарій «Нет интернета») — збережена стрічка і плашка вгорі (відповідь 21).
  const posts = (
  <div className={cn('flex flex-col gap-3 pb-4', words.length ? 'mt-2' : 'mt-4')}>
    {pinned && <FeedItem p={pinned} onOpen={openPost} onAuthor={openAuthor} />}
    {(rest.length > 0 || showMine) && (
      <div className="mx-4 overflow-hidden rounded-xl border border-border bg-surface">
        {showMine && mine.map((p) => <MyPostItem key={p.id} p={p} />)}
        {rest.map((p) => (
          <FeedItem key={p.id} p={p} onOpen={openPost} onAuthor={openAuthor} words={words} />
        ))}
      </div>
    )}
    {rest.length === 0 && !showMine && words.length > 0 && (
      <div className="px-6 pt-6">
        <p className="text-lg font-semibold">Ничего не нашли</p>
        <p className="mt-1 text-[15px] text-muted-foreground">
          {f === 'all' ? 'Попробуйте другое слово.' : 'Попробуйте другое слово или выберите «Все».'}
        </p>
      </div>
    )}
  </div>
  )

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Пошук — на цьому ж екрані (перевірка прототипу 03.11, №24): поле розгортається у верхній панелі,
            заголовок і стрічка лишаються, стрічка фільтрується під полем; «Отмена» повертає панель. */}
        <div className="px-6 pt-2">
          {searching ? (
            <div className="flex h-10 items-center gap-3 animate-in fade-in-0 slide-in-from-right-4 duration-200 motion-reduce:animate-none">
              <label className="flex h-10 flex-1 items-center gap-2 rounded-md border border-primary bg-surface px-3">
                <Search className="size-5 shrink-0 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по ленте"
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
            <MainTopBar
              onBell={() => {
                setBag('back.p10', 'p01')
                go(MOBILE_ROUTES.notifications)
              }}
              onAvatar={() => setDrawer(true)}
              avatar={me.initials}
              notifications={counts.notifications}
              extra={
                <TopBarButton label="Поиск по ленте" onClick={() => setSearching(true)}>
                  <Search className="size-5" />
                </TopBarButton>
              }
            />
          )}
          <h1 className="mt-3 text-[32px] leading-tight font-semibold tracking-tight">Лента</h1>
        </div>

        <div className="flex flex-col gap-4 px-6 pt-4">
          {offline && <OfflineBanner />}
          {!searching && (
            // Не поле вводу, а дія (перевірка прототипу 03.11, №25): картка-кнопка з «+», веде на екран нової публікації.
            <button
              type="button"
              onClick={() => go('p06')}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-transform active:scale-[0.99]"
            >
              <Avatar size="sm">{me.initials}</Avatar>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-medium">Новая публикация</span>
                <span className="truncate text-sm text-muted-foreground">Что нового на борту?</span>
              </span>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plus className="size-5" strokeWidth={2.25} />
              </span>
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
          {words.length > 0 && rest.length > 0 && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Найдено: <span className="font-mono">{rest.length}</span>
            </p>
          )}
        </div>

        <ViewState
          loading={{ kind: 'cards', rows: 3, className: 'px-4' }}
          error={posts}
          empty={{ icon: Newspaper, title: 'В ленте пока тихо', text: 'Напишите первым — о контракте, компании или порте.',
            action: (
              <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => go('p06')}>
                Написать публикацию
              </Button>
            ),
          }}
        >
        {posts}
        </ViewState>
      </div>
      <TabBar active="feed" counts={{ msg: counts.messages }} onTab={(t) => (t === 'feed' ? (searching ? closeSearch() : undefined) : go(TAB_TO[t]))} />
      <FeedDrawer open={drawer} onClose={closeDrawer} go={go} />
    </div>
  )
}
