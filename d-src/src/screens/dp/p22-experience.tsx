import { useState } from 'react'
import { ChevronRight, EyeOff, Ship } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { ViewState } from '@/components/app/states'
import { Switch } from '@/components/ui/switch'
import { CONTRACTS, FOUND_CONTRACT, type Contract } from '@/lib/data-docs-profile'
import type { ScreenProps } from '../types'
import { Dur, plural, useBusy, useDP } from './_parts'
import { AddPanel, byStart, cMonths, ContractSheet, groupByPosition } from './_contracts'

// p22 — «Опыт работы» у профілі (бриф S44) — як крок 6 реєстрації: контракти (правка №3), кожен —
// флот → департамент → посада (№25), «Общий стаж» і «По должностям» рахуються з контрактів.
// Перемикач «Скрыть общий стаж» (№34): агентства бачать лише стаж по кожному контракту.
// Додати — зі сторінок паспорта моряка, послужної книжки чи CV, або вручну. Тап по контракту — правка.
// Стани панелі: «Пусто» — контрактів ще немає.

type Edit = { c?: Contract }

export function P22Experience({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useDP()
  const contracts = bag<Contract[]>('dp.contracts', CONTRACTS)
  const hideTotal = bag<boolean>('dp.hideTotal', false)
  const [edit, setEdit] = useState<Edit | null>(null)
  const { busy, run } = useBusy()

  const list = [...contracts].sort(byStart)
  const total = list.reduce((s, c) => s + cMonths(c), 0)
  const positions = groupByPosition(list)
  const save = (next: Contract[]) => setBag('dp.contracts', next)

  const upload = () =>
    run(() => {
      if (!contracts.some((c) => c.id === FOUND_CONTRACT.id)) save([...contracts, FOUND_CONTRACT])
      showToast('Найден 1 контракт — проверьте данные')
    })
  const onSave = (c: Contract) => {
    if (edit?.c) save(contracts.map((x) => (x.id === edit.c!.id ? { ...c, id: x.id } : x)))
    else save([...contracts, { ...c, id: 'c' + Date.now() }])
    setEdit(null)
    showToast('Контракт сохранён')
  }
  const onDelete = () => {
    save(contracts.filter((x) => x.id !== edit?.c?.id))
    setEdit(null)
    showToast('Контракт удалён')
  }
  const add = <AddPanel title="Добавить контракты из документа" sub="Страницы паспорта моряка, послужной книжки или CV" busy={busy} onUpload={upload} onManual={() => setEdit({})} />

  return (
    <div className="relative flex h-full flex-col">
      <NavBar onBack={() => go('p14')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-8">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Опыт работы</h1>
        <p className="mt-3 text-base text-muted-foreground">Ваш опыт — главное, на что смотрят агентства.</p>

        <ViewState
          loading={{ kind: 'cards', rows: 3, className: 'px-0' }}
          error={{ title: 'Не удалось загрузить опыт работы', className: 'px-0' }}
          empty={
            <div className="mt-6 flex flex-col gap-5">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-4">
                <Ship className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-[15px] text-muted-foreground">Контрактов пока нет. Загрузите страницы послужной книжки или CV — контракты найдутся сами.</p>
              </div>
              {add}
            </div>
          }
        >
          <div className="screen-in mt-6 flex flex-col gap-4">
            <section className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="flex items-end justify-between gap-4 px-5 pt-4 pb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Общий стаж</span>
                  <Dur m={total} long className="text-[28px] leading-tight font-semibold tracking-tight" />
                </div>
                <span className="pb-1.5 text-sm text-muted-foreground">
                  <span className="font-mono">{list.length}</span> {plural(list.length, 'контракт', 'контракта', 'контрактов')}
                </span>
              </div>
              <label htmlFor="p22-hide" className="flex items-start gap-3 border-t border-border px-5 py-4">
                <span className="flex flex-1 flex-col gap-1">
                  <span className="flex items-center gap-2 text-[15px] font-medium">
                    {hideTotal && <EyeOff className="size-4 text-muted-foreground" />}
                    Скрыть общий стаж
                  </span>
                  <span className="text-sm text-muted-foreground">Агентства будут видеть ваш стаж только тот, что вы указали по каждому контракту</span>
                </span>
                <Switch
                  id="p22-hide"
                  checked={hideTotal}
                  onCheckedChange={(v) => {
                    setBag('dp.hideTotal', v)
                    showToast(v ? 'Общий стаж скрыт от агентств' : 'Агентства снова видят общий стаж')
                  }}
                  className="mt-0.5 data-[size=default]:h-6 data-[size=default]:w-10 [&>span]:size-5"
                />
              </label>
            </section>

            {positions.length > 0 && (
              <section>
                <h2 className="mt-3 mb-2 px-1 text-sm font-medium text-muted-foreground">По должностям</h2>
                <ul className="overflow-hidden rounded-xl border border-border bg-surface">
                  {positions.map((r) => (
                    <li key={r.position} className="flex flex-col gap-2 border-t border-border px-4 py-3 first:border-t-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[15px] font-medium">{r.position || 'Должность не указана'}</span>
                        <Dur m={r.total} className="text-[15px] font-medium" />
                      </div>
                      <ul className="flex flex-col gap-1 border-l-2 border-border pl-3">
                        {r.types.map((t) => (
                          <li key={t.type} className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
                            <span>{t.type || 'Тип не указан'}</span>
                            <Dur m={t.m} />
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {list.length > 0 && (
              <section>
                <h2 className="mt-3 mb-2 px-1 text-sm font-medium text-muted-foreground">Контракты</h2>
                <ul className="overflow-hidden rounded-xl border border-border bg-surface">
                  {list.map((c) => (
                    <li key={c.id} className="border-t border-border first:border-t-0">
                      <button type="button" onClick={() => setEdit({ c })} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted/60">
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="truncate text-[15px] font-medium">{c.vessel}</span>
                            <Dur m={cMonths(c)} className="shrink-0 text-sm" />
                          </span>
                          <span className="truncate text-sm text-muted-foreground">{[c.type, c.position].filter(Boolean).join(', ')}</span>
                          {c.fleet && <span className="truncate text-sm text-muted-foreground">{[c.fleet, c.department].filter(Boolean).join(' → ')}</span>}
                          <span className="font-mono text-sm text-muted-foreground">
                            {c.from} – {c.to}
                          </span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-3">{add}</div>
          </div>
        </ViewState>
      </div>
      <ContractSheet open={!!edit} initial={edit?.c} onSave={onSave} onClose={() => setEdit(null)} onDelete={edit?.c ? onDelete : undefined} />
    </div>
  )
}
