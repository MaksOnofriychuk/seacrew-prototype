import { INVOICES, type InvoiceStatus, type PlanId } from '@/lib/data-recruiter-3'
import { useProto } from '@/lib/proto-state'

// Стан частини 3 між екранами в межах сесії: тариф, скасування, оплачені рахунки. Ключі bag — 'r3.*'.
export function useBilling() {
  const { bag, setBag, showToast } = useProto()
  const paid = bag<string[]>('r3.paid', [])
  const invoices = INVOICES.map((i) => ({ ...i, status: (paid.includes(i.id) ? 'paid' : i.status) as InvoiceStatus }))
  return {
    showToast,
    plan: bag<PlanId>('r3.plan', 'subscription'),
    setPlan: (p: PlanId) => setBag('r3.plan', p),
    /** тариф, на який перейдемо з наступного періоду */
    nextPlan: bag<PlanId | ''>('r3.nextPlan', ''),
    setNextPlan: (p: PlanId | '') => setBag('r3.nextPlan', p),
    cancelled: bag<boolean>('r3.cancelled', false),
    setCancelled: (v: boolean) => setBag('r3.cancelled', v),
    invoices,
    pay: (id: string) => setBag('r3.paid', [...paid, id]),
  }
}
