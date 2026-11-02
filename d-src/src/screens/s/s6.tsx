import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { plural, StepShell } from './_stepper'
import type { ScreenProps } from '../registry'
import { AddPanel, Dur, ScrollAnchor, SectionTitle, useBusy, useHashParams, useS } from './_core-parts'
import { byStart, FOUND, groupByRank, VoyageForm, VOYAGES, vMonths, type Voyage } from './_core-voyage'

// s6 — крок 6 «Опыт работы» (№26). «Рейсы» → «контракты» скрізь (№3). Увесь стаж, без «за 5 лет».
// Нагорі «Общий стаж» — сума всіх контрактів; під ним перемикач «Скрыть общий стаж» (№34):
// агентства бачать лише стаж по кожному контракту. «По должностям» — сума на посаду з розбивкою
// по типах суден; нижче — контракти. Додати — зі сторінок паспорта моряка, послужної книжки чи CV
// (ИИ знаходить контракт) або вручну; посада в контракті — Флот → Департамент → Должность (№25).
// ?form=1 відкриває форму нового контракту (для скріншотів).

type Edit = { v?: Voyage }

export function S6SeaService({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useS()
  const params = useHashParams()
  const voyages = bag<Voyage[]>('s6.voyages', VOYAGES)
  const hideTotal = bag<boolean>('s6.hideTotal', false)
  const [edit, setEdit] = useState<Edit | null>(() => (params.get('form') === '1' ? {} : null))
  const { busy, run } = useBusy()

  const list = [...voyages].sort(byStart)
  const total = list.reduce((s, v) => s + vMonths(v), 0)
  const ranks = groupByRank(list)
  const save = (next: Voyage[]) => setBag('s6.voyages', next)

  const upload = () =>
    run(() => {
      if (!voyages.some((v) => v.id === FOUND.id)) save([...voyages, FOUND])
      showToast('Найден 1 контракт — проверьте данные')
    })
  const onSave = (v: Voyage) => {
    if (edit?.v) save(voyages.map((x) => (x.id === edit.v!.id ? { ...v, id: x.id } : x)))
    else save([...voyages, { ...v, id: 'v' + Date.now() }])
    setEdit(null)
    showToast('Контракт сохранён')
  }
  const onDelete = () => {
    save(voyages.filter((x) => x.id !== edit?.v?.id))
    setEdit(null)
    showToast('Контракт удалён')
  }

  return (
    <StepShell step={6} go={go} optional>
      <ScrollAnchor />
      <section className="rounded-xl border border-border bg-surface">
        <div className="flex items-end justify-between gap-4 px-5 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Общий стаж</span>
            <Dur m={total} long className="text-[26px] leading-tight font-semibold tracking-tight" />
          </div>
          <span className="pb-1 text-sm text-muted-foreground">
            <span className="font-mono">{list.length}</span> {plural(list.length, 'контракт', 'контракта', 'контрактов')}
          </span>
        </div>
        <label htmlFor="s6-hide" className="flex items-start gap-4 border-t border-border px-5 py-3">
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-medium">Скрыть общий стаж</span>
            <span className="text-sm text-muted-foreground">Агентства будут видеть ваш стаж только тот, что вы указали по каждому контракту</span>
          </span>
          <Switch id="s6-hide" checked={hideTotal} onCheckedChange={(v) => setBag('s6.hideTotal', v)} className="mt-0.5" />
        </label>
      </section>

      {ranks.length > 0 && (
        <>
          <SectionTitle>По должностям</SectionTitle>
          <ul className="overflow-hidden rounded-xl border border-border bg-surface">
            {ranks.map((r) => (
              <li key={r.rank} className="flex flex-col gap-2 border-t border-border px-4 py-3 first:border-t-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-medium">{r.rank}</span>
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
        </>
      )}

      {list.length > 0 && (
        <>
          <SectionTitle>Контракты</SectionTitle>
          <ul className="overflow-hidden rounded-xl border border-border bg-surface">
            {list.map((v) => (
              <li key={v.id} className="border-t border-border first:border-t-0">
                <button type="button" onClick={() => setEdit({ v })} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[15px] font-medium">{v.vessel}</span>
                      <Dur m={vMonths(v)} className="shrink-0 text-sm" />
                    </span>
                    <span className="truncate text-sm text-muted-foreground">{[v.fleet, v.type, v.rank].filter(Boolean).join(', ')}</span>
                    {v.owner && <span className="truncate text-sm text-muted-foreground">{v.owner}</span>}
                    <span className="font-mono text-sm text-muted-foreground">
                      {v.from} – {v.to}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div id="f-up6" className="mt-2">
        {edit ? (
          <VoyageForm key={edit.v?.id ?? 'new'} initial={edit.v} onSave={onSave} onCancel={() => setEdit(null)} onDelete={edit.v ? onDelete : undefined} />
        ) : (
          <AddPanel title="Добавить контракты из документа" sub="Страницы паспорта моряка, послужной книжки или CV" busy={busy} onUpload={upload} onManual={() => setEdit({})} />
        )}
      </div>
    </StepShell>
  )
}
