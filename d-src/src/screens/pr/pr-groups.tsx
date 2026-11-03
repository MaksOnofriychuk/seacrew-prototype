import { useEffect, useState } from 'react'
import { ImageIcon, MessageSquareText, Plus, Search, X } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { EmptyState, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { TOPIC_SECTIONS, TOPIC_PHOTOS } from '@/lib/data-premium'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { Segmented } from '../m/_parts'
import { useBack } from './_parts'
import { Count, ReviewMark, SolvedMark, TimeText, useGroups } from './pr-group-state'

// pr-groups — «Обсуждения» (ответ 113: «в будущем возможно, в далёком»; правка №43: рисуем раздел полностью).
// Список тем с поиском на месте, разделами и вкладками «Все темы / Мои темы». Позначка «скоро» у заголовка остаётся.

export function PrGroups({ go, initialTab }: ScreenProps & { initialTab?: 'all' | 'mine' }) {
  const { setBag, g, patch, all, repliesOf, solvedOf } = useGroups()
  const back = useBack('pr-groups', 'p04')
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const tab = g.tab
  useEffect(() => {
    if (initialTab && g.tab !== initialTab) patch({ tab: initialTab })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)

  const list = all.filter((t) => {
    if (tab === 'mine' && !t.mine) return false
    if (g.section !== 'all' && t.tag !== g.section) return false
    const hay = (t.title + ' ' + t.text + ' ' + t.tag).toLowerCase()
    return words.every((w) => hay.includes(w))
  })
  const mineCount = all.filter((t) => t.mine).length
  const closeSearch = () => {
    setSearching(false)
    setQuery('')
  }
  const open = (id: string) => {
    setBag('pr.topic', id)
    setBag('back.pr-group', 'pr-groups')
    go('pr-group')
  }

  return (
    <div className="relative flex h-full flex-col">
      {searching ? (
        <div className="shrink-0 px-6 pt-2">
          <div className="flex h-12 items-center gap-3 animate-in fade-in-0 slide-in-from-right-4 duration-200 motion-reduce:animate-none">
            <label className="flex h-10 flex-1 items-center gap-2 rounded-md border border-primary bg-surface px-3">
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по темам" aria-label="Поиск по темам" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
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
        </div>
      ) : (
        <NavBar
          onBack={() => go(back)}
          right={
            <button type="button" aria-label="Поиск по темам" onClick={() => setSearching(true)} className="flex size-11 items-center justify-center rounded-md text-primary active:scale-95">
              <Search className="size-5" />
            </button>
          }
        />
      )}
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <div className="px-6 pt-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] leading-tight font-semibold tracking-tight">Обсуждения</h1>
            <span className="rounded-full border border-border px-2.5 py-0.5 text-sm font-medium text-muted-foreground">скоро</span>
          </div>
          <p className="mt-2 text-[15px] text-muted-foreground">Вопросы о портах, документах и работе — отвечают другие моряки.</p>
        </div>

        <div className="mt-4 px-6">
          <Segmented
            label="Темы"
            value={tab}
            onChange={(v) => patch({ tab: v })}
            items={[
              { id: 'all', label: 'Все темы' },
              { id: 'mine', label: 'Мои темы', n: mineCount },
            ]}
          />
        </div>
        <div role="group" aria-label="Разделы" className="mt-3 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none]">
          {[{ id: 'all', label: 'Все' }, ...TOPIC_SECTIONS.map((s) => ({ id: s as string, label: s as string }))].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={g.section === c.id}
              onClick={() => patch({ section: c.id })}
              className={cn(
                'h-9 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200',
                g.section === c.id ? 'border-primary bg-muted text-primary' : 'border-border bg-surface text-foreground',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <ViewState loading={{ kind: 'list', rows: 4 }} empty={{ icon: MessageSquareText, title: 'Тем пока нет', text: 'Здесь появятся вопросы моряков и ответы на них.' }}>
          {list.length === 0 ? (
            <EmptyState
              icon={words.length ? Search : MessageSquareText}
              title={words.length ? 'Ничего не нашли' : tab === 'mine' ? 'У вас пока нет тем' : 'В этом разделе тем нет'}
              text={words.length ? 'Попробуйте другое слово или выберите «Все».' : tab === 'mine' ? 'Задайте вопрос — моряки ответят.' : 'Задайте вопрос первым.'}
              action={
                !words.length && (
                  <Button variant="outline" className="text-primary" onClick={() => go('pr-group-new')}>
                    <Plus /> Новая тема
                  </Button>
                )
              }
            />
          ) : (
            <ul key={tab + g.section} className="mx-4 mt-3 overflow-hidden rounded-xl border border-border bg-surface animate-in fade-in-0 duration-200 motion-reduce:animate-none">
              {list.map((t) => {
                const n = repliesOf(t.id).length
                return (
                  <li key={t.id} className="border-t border-border first:border-t-0">
                    <button type="button" onClick={() => open(t.id)} className="flex w-full flex-col gap-1.5 px-5 py-4 text-left transition-colors active:bg-muted">
                      <span className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          {t.tag}
                          {(t.photo || TOPIC_PHOTOS[t.id]) && <ImageIcon className="size-3.5" aria-label="Есть фото" />}
                        </span>
                        {t.status === 'review' ? <ReviewMark /> : solvedOf(t.id) != null ? <SolvedMark /> : null}
                      </span>
                      <span className="text-[17px] leading-snug font-semibold">{t.title}</span>
                      <span className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="min-w-0 truncate">{t.author}</span>
                        <Count n={n} />
                        <span className="ml-auto shrink-0">
                          <TimeText>{t.last}</TimeText>
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </ViewState>
      </div>
      <Footer className="border-t border-border bg-background">
        <Button size="lg" onClick={() => go('pr-group-new')}>
          <Plus /> Новая тема
        </Button>
      </Footer>
    </div>
  )
}

// «Мои темы» — тот же экран, открытый сразу на второй вкладке.
export function PrGroupsMine(p: ScreenProps) {
  return <PrGroups {...p} initialTab="mine" />
}
