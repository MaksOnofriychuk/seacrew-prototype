import { useEffect } from 'react'
import { Bookmark, Newspaper } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { Button } from '@/components/ui/button'
import { POSTS, type Post } from '@/lib/data'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { useToast } from '../q/_parts'
import { useHashParams } from '../s/_core-parts'
import { Empty, JobRow, SaveButton, useApp } from './_app-parts'

// p09 — «Сохранённое» (правка п. 16): одне місце для збереженого, вкладки «Вакансии» і «Публикации».
// Вакансії — спільний ключ saved.jobs (індекси в JOBS), публікації — saved.posts (id з POSTS, пише стрічка).
// ?tab=posts відкриває вкладку публікацій, ?posts=demo кладе дві публікації — для знімків.
type TabId = 'jobs' | 'posts'
type UserOrNews = Exclude<Post, { kind: 'ad' }>

export function P09Saved({ go }: ScreenProps) {
  const { bag, setBag, set } = useApp()
  const params = useHashParams()
  const { toast, toastNode } = useToast()
  const tab = bag<TabId>('saved.ui.tab', params.get('tab') === 'posts' ? 'posts' : 'jobs')
  const jobs = bag<number[]>('saved.jobs', [0, 3])
  const postIds = bag<string[]>('saved.posts', [])
  const posts = postIds.map((id) => POSTS.find((p) => p.id === id)).filter((p): p is UserOrNews => !!p && p.kind !== 'ad')

  useEffect(() => {
    if (params.get('posts') === 'demo') setBag('saved.posts', ['u1', 'n2'])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unsaveJob = (k: number) => {
    setBag('saved.jobs', jobs.filter((x) => x !== k))
    toast('Убрано из сохранённых', () => setBag('saved.jobs', jobs))
  }
  const unsavePost = (id: string) => {
    setBag('saved.posts', postIds.filter((x) => x !== id))
    toast('Убрано из сохранённых', () => setBag('saved.posts', postIds))
  }

  const tabs: [TabId, string, number][] = [
    ['jobs', 'Вакансии', jobs.length],
    ['posts', 'Публикации', posts.length],
  ]

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Сохранённое" onBack={() => go('q09')} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <div role="tablist" aria-label="Что сохранено" className="mx-6 mt-1 flex gap-6 border-b border-border">
          {tabs.map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setBag('saved.ui.tab', id)}
              className={cn(
                '-mb-px flex items-center gap-1.5 border-b-2 pt-2 pb-3 text-[15px] font-medium transition-colors',
                tab === id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground',
              )}
            >
              {label}
              <span className={cn('font-mono text-sm', tab === id ? 'text-primary' : 'text-muted-foreground')}>{n}</span>
            </button>
          ))}
        </div>

        <div className="mx-4 mt-4">
          {tab === 'jobs' ? (
            jobs.length ? (
              <ul className="overflow-hidden rounded-xl border border-border bg-surface">
                {jobs.map((k) => (
                  <JobRow
                    key={k}
                    k={k}
                    saved
                    onSave={() => unsaveJob(k)}
                    onOpen={() => {
                      set({ job: k })
                      go('p08')
                    }}
                  />
                ))}
              </ul>
            ) : (
              <Empty
                icon={Bookmark}
                title="Нет сохранённых вакансий"
                text="Нажмите на закладку у вакансии, чтобы вернуться к ней позже."
                action={
                  <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => go('p05')}>
                    Смотреть вакансии
                  </Button>
                }
              />
            )
          ) : posts.length ? (
            <ul className="overflow-hidden rounded-xl border border-border bg-surface">
              {posts.map((p) => (
                <PostRow
                  key={p.id}
                  p={p}
                  onSave={() => unsavePost(p.id)}
                  onOpen={() => {
                    setBag('feed.post', p.id)
                    go('p07')
                  }}
                />
              ))}
            </ul>
          ) : (
            <Empty
              icon={Newspaper}
              title="Нет сохранённых публикаций"
              text="Нажмите на закладку у публикации или новости в ленте, чтобы вернуться к ней позже."
              action={
                <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => go('p01')}>
                  Открыть ленту
                </Button>
              }
            />
          )}
        </div>
      </div>
      {toastNode}
    </div>
  )
}

// Компактний рядок публікації: автор (або «Новости Seafolio»), час, два рядки тексту.
function PostRow({ p, onOpen, onSave }: { p: UserOrNews; onOpen: () => void; onSave: () => void }) {
  const user = p.kind === 'user'
  return (
    <li className="flex gap-3 border-t border-border py-4 pr-3 pl-5 first:border-t-0">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 gap-3 text-left">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-primary">
          {user ? p.av : <Newspaper className="size-5" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[15px] font-semibold">{user ? p.name : 'Новости Seafolio'}</span>
            <span className="shrink-0 text-sm text-muted-foreground">{p.time}</span>
          </span>
          {user ? (
            <span className="truncate text-sm text-muted-foreground">{p.role.replace(' · ', ', ')}</span>
          ) : (
            <span className="text-[15px] font-medium">{p.title}</span>
          )}
          <span className="line-clamp-2 text-[15px] leading-snug">{p.text}</span>
        </span>
      </button>
      <SaveButton on onClick={onSave} className="self-start" />
    </li>
  )
}
