import { useState } from 'react'
import { Download, ReceiptText } from 'lucide-react'
import { Paper } from '@/components/app/paper'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { BILLING, INVOICE_STATUS_LABEL, type Invoice, type InvoiceStatus } from '@/lib/data-recruiter-3'
import { RECRUITER_ORG } from '@/lib/data-web'
import type { ScreenProps } from '../types'
import { WebDialog } from '../r1/_parts'
import { eur, ExampleMark, ruDate } from './_parts'
import { useBilling } from './_state'

const TONE: Record<InvoiceStatus, Tone> = { paid: 'success', due: 'muted', failed: 'error' }

// r-billing-history — «Счета»: таблиця рахунків, рядок відкриває рахунок як папір (смуга з номером).
// Неоплачений рахунок можна оплатити тут же; стан спільний з r-billing (bag 'r3.paid').
export function RBillingHistory({ go }: ScreenProps) {
  const b = useBilling()
  const [openId, setOpenId] = useState<string | null>(null)
  const open = b.invoices.find((i) => i.id === openId)
  const paidTotal = b.invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const pdf = (i: Invoice) => b.showToast(`Файл скачан: ${i.number}.pdf`)

  const cols: Column<Invoice>[] = [
    { key: 'number', header: 'Счёт', width: '16%', mono: true, sortValue: (i) => i.number, cell: (i) => <span className="font-medium">{i.number}</span> },
    { key: 'date', header: 'Дата', width: '12%', mono: true, sortValue: (i) => i.date, cell: (i) => ruDate(i.date) },
    { key: 'item', header: 'За что', width: '29%', cell: (i) => i.item },
    { key: 'amount', header: 'Сумма', width: '11%', align: 'right', mono: true, sortValue: (i) => i.amount, cell: (i) => eur(i.amount) },
    { key: 'status', header: 'Статус', width: '20%', sortValue: (i) => i.status, cell: (i) => <StatusDot tone={TONE[i.status]}>{i.status === 'due' ? <>Спишем <span className="font-mono">{ruDate(i.date)}</span></> : INVOICE_STATUS_LABEL[i.status]}</StatusDot> },
    {
      key: 'act',
      header: <span className="sr-only">Действия</span>,
      width: '12%',
      align: 'right',
      cell: (i) =>
        i.status === 'failed' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              b.pay(i.id)
              b.showToast(`Оплачено: ${eur(i.amount)}`)
            }}
            className="text-sm font-medium text-primary"
          >
            Оплатить
          </button>
        ) : i.status === 'paid' ? (
          <button
            type="button"
            aria-label={`Скачать ${i.number}`}
            onClick={(e) => {
              e.stopPropagation()
              pdf(i)
            }}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <Download className="size-4" />
          </button>
        ) : null,
    },
  ]

  return (
    <WebShell variant="recruiter" active="r-billing" go={go}>
      <PageHeader
        back={{ label: 'Тариф и оплата', onClick: () => go('r-billing') }}
        title={
          <span className="flex items-center gap-3">
            Счета <ExampleMark />
          </span>
        }
        meta={
          <>
            <span>
              Оплачено с <span className="font-mono">{ruDate(BILLING.since)}</span>: <span className="font-mono text-foreground">{eur(paidTotal)}</span>
            </span>
            <span>Счета приходят на {BILLING.details.email}</span>
          </>
        }
      />
      <ViewState loading={{ kind: 'table' }} empty={{ icon: ReceiptText, title: 'Счетов пока нет', text: 'Первый счёт появится после выбора тарифа.', action: <Button variant="outline" className="text-primary" onClick={() => go('r-billing')}>Выбрать тариф</Button> }}>
        <DataTable columns={cols} rows={b.invoices} rowKey={(i) => i.id} onRowClick={(i) => setOpenId(i.id)} initialSort={{ key: 'date', dir: 'desc' }} ignoreView />
      </ViewState>

      <WebDialog
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open ? `Счёт ${open.number}` : ''}
        className="w-[600px]"
        footer={
          open && (
            <>
              {open.status === 'failed' && (
                <Button
                  variant="outline"
                  className="text-primary"
                  onClick={() => {
                    b.pay(open.id)
                    b.showToast(`Оплачено: ${eur(open.amount)}`)
                  }}
                >
                  Оплатить
                </Button>
              )}
              <Button onClick={() => pdf(open)}>
                <Download /> Скачать PDF
              </Button>
            </>
          )
        }
      >
        {open && (
          <Paper title={<span className="font-mono">{open.number}</span>} className="[&>div:last-child]:p-0">
            <dl className="grid grid-cols-2 gap-6 px-5 py-4 text-sm">
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Продавец</dt>
                <dd>Seafolio Ltd</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Покупатель</dt>
                <dd>
                  {BILLING.details.company}
                  <br />
                  {RECRUITER_ORG.city}, {RECRUITER_ORG.country}
                  <br />
                  VAT <span className="font-mono">{BILLING.details.vat}</span>
                </dd>
              </div>
            </dl>
            <table className="w-full border-t border-border text-sm">
              <thead>
                <tr className="text-left text-[13px] text-muted-foreground">
                  <th className="px-5 pt-3 pb-2 font-normal">Позиция</th>
                  <th className="px-5 pt-3 pb-2 font-normal">Период</th>
                  <th className="px-5 pt-3 pb-2 text-right font-normal">Сумма</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-5 py-3">{open.item}</td>
                  <td className="px-5 py-3 font-mono text-muted-foreground">{open.period}</td>
                  <td className="px-5 py-3 text-right font-mono">{eur(open.amount)}</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-5 py-3 text-muted-foreground" colSpan={2}>
                    НДС, обратное начисление
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-muted-foreground">{eur(0)}</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-5 py-3 font-semibold" colSpan={2}>
                    Итого
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-base font-semibold">{eur(open.amount)}</td>
                </tr>
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
              <span className="text-muted-foreground">
                Дата счёта <span className="font-mono">{ruDate(open.date)}</span>
              </span>
              <StatusDot tone={TONE[open.status]}>{INVOICE_STATUS_LABEL[open.status]}</StatusDot>
            </div>
          </Paper>
        )}
      </WebDialog>
    </WebShell>
  )
}
