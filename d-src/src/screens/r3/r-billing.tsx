import { useState } from 'react'
import { AlertTriangle, Check, CreditCard, ReceiptText } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebField, WebInput } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { BILLING, PLAN_USAGE, PLANS, type Plan } from '@/lib/data-recruiter-3'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { ConfirmDialog } from '../r2/_parts'
import { eur, ExampleMark, ruDate } from './_parts'
import { useBilling } from './_state'

// r-billing — «Тариф и оплата» (відп. 160, 161 — без відповіді замовника: три моделі оплати як ПРИКЛАД:
// підписка, за вакансію, доступ до бази). Сильний елемент — поточний тариф з використанням лімітів.
// Неуспішний платіж зверху веде до оплати; «Счета» — r-billing-history. Пункт навігації — «Организация».
export function RBilling({ go }: ScreenProps) {
  const b = useBilling()
  const [switchTo, setSwitchTo] = useState<Plan | null>(null)
  const [cancelAsk, setCancelAsk] = useState(false)
  const [details, setDetails] = useState(BILLING.details)
  const current = PLANS.find((p) => p.id === b.plan)!
  const next = PLANS.find((p) => p.id === b.nextPlan)
  const failed = b.invoices.find((i) => i.status === 'failed')
  const periodEnd = '2026-11-13'

  return (
    <WebShell variant="recruiter" active="r-org" go={go}>
      <PageHeader
        back={{ label: 'Организация', onClick: () => go('r-org') }}
        title={
          <span className="flex items-center gap-3">
            Тариф и оплата <ExampleMark />
          </span>
        }
        description="Как агентства платят за Seafolio, ещё обсуждается. Здесь пример: три модели оплаты и условные цены в евро без НДС."
        actions={
          <Button variant="outline" className="h-10 text-primary" onClick={() => go('r-billing-history')}>
            <ReceiptText /> Счета
          </Button>
        }
      />

      <ViewState
        loading={{ kind: 'cards' }}
        empty={{ icon: CreditCard, title: 'Тариф не выбран', text: 'Без тарифа можно искать моряков, но нельзя публиковать вакансии и звать на работу.', action: <Button onClick={() => go('r-billing')}>Выбрать тариф</Button> }}
      >
        {failed && (
          <div role="alert" className="mb-6 flex items-center gap-3 rounded-lg border border-signal/40 bg-signal/5 px-4 py-3">
            <AlertTriangle className="size-4.5 shrink-0 text-signal" />
            <p className="flex-1 text-sm">
              Платёж <span className="font-mono">{ruDate(failed.date)}</span> не прошёл: {failed.item.toLowerCase()}, <span className="font-mono">{eur(failed.amount)}</span>. Банк отклонил списание с карты •••• <span className="font-mono">{BILLING.card.last4}</span>.
            </p>
            <Button
              size="sm"
              onClick={() => {
                b.pay(failed.id)
                b.showToast(`Оплачено: ${eur(failed.amount)}`)
              }}
            >
              Оплатить снова
            </Button>
          </div>
        )}

        {/* поточний тариф — сильний елемент */}
        <section className="grid grid-cols-[1fr_440px] overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex flex-col gap-5 border-l-4 border-primary px-8 py-7">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                Ваш тариф с <span className="font-mono">{ruDate(BILLING.since)}</span>
              </span>
              <h2 className="text-[32px] leading-tight font-semibold tracking-tight">{current.name}</h2>
              <p className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-medium text-primary">{current.price}</span>
                <span className="text-[15px] text-muted-foreground">{current.unit}</span>
              </p>
            </div>
            <p className="max-w-[460px] text-[15px] text-muted-foreground">
              {b.cancelled ? (
                <>
                  Подписка отменена. Кабинет работает до <span className="font-mono">{ruDate(periodEnd)}</span>, потом вакансии скроются из поиска.
                </>
              ) : next ? (
                <>
                  С <span className="font-mono">{ruDate(BILLING.nextCharge)}</span> — тариф «{next.name}», {next.price} {next.unit}.
                </>
              ) : (
                <>
                  Следующее списание <span className="font-mono">{ruDate(BILLING.nextCharge)}</span>, <span className="font-mono">{current.price}</span>,
                  <br />с карты <span className="whitespace-nowrap">{BILLING.card.brand} •••• <span className="font-mono">{BILLING.card.last4}</span></span>.
                </>
              )}
            </p>
            <div className="flex items-center gap-4">
              {b.cancelled ? (
                <Button
                  onClick={() => {
                    b.setCancelled(false)
                    b.showToast('Подписка возобновлена')
                  }}
                >
                  Возобновить подписку
                </Button>
              ) : (
                <>
                  {next && (
                    <Button
                      variant="outline"
                      className="text-primary"
                      onClick={() => {
                        b.setNextPlan('')
                        b.showToast(`Остаётесь на тарифе «${current.name}»`)
                      }}
                    >
                      Оставить «{current.name}»
                    </Button>
                  )}
                  <button type="button" className="h-9 text-sm font-medium text-muted-foreground hover:text-signal" onClick={() => setCancelAsk(true)}>
                    Отменить подписку
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-5 border-l border-border bg-muted/40 px-8 py-7">
            {PLAN_USAGE.map((u) => {
              const pct = Math.round((u.used / u.limit) * 100)
              return (
                <div key={u.label} className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between text-sm">
                    <span>{u.label}</span>
                    <span className="text-muted-foreground">
                      <span className="font-mono text-foreground">{u.used}</span> из <span className="font-mono">{u.limit}</span>
                    </span>
                  </div>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-border">
                    <span className={cn('block h-full rounded-full', pct >= 90 ? 'bg-warning' : 'bg-primary')} style={{ width: `${pct}%` }} />
                  </span>
                </div>
              )
            })}
            <button type="button" onClick={() => go('r-team')} className="self-start text-sm font-medium text-primary hover:underline">
              Кто занимает места рекрутеров
            </button>
          </div>
        </section>

        {/* моделі оплати — приклад */}
        <section className="mt-10">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-lg font-semibold">Как можно платить</h2>
            <ExampleMark />
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {PLANS.map((p) => {
              const isCurrent = p.id === b.plan
              const isNext = p.id === b.nextPlan
              return (
                <div key={p.id} className={cn('grid grid-cols-[200px_150px_1fr_140px] items-start gap-6 border-t border-border px-6 py-5 first:border-t-0', isCurrent && 'bg-primary/[0.04]')}>
                  <div className="flex flex-col gap-1">
                    <span className="text-[15px] font-semibold">{p.name}</span>
                    <span className="text-sm text-muted-foreground">{p.model}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-lg font-medium">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.unit}</span>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-sm">
                    {p.includes.map((x) => (
                      <li key={x} className={cn('flex items-start gap-2', /— нет$/.test(x) && 'text-muted-foreground')}>
                        <Check className={cn('mt-0.5 size-4 shrink-0', /— нет$/.test(x) ? 'opacity-0' : 'text-success')} />
                        {x}
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-end">
                    {isCurrent ? (
                      <span className="flex h-9 items-center gap-1.5 text-sm font-medium text-primary">
                        <Check className="size-4" /> Ваш тариф
                      </span>
                    ) : isNext ? (
                      <span className="flex h-9 items-center text-sm text-muted-foreground">
                        С <span className="ml-1 font-mono">{ruDate(BILLING.nextCharge)}</span>
                      </span>
                    ) : (
                      <Button variant="outline" className="text-primary" onClick={() => setSwitchTo(p)}>
                        Перейти
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* оплата і реквізити */}
        <section className="mt-10 grid grid-cols-[1fr_1.4fr] gap-10">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Способ оплаты</h2>
            <div className="flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4">
              <span className="flex h-9 w-12 items-center justify-center rounded-md bg-muted">
                <CreditCard className="size-5 text-primary" />
              </span>
              <span className="flex flex-1 flex-col leading-tight">
                <span className="text-[15px] font-medium">
                  {BILLING.card.brand} •••• <span className="font-mono">{BILLING.card.last4}</span>
                </span>
                <span className="text-sm text-muted-foreground">
                  действует до <span className="font-mono">{BILLING.card.exp}</span>
                </span>
              </span>
              <Button variant="ghost" className="text-primary" onClick={() => b.showToast('Откроется форма платёжного провайдера')}>
                Заменить
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Данные карты хранит платёжный провайдер, Seafolio их не видит.</p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Реквизиты для счетов</h2>
            <div className="grid grid-cols-2 gap-4">
              <WebField id="bl-company" label="Юридическое название">
                <WebInput id="bl-company" value={details.company} onChange={(e) => setDetails({ ...details, company: e.target.value })} />
              </WebField>
              <WebField id="bl-vat" label="VAT номер">
                <WebInput id="bl-vat" className="font-mono" value={details.vat} onChange={(e) => setDetails({ ...details, vat: e.target.value })} />
              </WebField>
              <WebField id="bl-address" label="Адрес" className="col-span-2">
                <WebInput id="bl-address" value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} />
              </WebField>
              <WebField id="bl-email" label="Почта для счетов" hint="Сюда приходят счета и чеки" className="col-span-2">
                <WebInput id="bl-email" type="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
              </WebField>
            </div>
            <Button variant="outline" className="self-start text-primary" onClick={() => b.showToast('Реквизиты сохранены')}>
              Сохранить реквизиты
            </Button>
          </div>
        </section>
      </ViewState>

      <ConfirmDialog
        open={!!switchTo}
        onOpenChange={(v) => !v && setSwitchTo(null)}
        title={`Перейти на тариф «${switchTo?.name}»?`}
        text={
          <>
            Новый тариф начнёт действовать с {ruDate(BILLING.nextCharge)}, когда закончится оплаченный месяц. До этого всё работает как сейчас.
          </>
        }
        confirm="Перейти"
        onConfirm={() => {
          if (!switchTo) return
          b.setNextPlan(switchTo.id)
          b.setCancelled(false)
          b.showToast(`Тариф «${switchTo.name}» с ${ruDate(BILLING.nextCharge)}`)
        }}
      />
      <ConfirmDialog
        open={cancelAsk}
        onOpenChange={setCancelAsk}
        title="Отменить подписку?"
        text={`Кабинет работает до ${ruDate(periodEnd)}. Потом вакансии скроются из поиска, а новые приглашения морякам станут недоступны. Переписка и анкеты останутся.`}
        confirm="Отменить подписку"
        danger
        onConfirm={() => {
          b.setCancelled(true)
          b.setNextPlan('')
          b.showToast('Подписка отменена')
        }}
      />
    </WebShell>
  )
}
