import { useState } from 'react'
import { Receipt, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebInput, WebTextarea } from '@/components/web/fields'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { PAYMENTS, PAY_MONTH, PAY_STATE_LABEL, money, type PayChannel, type PayState, type Payment } from '@/lib/data-admin-2'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { AdminPage, CancelButton, Facts, Mono, Note, SideSheet, dt, useBagState } from '../a/_parts'
import { SummaryLine } from './_parts'

const TONE: Record<PayState, Tone> = { paid: 'success', refunded: 'muted', failed: 'error', pending: 'warning' }
const CHANNELS: PayChannel[] = ['App Store', 'Google Play', 'Карта', 'Счёт']
const STORE = (c: PayChannel) => c === 'App Store' || c === 'Google Play'

type Tab = 'all' | 'seafarer' | 'company' | 'refunded'

export function A2Payments({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [pays, setPays] = useBagState<Payment[]>('a2.payments', PAYMENTS)
  const [q, setQ] = useBagState('a2.payQ', '')
  const [, setSub] = useBagState('a2.sub', 's-104')
  const [, setOrg] = useBagState('a.org', 'org-mc')
  const [tab, setTab] = useState<Tab>('all')
  const [channel, setChannel] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [refunding, setRefunding] = useState(false)
  const [full, setFull] = useState(true)
  const [part, setPart] = useState('')
  const [reason, setReason] = useState('')
  const open = pays.find((p) => p.id === openId)

  const rows = pays
    .filter((p) => (tab === 'all' ? true : tab === 'refunded' ? p.state === 'refunded' : p.payerKind === tab))
    .filter((p) => !channel || p.channel === channel)
    .filter((p) => !q || (p.payer + p.item + p.id).toLowerCase().includes(q.toLowerCase()))

  const close = () => {
    setOpenId(null)
    setRefunding(false)
    setFull(true)
    setPart('')
    setReason('')
  }

  const update = (id: string, p: Partial<Payment>, toast: string) => {
    setPays(pays.map((x) => (x.id === id ? { ...x, ...p } : x)))
    showToast(toast)
    close()
  }

  const partNum = Number(part.replace(',', '.'))
  const refundAmount = open ? (full ? open.amount : partNum) : 0
  const refundOk = !!reason.trim() && (full || (partNum > 0 && open !== undefined && partNum <= open.amount))

  const columns: Column<Payment>[] = [
    { key: 'at', header: 'Дата', width: '15%', mono: true, sortValue: (p) => p.at, cell: (p) => dt(p.at) },
    {
      key: 'payer',
      header: 'Кто платит',
      width: '25%',
      sortValue: (p) => p.payer,
      cell: (p) => (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-medium">{p.payer}</span>
          <span className="text-sm text-muted-foreground">{p.payerKind === 'seafarer' ? 'Моряк' : 'Компания'}</span>
        </span>
      ),
    },
    { key: 'item', header: 'За что', width: '22%', cell: (p) => <span className="truncate">{p.item}</span> },
    { key: 'ch', header: 'Как', width: '12%', sortValue: (p) => p.channel, cell: (p) => <span className="text-muted-foreground">{p.channel}</span> },
    {
      key: 'amount',
      header: 'Сумма',
      width: '12%',
      align: 'right',
      sortValue: (p) => p.amount,
      cell: (p) => <Mono className={cn(p.state === 'refunded' && 'text-muted-foreground line-through', p.state === 'failed' && 'text-muted-foreground')}>{money(p.amount)}</Mono>,
    },
    { key: 'state', header: 'Статус', sortValue: (p) => p.state, cell: (p) => <StatusDot tone={TONE[p.state]}>{PAY_STATE_LABEL[p.state]}</StatusDot> },
  ]

  const M = PAY_MONTH
  return (
    <AdminPage active="a-users" go={go}>
      <PageHeader
        title="Платежи"
        description="Оплаты премиума моряками и тарифов компаниями. Возврат по карте или счёту оформляется здесь, за покупки в App Store и Google Play деньги возвращает магазин."
      />
      <SummaryLine>
        За {M.label} получено <Mono>{money(M.seafarers + M.companies - M.refunds)}</Mono>
        <span className="text-muted-foreground">
          {' '}
          — от моряков <Mono>{money(M.seafarers)}</Mono>, от компаний <Mono>{money(M.companies)}</Mono>, возвраты <Mono>{money(-M.refunds)}</Mono>
        </span>
      </SummaryLine>
      <PageTabs<Tab>
        tabs={[
          { id: 'all', label: 'Все', count: pays.length },
          { id: 'seafarer', label: 'Моряки', count: pays.filter((p) => p.payerKind === 'seafarer').length },
          { id: 'company', label: 'Компании', count: pays.filter((p) => p.payerKind === 'company').length },
          { id: 'refunded', label: 'Возвраты', count: pays.filter((p) => p.state === 'refunded').length },
        ]}
        value={tab}
        onChange={setTab}
      />
      <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Плательщик или номер' }} onReset={channel || q ? () => (setChannel(''), setQ('')) : undefined} count={rows.length}>
        <FilterSelect label="Как" value={channel} onChange={setChannel} options={CHANNELS} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        onRowClick={(p) => setOpenId(p.id)}
        selectedKey={openId ?? undefined}
        initialSort={{ key: 'at', dir: 'desc' }}
        empty={
          q || channel
            ? { icon: Receipt, title: 'Платежей не нашлось', text: 'Проверьте имя или сбросьте фильтр.' }
            : tab === 'refunded'
              ? { icon: Undo2, title: 'Возвратов не было', text: 'Здесь появятся платежи, по которым вернули деньги.' }
              : { icon: Receipt, title: 'Платежей пока нет', text: 'Первая оплата премиума или тарифа появится здесь.' }
        }
      />

      <SideSheet
        open={!!open}
        onOpenChange={(v) => !v && close()}
        title={refunding ? 'Вернуть деньги' : open ? `${open.item}` : ''}
        description={open ? <>{open.payer}, <Mono>{dt(open.at)}</Mono></> : undefined}
        footer={
          open &&
          (refunding ? (
            <>
              <CancelButton onClick={() => setRefunding(false)} />
              <Button
                variant="destructive"
                disabled={!refundOk}
                onClick={() =>
                  update(open.id, { state: 'refunded', refund: { amount: refundAmount, reason: reason.trim(), at: '2026-11-02 ' + new Date().toTimeString().slice(0, 5), who: 'Команда Seafolio' } }, `Возврат ${money(refundAmount)} оформлен`)
                }
              >
                Вернуть {refundOk ? money(refundAmount) : ''}
              </Button>
            </>
          ) : (
            <>
              {open.subId && (
                <Button variant="ghost" className="mr-auto text-primary" onClick={() => (setSub(open.subId!), go('a2-sub'))}>
                  Подписка моряка
                </Button>
              )}
              {open.orgId && (
                <Button variant="ghost" className="mr-auto text-primary" onClick={() => (setOrg(open.orgId!), go('a-org'))}>
                  Организация
                </Button>
              )}
              {open.state === 'paid' && !STORE(open.channel) && (
                <Button variant="outline" onClick={() => setRefunding(true)}>
                  <Undo2 /> Вернуть деньги
                </Button>
              )}
              {open.state === 'pending' && (
                <Button onClick={() => update(open.id, { state: 'paid' }, 'Счёт отмечен оплаченным')}>Отметить оплаченным</Button>
              )}
              {open.state === 'failed' && (
                <Button variant="outline" onClick={() => (showToast('Владельцу отправлено письмо с новой ссылкой на оплату'), close())}>
                  Напомнить об оплате
                </Button>
              )}
            </>
          ))
        }
      >
        {open && !refunding && (
          <>
            <Facts
              items={[
                ['Сумма', <Mono key="a">{money(open.amount)}</Mono>],
                ['Статус', <StatusDot key="s" tone={TONE[open.state]}>{PAY_STATE_LABEL[open.state]}</StatusDot>],
                ['Как оплачено', open.channel],
                ['Номер операции', <Mono key="r">{open.ref}</Mono>],
              ]}
            />
            {open.refund && (
              <Note>
                Возврат <Mono>{money(open.refund.amount)}</Mono> <Mono>{dt(open.refund.at)}</Mono>, {open.refund.who}. {open.refund.reason}.
              </Note>
            )}
            {open.state === 'paid' && STORE(open.channel) && (
              <Note>
                Деньги за покупки в {open.channel} возвращает {open.channel === 'App Store' ? 'Apple' : 'Google'} — моряк просит возврат в магазине. Когда магазин вернёт деньги, платёж здесь отметится сам. Если нужно извиниться за сбой — продлите премиум вручную в подписке.
              </Note>
            )}
            {open.state === 'failed' && <Note tone="error">Карта отклонена банком. Тариф продолжает работать 7 дней, потом компания перейдёт на «Старт».</Note>}
            {open.state === 'pending' && <Note tone="warning">Счёт выставлен, оплата банковским переводом ещё не пришла.</Note>}
          </>
        )}
        {open && refunding && (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Сколько вернуть</span>
              <div role="radiogroup" aria-label="Сколько вернуть" className="grid grid-cols-2 gap-2">
                {[
                  { v: true, l: `Всё, ${money(open.amount)}` },
                  { v: false, l: 'Часть' },
                ].map((o) => (
                  <button
                    key={String(o.v)}
                    type="button"
                    role="radio"
                    aria-checked={full === o.v}
                    onClick={() => setFull(o.v)}
                    className={cn('h-10 rounded-md border text-sm font-medium transition-colors', full === o.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted')}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            {!full && (
              <WebField id="ref-part" label="Сумма, $" error={part && !(partNum > 0 && partNum <= open.amount) ? `От 0 до ${money(open.amount)}` : undefined}>
                <WebInput id="ref-part" inputMode="decimal" value={part} onChange={(e) => setPart(e.target.value)} placeholder="50" className="font-mono" />
              </WebField>
            )}
            <WebField id="ref-reason" label="Причина" hint={open.payerKind === 'company' ? 'Увидит владелец организации в письме.' : 'Увидит моряк в письме.'}>
              <WebTextarea id="ref-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Например: тариф не работал из-за сбоя" />
            </WebField>
            <Note>{open.channel === 'Счёт' ? 'Вернём банковским переводом на счёт компании.' : 'Деньги вернутся на ту же карту за 5–10 дней.'}{open.payerKind === 'company' ? 'Тариф остаётся до конца оплаченного месяца.' : 'Премиум выключится сразу.'}</Note>
          </>
        )}
      </SideSheet>
    </AdminPage>
  )
}
