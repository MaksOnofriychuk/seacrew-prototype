import { useState } from 'react'
import { ChevronRight, Zap } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { Status } from '@/components/app/status'
import { Button } from '@/components/ui/button'
import { JOBS } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { hashParam } from './_feed-parts'

// p03 — входящие (C: inboxScreen). Две вкладки: «Приглашения» — агентства зовут на вакансию
// или присылают анкету, главная кнопка «Заполнить из профиля»; «Мои отклики» — статусы.
// Сильный элемент — новое приглашение с кнопкой; остальное — тихие строки со статусом словом.

type TabId = 'inv' | 'app'

// C: [номер вакансии, статус].
const APPLIED: [number, string][] = [
  [1, 'просмотрен'],
  [3, 'отправлен'],
]

export function P03Inbox({ go }: ScreenProps) {
  const { set, bag, setBag, showToast } = useProto()
  const [linked] = useState<TabId | null>(() => (hashParam('tab') === 'app' ? 'app' : null))
  const tab = bag<TabId>('inbox.tab', linked ?? 'inv')
  const filled = bag<boolean>('inbox.filled', false)

  const openJob = (k: number) => {
    set({ job: k })
    go('p08')
  }

  return (
    <div className="flex h-full flex-col">
      <NavBar title="Входящие" onBack={() => go('q09')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-6">
        <div role="tablist" aria-label="Входящие" className="mx-2 grid grid-cols-2 gap-1 rounded-md border border-border bg-surface p-1">
          {(
            [
              ['inv', 'Приглашения', 1],
              ['app', 'Мои отклики', APPLIED.length],
            ] as const
          ).map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setBag('inbox.tab', id)}
              className={cn(
                'flex h-9 items-center justify-center gap-1.5 rounded-[9px] border text-[15px] font-medium transition-colors',
                tab === id ? 'border-primary bg-muted text-primary' : 'border-transparent text-foreground',
              )}
            >
              {label}
              <span className="font-mono text-sm text-muted-foreground">{n}</span>
            </button>
          ))}
        </div>

        {tab === 'inv' ? (
          <ul className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
            <li className="flex flex-col px-4 py-4">
              <div className="flex items-start gap-3">
                <Logo>BW</Logo>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] font-semibold">BlueWave Crewing</span>
                  <span className="text-sm text-muted-foreground">3rd Engineer, Chemical Tanker</span>
                </span>
                <span className="flex flex-col items-end gap-0.5 text-sm">
                  <span className="text-muted-foreground">15 мин</span>
                  {!filled && <span className="font-medium text-primary">новое</span>}
                </span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed">
                Здравствуйте! Ваш профиль подходит под нашу вакансию. Заполните, пожалуйста, анкету компании.
              </p>
              {filled ? (
                <Status kind="ok" className="mt-3">
                  анкета заполнена из профиля, проверьте и отправьте
                </Status>
              ) : (
                <Button
                  className="mt-4 h-11 text-[15px]"
                  onClick={() => {
                    setBag('inbox.filled', true)
                    showToast('Анкета заполнена из профиля — проверьте и отправьте (пример)')
                  }}
                >
                  <Zap /> Заполнить из профиля
                </Button>
              )}
              <Button variant="ghost" className="mt-1 h-10 text-[15px] text-primary" onClick={() => openJob(0)}>
                Открыть вакансию
              </Button>
            </li>
            <li className="flex items-center gap-3 border-t border-border px-4 py-3.5">
              <Logo>MC</Logo>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-semibold">Meridian Crew</span>
                <span className="text-sm text-muted-foreground">Анкета, отправлена вчера</span>
              </span>
              <Status kind="ok">отправлено</Status>
            </li>
          </ul>
        ) : (
          <ul className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
            {APPLIED.map(([k, st]) => {
              const j = JOBS[k]
              return (
                <li key={k} className="border-t border-border first:border-t-0">
                  <button type="button" onClick={() => openJob(k)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                    <Logo>{j.lg}</Logo>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-[15px] font-semibold">{j.t}</span>
                        <Status kind="ok">{st}</Status>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {j.ship}, {j.co}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function Logo({ children }: { children: string }) {
  return <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold">{children}</span>
}
