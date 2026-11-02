import { useState } from 'react'
import { BellRing, Columns2, FileCheck2, ListPlus, X, type LucideIcon } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { Footer, Wordmark } from '@/components/app/chrome'
import { HeroPanel } from '@/components/app/hero-panel'
import { Button } from '@/components/ui/button'
import { FEATURES, PLAN_ACTIVE, PLAN_TRIAL, PRICE_STUB, TRIAL_DAYS, type FeatureId } from '@/lib/data-premium'
import type { ScreenProps } from '../types'
import { FactRow, Pennant, usePlan, usePr } from './_parts'

// pr-paywall — «Премиум» у кінці онбордингу (відповідь 131: список переваг, можна пропустити; бриф S23).
// Пробна неделя (130), ціни ще немає — заглушка «… / мес» (128), оплата в застосунку через магазин (129).
// Відкритий із замка (bag pr.paywall.from) — замість «Пропустить» є «Закрыть» і повернення назад.

const ICONS: Record<FeatureId, LucideIcon> = { alerts: BellRing, searches: ListPlus, autofill: FileCheck2, compare: Columns2 }

export function PrPaywall({ go }: ScreenProps) {
  const { bag, setBag, showToast } = usePr()
  const { setPlan, trialUsed } = usePlan()
  const from = bag<string | null>('pr.paywall.from', null)
  const [confirm, setConfirm] = useState(false)
  const next = from ?? 'q09'

  const leave = () => {
    setBag('pr.paywall.from', null)
    go(next)
  }
  const subscribe = () => {
    setPlan(trialUsed ? PLAN_ACTIVE : PLAN_TRIAL)
    setBag('pr.trialUsed', true)
    setConfirm(false)
    showToast(trialUsed ? `Премиум подключён до ${PLAN_ACTIVE.until}` : `Премиум включён до ${PLAN_TRIAL.until}`)
    leave()
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <HeroPanel>
          <div className="relative flex h-12 items-center justify-between px-6 mt-[50px]">
            <Wordmark />
            {from && (
              <button type="button" aria-label="Закрыть" onClick={leave} className="-mr-2 flex size-11 items-center justify-center rounded-md text-muted-foreground active:scale-95">
                <X className="size-6" />
              </button>
            )}
          </div>
          <div className="relative px-6 pt-8 pb-6">
            <Pennant className="size-10 text-primary" />
            <h1 className="mt-4 text-[34px] leading-[1.05] font-semibold tracking-tight">Премиум</h1>
            <p className="mt-2 text-lg text-foreground">
              {trialUsed ? (
                <>
                  <span className="font-mono">{PRICE_STUB}</span> в месяц, без привязки к контракту
                </>
              ) : (
                <>
                  Первые <span className="font-mono">{TRIAL_DAYS}</span> дней — бесплатно
                </>
              )}
            </p>
          </div>
        </HeroPanel>

        <ul className="flex flex-col px-6 pt-4">
          {FEATURES.map((f) => {
            const I = ICONS[f.id]
            return (
              <li key={f.id} className="flex gap-4 border-t border-border py-4 first:border-t-0">
                <I className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-base font-medium">{f.title}</span>
                  <span className="text-[15px] text-muted-foreground">{f.text}</span>
                </span>
              </li>
            )
          })}
        </ul>

        <p className="px-6 pt-2 pb-6 text-sm text-muted-foreground">
          {trialUsed ? 'Оплата' : <>После пробной недели — <span className="font-mono">{PRICE_STUB}</span> / мес (цена появится позже). Оплата</>} через App Store или Google
          Play. Отменить можно в любой момент.
        </p>
      </div>

      <Footer className="border-t border-border">
        <Button size="lg" onClick={() => setConfirm(true)}>
          {trialUsed ? 'Подключить премиум' : 'Попробовать неделю бесплатно'}
        </Button>
        <Button size="lg" variant="ghost" className="text-primary" onClick={leave}>
          {from ? 'Не сейчас' : 'Пропустить'}
        </Button>
      </Footer>

      <BottomSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Подтвердите подписку"
        description="Оплата пройдёт через магазин приложений на телефоне."
        footer={
          <Button size="lg" onClick={subscribe}>
            Подтвердить
          </Button>
        }
      >
        <dl className="flex flex-col border-y border-border">
          {trialUsed ? (
            <>
              <FactRow label="Сегодня">
                <span className="font-mono">{PRICE_STUB}</span>
              </FactRow>
              <FactRow label="Продление" mono>
                {PLAN_ACTIVE.until}
              </FactRow>
            </>
          ) : (
            <>
              <FactRow label="Сегодня">бесплатно</FactRow>
              <FactRow label="Пробная неделя до" mono>
                {PLAN_TRIAL.until}
              </FactRow>
              <FactRow label="Потом">
                <span className="font-mono">{PRICE_STUB}</span> / мес
              </FactRow>
            </>
          )}
        </dl>
        <p className="mt-3 text-sm text-muted-foreground">Отменить можно в настройках App Store или Google Play — до даты списания деньги не возьмут.</p>
      </BottomSheet>
    </div>
  )
}
