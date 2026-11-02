import { BellRing, Crown, Trash2 } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { EmptyState, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { SEARCH_LIMIT, SEARCH_LIMIT_PREMIUM, type SavedSearch } from '@/lib/data-feed-jobs'
import type { ScreenProps } from '../registry'
import { useToast } from '../q/_parts'
import { plural, useApp } from './_app-parts'
import { useSearches } from './_app-jobs'
import { jobList, Segmented, searchDetails, searchName } from './_jobs-parts'

// p17 — «Сохранённые подборки» (відповіді 103–104): підборка = збережений набір фільтрів вакансій з автоназвою.
// Позначка нових вакансій; сповіщення — перемикач «Раз в день» / «При обновлении»; ліміт 3 (з премиумом — 20, лише текстом).
// Тап на підборку — p05 з її фільтрами. Зберігають підборку на p05 кнопкою «Сохранить поиск».
export function P17Searches({ go }: ScreenProps) {
  const { setBag } = useApp()
  const { searches, setSearches } = useSearches()
  const { toast, toastNode } = useToast()
  const full = searches.length >= SEARCH_LIMIT

  const patch = (id: string, p: Partial<SavedSearch>) => setSearches(searches.map((s) => (s.id === id ? { ...s, ...p } : s)))
  const open = (s: SavedSearch) => {
    setBag('jobs.filter', s.f)
    patch(s.id, { fresh: 0 })
    go('p05')
  }
  const remove = (s: SavedSearch) => {
    setSearches(searches.filter((x) => x.id !== s.id))
    toast('Подборка удалена', () => setSearches(searches))
  }

  const empty = (
    <EmptyState
      icon={BellRing}
      title="Подборок пока нет"
      text="Настройте фильтры вакансий и нажмите «Сохранить поиск» — сообщим, когда появятся новые."
      action={
        <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => go('p05')}>
          К вакансиям
        </Button>
      }
    />
  )

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Сохранённые подборки" onBack={() => go('p05')} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <ViewState loading={{ kind: 'list', rows: 3 }} empty={empty}>
          {searches.length ? (
            <>
              <ul className="mx-4 mt-2 overflow-hidden rounded-xl border border-border bg-surface">
                {searches.map((s) => {
                  const total = jobList(s.f, 'new').length
                  const details = searchDetails(s.f)
                  return (
                    <li key={s.id} className="border-t border-border px-5 pt-4 pb-5 first:border-t-0">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => open(s)} className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                          <span className="text-[17px] leading-snug font-semibold">{searchName(s.f)}</span>
                          {details && <span className="text-sm text-muted-foreground">{details}</span>}
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            {s.fresh > 0 && (
                              <span className="flex h-6 items-center rounded-full bg-primary px-2.5 font-medium text-primary-foreground">
                                <span className="font-mono">{s.fresh}</span>&nbsp;{plural(s.fresh, 'новая', 'новые', 'новых')}
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              <span className="font-mono">{total}</span> {plural(total, 'вакансия', 'вакансии', 'вакансий')}
                            </span>
                          </span>
                        </button>
                        <button type="button" aria-label="Удалить подборку" onClick={() => remove(s)} className="-mt-2 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground">
                          <Trash2 className="size-5" />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-col gap-1.5">
                        <span className="text-sm text-muted-foreground">Уведомлять</span>
                        <Segmented
                          label="Когда уведомлять"
                          value={s.notify}
                          onChange={(notify) => patch(s.id, { notify })}
                          options={[
                            ['daily', 'Раз в день'],
                            ['update', 'При обновлении'],
                          ]}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 flex flex-col items-start gap-3 px-6">
                <p className="text-sm text-muted-foreground">
                  Сохранено <span className="font-mono">{searches.length}</span> из <span className="font-mono">{SEARCH_LIMIT}</span>.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setBag('back.pr-lock-searches', 'p17')
                      go('pr-lock-searches')
                    }}
                    className="inline-flex items-center gap-1 font-medium text-primary"
                  >
                    <Crown className="size-3.5" />С премиумом — до <span className="font-mono">{SEARCH_LIMIT_PREMIUM}</span>
                  </button>
                </p>
                {!full && (
                  <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => go('p13')}>
                    Настроить новый поиск
                  </Button>
                )}
              </div>
            </>
          ) : (
            empty
          )}
        </ViewState>
      </div>
      {toastNode}
    </div>
  )
}
