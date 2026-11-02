import { useState } from 'react'
import { BadgeCheck, Bookmark, Briefcase, Search, SlidersHorizontal, X } from 'lucide-react'
import { AppHead } from '@/components/app/app-head'
import { MonoNums } from '@/components/app/mono-nums'
import { useGate } from '@/components/app/gate-sheet'
import { ViewState } from '@/components/app/states'
import { TabBar } from '@/components/app/tab-bar'
import { Badge } from '@/components/ui/badge'
import type { Job } from '@/lib/data'
import { FJ_JOBS, isClosed } from '@/lib/data-feed-jobs'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from './registry'

// g02 — вакансії гостя (правка №9): ті самі вакансії, що бачить моряк, без плашки «Вы смотрите как гость»
// і без фільтрів «з профілю». Пошук за словами працює; фільтри, закладка й будь-яка інша дія → вікно гостя.
// g03 — те саме з відкритим вікном гостя (показ спільного вікна в реєстрі). Без порівняння з профілем.
export function G02GuestJobs({ go }: ScreenProps) {
  return <GuestJobs go={go} />
}

export function G03GuestGate({ go }: ScreenProps) {
  return <GuestJobs go={go} initialGate="apply" />
}

function GuestJobs({ go, initialGate = null }: ScreenProps & { initialGate?: string | null }) {
  const { set } = useProto()
  const { gate, sheet } = useGate(go, initialGate)
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  // Ті самі вакансії, що в p05 (№9), без закритих — гість їх не відкриє.
  const list = FJ_JOBS.map((j, k) => ({ j, k })).filter(({ k }) => !isClosed(k)).filter(({ j }) => !needle || [j.t, j.ship, j.co].some((s) => s.toLowerCase().includes(needle)))

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AppHead title="Вакансии" onAvatar={() => gate('profile')} onBell={() => gate('notifications')} notifications={0} />
        <div className="flex flex-col gap-4 px-6 pt-4">
          <div className="flex gap-2">
            <label className="flex h-12 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-muted-foreground focus-within:border-primary">
              <Search className="size-5" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Поиск вакансий"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="Должность, судно, компания"
              />
              {q && (
                <button type="button" aria-label="Очистить" onClick={() => setQ('')} className="text-muted-foreground">
                  <X className="size-4" />
                </button>
              )}
            </label>
            <button type="button" aria-label="Фильтры" onClick={() => gate('filters')} className="flex size-12 items-center justify-center rounded-md border border-border bg-surface text-foreground">
              <SlidersHorizontal className="size-5" />
            </button>
          </div>
        </div>
        <ViewState
          empty={{ icon: Briefcase, title: 'Вакансий пока нет', text: 'Новые вакансии от проверенных агентств появятся здесь.' }}
          loading={{ kind: 'list', rows: 4 }}
        >
          {list.length > 0 ? (
            <ul className="mx-4 mt-4 mb-4 overflow-hidden rounded-xl border border-border bg-surface">
              {list.map(({ j, k }) => (
                <JobRow
                  key={k}
                  j={j}
                  onOpen={() => {
                    set({ job: k })
                    go('g04')
                  }}
                  onSave={() => gate('save')}
                />
              ))}
            </ul>
          ) : (
            <div className="px-6 pt-6">
              <p className="text-lg font-semibold">Ничего не нашли</p>
              <p className="mt-1 text-[15px] text-muted-foreground">Попробуйте другую должность или тип судна.</p>
            </div>
          )}
        </ViewState>
      </div>
      <TabBar active="vac" counts={{}} onTab={(t) => (t === 'feed' ? go('g01') : t === 'vac' ? undefined : gate(t))} />
      {sheet}
    </div>
  )
}

// Мітки з C: «NEW» показуємо звичайними літерами — без капсу.
export function JobTags({ tags }: { tags: string[] }) {
  return (
    <>
      {tags.map((t) =>
        t === 'Срочно' ? (
          <Badge key={t} variant="warning">
            Срочно
          </Badge>
        ) : (
          <Badge key={t} variant="outline" className="border-primary text-primary">
            Новая
          </Badge>
        ),
      )}
    </>
  )
}

function JobRow({ j, onOpen, onSave }: { j: Job; onOpen: () => void; onSave: () => void }) {
  return (
    <li className="flex gap-3 border-t border-border px-5 py-4 first:border-t-0">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 flex-col gap-1.5 text-left">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[17px] font-semibold">{j.t}</span>
          <JobTags tags={j.tags} />
        </span>
        <span className="text-[15px] font-semibold text-primary">{j.sal}</span>
        <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
          <span>{j.ship}</span>
          <span>
            посадка <Dateish v={j.board} />
          </span>
          <span>{j.dur}</span>
        </span>
        <span className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1">
            <span className="truncate">{j.co}</span>
            <BadgeCheck className="size-4 shrink-0 text-success" aria-label="Агентство проверено" />
          </span>
          <span className="shrink-0 whitespace-nowrap">{j.ago}</span>
        </span>
      </button>
      <button type="button" aria-label="Сохранить" onClick={onSave} className="flex size-10 shrink-0 items-center justify-center self-start rounded-md text-muted-foreground">
        <Bookmark className="size-5" />
      </button>
    </li>
  )
}

// Дати й числа — Plex Mono; слова («как можно скорее», «мес») — звичайним шрифтом (у Plex Mono немає кирилиці).
export function Dateish({ v }: { v: string }) {
  return <MonoNums text={v} />
}
