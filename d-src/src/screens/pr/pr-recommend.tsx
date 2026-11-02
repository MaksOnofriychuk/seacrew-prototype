import { Compass } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { TabBar } from '@/components/app/tab-bar'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { FJ_JOBS } from '@/lib/data-feed-jobs'
import { RECOMMENDED } from '@/lib/data-premium'
import type { ScreenProps } from '../types'
import { Dateish } from '../g02-guest-jobs'
import { SaveButton, TabHead, useApp, useSavedJobs } from '../p/_app-parts'
import { Segmented } from '../m/_parts'

// pr-recommend — «Рекомендации»: окрема вкладка на сторінці вакансій (відповідь 105).
// Шапка — як у p05; перемикач «Все вакансии» веде на p05. Під кожною вакансією — чому ми її радимо
// (посада, тип судна, зарплата, перегляди); відповідність вимогам не показуємо (відповідь 99).
// Порожньо — мало даних у профілі: ведемо заповнити досвід роботи.

export function PrRecommend({ go }: ScreenProps) {
  const { set, setBag } = useApp()
  const { isSaved, toggle } = useSavedJobs()
  const open = (k: number) => {
    set({ job: k })
    setBag('job.back', 'pr-recommend')
    go('p08')
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <TabHead title="Вакансии" onMenu={() => go('p04')} go={go} />
        <div className="px-6 pt-4">
          <Segmented
            label="Вакансии"
            value="rec"
            onChange={(v) => v === 'all' && go('p05')}
            items={[
              { id: 'all', label: 'Все вакансии' },
              { id: 'rec', label: 'Рекомендации', n: RECOMMENDED.length },
            ]}
          />
          <p className="mt-4 text-sm text-muted-foreground">Подобраны по вашему профилю и тому, что вы смотрели. Обновляются каждый день.</p>
        </div>

        <ViewState
          loading={{ kind: 'list', rows: 4 }}
          empty={{
            icon: Compass,
            title: 'Пока нечего рекомендовать',
            text: 'Добавьте опыт работы — подберём вакансии под вашу должность и тип судна.',
            action: (
              <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => go('p22')}>
                Добавить опыт
              </Button>
            ),
          }}
        >
          <ul className="mx-4 mt-3 mb-4 overflow-hidden rounded-xl border border-border bg-surface">
            {RECOMMENDED.map(({ k, why }) => {
              const j = FJ_JOBS[k]
              return (
                <li key={k} className="flex gap-3 border-t border-border py-4 pr-3 pl-5 first:border-t-0">
                  <button type="button" onClick={() => open(k)} className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                    <span className="text-sm text-muted-foreground">{why}</span>
                    <span className="text-[17px] font-semibold">{j.t}</span>
                    <span className="text-[15px] font-semibold text-primary"><MonoNums text={j.sal} /></span>
                    <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                      <span>{j.ship}</span>
                      <span>
                        контракт <Dateish v={j.dur} />
                      </span>
                      <span>
                        посадка <Dateish v={j.board} />
                      </span>
                    </span>
                  </button>
                  <SaveButton on={isSaved(k)} onClick={() => toggle(k)} className="self-start" />
                </li>
              )
            })}
          </ul>
        </ViewState>
      </div>
      <TabBar active="vac" go={go} />
    </div>
  )
}
