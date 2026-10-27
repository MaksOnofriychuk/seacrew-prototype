import { BadgeCheck, Bookmark, Search, SlidersHorizontal, X } from 'lucide-react'
import { AppHead, GuestNote } from '@/components/app/app-head'
import { useGate } from '@/components/app/gate-sheet'
import { TabBar } from '@/components/app/tab-bar'
import { Badge } from '@/components/ui/badge'
import { JOBS, type Job } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from './registry'

// g02 — вакансії гостя; g03 — те саме з відкритим вікном «Зарегистрируйтесь, чтобы откликнуться».
// Без порівняння з профілем. Фільтри з'являться разом із p13.
export function G02GuestJobs({ go }: ScreenProps) {
  return <GuestJobs go={go} />
}

export function G03GuestGate({ go }: ScreenProps) {
  return <GuestJobs go={go} initialGate="apply" />
}

function GuestJobs({ go, initialGate = null }: ScreenProps & { initialGate?: string | null }) {
  const { set } = useProto()
  const { gate, sheet } = useGate(go, initialGate)

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AppHead title="Вакансии" onAvatar={() => gate('profile')} />
        <div className="flex flex-col gap-4 px-6 pt-4">
          <GuestNote>
            <b className="font-medium text-foreground">Вы смотрите как гость.</b> Это примеры вакансий.
          </GuestNote>
          <div className="flex gap-2">
            <label className="flex h-12 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-muted-foreground">
              <Search className="size-5" />
              <input className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground" placeholder="Должность, судно, компания" />
            </label>
            <button type="button" aria-label="Фильтры" className="flex size-12 items-center justify-center rounded-md border border-border bg-surface text-foreground">
              <SlidersHorizontal className="size-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {['3rd Engineer', 'Танкеры'].map((c) => (
              <span key={c} className="flex h-9 items-center gap-1.5 rounded-full bg-primary pr-3 pl-4 text-sm font-medium text-primary-foreground">
                {c} <X className="size-3.5" />
              </span>
            ))}
            <span className="flex h-9 items-center rounded-full border border-border bg-surface px-4 text-sm font-medium">Новые сначала</span>
          </div>
        </div>
        <ul className="mx-4 mt-4 mb-4 overflow-hidden rounded-xl bg-surface">
          {JOBS.map((j, k) => (
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
      </div>
      <TabBar active="vac" onTab={(t) => (t === 'feed' ? go('g01') : t === 'vac' ? undefined : gate(t))} />
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
          <span className="flex items-center gap-1">
            {j.co}
            <BadgeCheck className="size-4 text-success" aria-label="Агентство проверено" />
          </span>
          <span>{j.ago}</span>
        </span>
      </button>
      <button type="button" aria-label="Сохранить" onClick={onSave} className="flex size-10 shrink-0 items-center justify-center self-start rounded-md text-muted-foreground">
        <Bookmark className="size-5" />
      </button>
    </li>
  )
}

// Дати — Plex Mono; словесні значення («как можно скорее») — звичайним шрифтом.
export function Dateish({ v }: { v: string }) {
  return /\d/.test(v) ? <span className="font-mono">{v}</span> : <>{v}</>
}
