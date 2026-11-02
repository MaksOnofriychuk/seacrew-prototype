import { useState } from 'react'
import { Gift, ReceiptText, Smartphone, Ticket, XCircle } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { NavBar } from '@/components/app/chrome'
import { Paper } from '@/components/app/paper'
import { EmptyState, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { FEATURES, HISTORY, PLAN_ACTIVE, PLAN_ENDED, PRICE_STUB, type Plan } from '@/lib/data-premium'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { SettingsGroup, SettingsRow } from '../m/_parts'
import { Pennant, useBack, useGoFrom, useOpenPaywall, usePlan, usePr } from './_parts'

// pr-status — «Моя подписка» (бриф S48: стан, керування, історія). pr-status-ended — премиум закінчився:
// сповіщення з «Продолжить» (відповідь 132). Порожній стан з панелі — премиум не підключено.
// Оплата й скасування — через магазин застосунків (відповідь 129).

export function PrStatus({ go }: ScreenProps) {
  return <StatusScreen go={go} id="pr-status" />
}

export function PrStatusEnded({ go }: ScreenProps) {
  return <StatusScreen go={go} id="pr-status-ended" forced={PLAN_ENDED} />
}

function StatusScreen({ go, id, forced }: ScreenProps & { id: string; forced?: Plan }) {
  const { showToast } = usePr()
  const { plan: saved, setPlan } = usePlan()
  const [override, setOverride] = useState<Plan | null>(null)
  const plan = override ?? forced ?? saved
  const back = useBack(id, 'p04')
  const goFrom = useGoFrom(go, id)
  const paywall = useOpenPaywall(go, id)
  const [sheet, setSheet] = useState<'cancel' | 'renew' | null>(null)
  const ended = plan.kind === 'ended'

  const renew = () => {
    setPlan(PLAN_ACTIVE)
    setOverride(PLAN_ACTIVE)
    setSheet(null)
    showToast(`Премиум продлён до ${PLAN_ACTIVE.until}`)
  }

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Моя подписка" onBack={() => go(back)} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-8">
        <ViewState
          loading={{ kind: 'cards', rows: 3 }}
          empty={
            <EmptyState
              icon={Pennant}
              title="Премиум не подключён"
              text="Подходящие вакансии сразу, до 20 подборок, сравнение вакансий и анкеты из профиля."
              action={
                <Button className="h-11 text-[15px]" onClick={paywall}>
                  Попробовать неделю бесплатно
                </Button>
              }
            />
          }
        >
          {ended && <EndedNotice onContinue={() => setSheet('renew')} />}

          <Paper title={<span className="flex items-center gap-2"><Pennant />Премиум</span>} className={cn(ended && 'mt-6')}>
            {ended ? (
              <div className="flex flex-col gap-1">
                <span className="text-xl font-semibold text-muted-foreground">Закончился</span>
                <span className="text-[15px] text-muted-foreground">
                  С <span className="font-mono">{plan.until}</span> подборки сверх трёх на паузе, остальное сохранено.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] text-muted-foreground">{plan.kind === 'trial' ? 'Пробная неделя до' : 'Действует до'}</span>
                <span className="font-mono text-[28px] leading-tight font-semibold tracking-tight">{plan.until}</span>
                <span className="mt-1 text-[15px] text-muted-foreground">
                  Потом продлится сам: <span className="font-mono">{PRICE_STUB}</span> / мес
                </span>
              </div>
            )}
          </Paper>

          <SettingsGroup title="Что входит" className="mt-8">
            {FEATURES.map((f) => (
              <SettingsRow key={f.id} title={f.title} sub={f.text} onClick={() => goFrom(f.to)} />
            ))}
          </SettingsGroup>

          <SettingsGroup title="Управление">
            {!ended && <SettingsRow icon={Smartphone} title="Оплата" value="App Store" onClick={() => showToast('Откроются подписки в App Store (пример)')} />}
            <SettingsRow icon={Ticket} title="Ввести промокод" onClick={() => goFrom('pr-promo')} />
            <SettingsRow icon={Gift} title="Пригласить коллегу" sub="Неделя премиума вам обоим" onClick={() => goFrom('pr-invite')} />
            {!ended && <SettingsRow icon={XCircle} title="Отменить подписку" tone="signal" onClick={() => setSheet('cancel')} />}
          </SettingsGroup>

          <SettingsGroup title="История">
            {HISTORY.map((h) => (
              <div key={h.date + h.title} className="flex items-start gap-3 border-t border-border px-4 py-3 first:border-t-0">
                <ReceiptText className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px]">{h.title}</span>
                  <span className="text-sm text-muted-foreground">{h.sub}</span>
                  <span className="font-mono text-sm text-muted-foreground">{h.date}</span>
                </span>
                <span className="shrink-0 text-[15px] font-medium">
                  {h.amount.split(/([…\d+]+)/).map((p, i) => (i % 2 ? <span key={i} className="font-mono">{p}</span> : p))}
                </span>
              </div>
            ))}
          </SettingsGroup>
        </ViewState>
      </div>

      <BottomSheet
        open={sheet === 'cancel'}
        onClose={() => setSheet(null)}
        title="Отменить подписку?"
        description={
          <>
            Премиум останется до <span className="font-mono">{plan.until}</span>, потом не продлится. Отмена — в настройках App Store.
          </>
        }
        footer={
          <>
            <Button size="lg" variant="outline" className="text-signal" onClick={() => { setSheet(null); showToast('Откроются подписки в App Store (пример)') }}>
              Отменить в App Store
            </Button>
            <Button size="lg" variant="ghost" className="text-primary" onClick={() => setSheet(null)}>
              Оставить премиум
            </Button>
          </>
        }
      >
        <span />
      </BottomSheet>

      <BottomSheet
        open={sheet === 'renew'}
        onClose={() => setSheet(null)}
        title="Продолжить премиум"
        description={
          <>
            <span className="font-mono">{PRICE_STUB}</span> / мес через App Store, до <span className="font-mono">{PLAN_ACTIVE.until}</span>. Отменить можно в любой момент.
          </>
        }
        footer={
          <Button size="lg" onClick={renew}>
            Подтвердить
          </Button>
        }
      >
        <span />
      </BottomSheet>
    </div>
  )
}

// Сповіщення про кінець премиума (відповідь 132) — так воно виглядає у «Уведомлениях» і пушем.
function EndedNotice({ onContinue }: { onContinue: () => void }) {
  return (
    <div role="status" className="rounded-xl border border-primary/40 bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Pennant className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-base font-semibold">Премиум закончился</span>
          <span className="text-[15px] text-muted-foreground">Продолжите — и подходящие вакансии снова будут приходить сразу.</span>
        </div>
      </div>
      <Button size="lg" className="mt-4" onClick={onContinue}>
        Продолжить
      </Button>
    </div>
  )
}
