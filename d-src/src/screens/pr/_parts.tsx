import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { Button } from '@/components/ui/button'
import { LOCKS, PLAN_ACTIVE, TRIAL_DAYS, type Plan } from '@/lib/data-premium'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'

// Спільне для екранів преміуму, зарплати, аналітики, підписок і обговорень (тека pr).
// Ключі bag: pr.plan (Plan), pr.trialUsed, pr.paywall.from (звідки відкрили paywall), back.<id> (куди «Назад»),
// pr.compare (індекси FJ_JOBS), pr.follow (імена моряків), pr.followCo (id компаній), pr.salary, pr.invites.

/* ---------- стан ---------- */

// useProto, але null у bag теж дає fallback.
export function usePr() {
  const p = useProto()
  const bag = <T,>(key: string, fallback: T): T => p.bag<T | null>(key, null) ?? fallback
  return { ...p, bag }
}

/** Поточна підписка. Без запису — активний премиум (так «Моя подписка» показує повний екран). */
export function usePlan(fallback: Plan = PLAN_ACTIVE) {
  const { bag, setBag } = usePr()
  const plan = bag<Plan>('pr.plan', fallback)
  return { plan, setPlan: (p: Plan) => setBag('pr.plan', p), trialUsed: bag<boolean>('pr.trialUsed', false) }
}

/** «Назад»: екран, з якого прийшли (bag back.<id>), інакше fallback. */
export function useBack(id: string, fallback: string) {
  const { bag } = usePr()
  return bag<string>('back.' + id, fallback)
}

/** Перейти на екран і запам'ятати, куди з нього повертатися. */
export function useGoFrom(go: (id: string) => void, from: string) {
  const { setBag } = useProto()
  return (to: string) => {
    setBag('back.' + to, from)
    go(to)
  }
}

/** Відкрити paywall не з онбордингу: там з'явиться «Закрыть» і повернення сюди. */
export function useOpenPaywall(go: (id: string) => void, from: string) {
  const { setBag } = useProto()
  return () => {
    setBag('pr.paywall.from', from)
    go('pr-paywall')
  }
}

/* ---------- знак премиума: морський вимпел ---------- */

export function Pennant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn('size-4 shrink-0', className)}>
      <path d="M3 1.5v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3.75 2.25 14 6 3.75 9.75Z" fill="currentColor" />
    </svg>
  )
}

export function PremiumMark({ className, children = 'Премиум' }: { className?: string; children?: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium text-primary', className)}>
      <Pennant />
      {children}
    </span>
  )
}

/* ---------- замок на платній функції ---------- */

// Маленька позначка біля закритої дії: замок + «Премиум».
export function LockTag({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm font-medium text-primary', className)}>
      <Lock className="size-3.5" />
      Премиум
    </span>
  )
}

// Вікно знизу «Доступно в Премиум» (pr-lock*): що дає функція, пробна неделя, «Не сейчас».
export function LockSheet({ open, onClose, feature, onTry }: { open: boolean; onClose: () => void; feature: keyof typeof LOCKS; onTry: () => void }) {
  const { trialUsed } = usePlan()
  const f = LOCKS[feature]
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Доступно в Премиум"
      aside={<Pennant className="size-6 text-primary" />}
      footer={
        <>
          <Button size="lg" onClick={onTry}>
            {trialUsed ? 'Подключить премиум' : 'Попробовать неделю бесплатно'}
          </Button>
          <Button size="lg" variant="ghost" className="text-primary" onClick={onClose}>
            Не сейчас
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">{f.title}</h3>
        <p className="text-[15px] leading-relaxed text-muted-foreground">{f.text}</p>
        {!trialUsed && (
          <p className="mt-2 text-sm text-muted-foreground">
            Первые <span className="font-mono">{TRIAL_DAYS}</span> дней бесплатно, отменить можно в любой момент.
          </p>
        )}
      </div>
    </BottomSheet>
  )
}

/* ---------- дрібне ---------- */

export const money = (n: number) => '$' + n.toLocaleString('ru-RU').replace(/ /g, ' ')

// Рядок «назва — значення» з тонкою лінією (як факти в p16).
export function FactRow({ label, children, mono }: { label: ReactNode; children: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-border py-3.5 first:border-t-0">
      <dt className="text-[15px] text-muted-foreground">{label}</dt>
      <dd className={cn('text-right text-[15px] font-medium', mono && 'font-mono')}>{children}</dd>
    </div>
  )
}

// Тихий заголовок розділу над блоком.
export function Section({ title, aside, children, className }: { title: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('mt-8 first:mt-0', className)}>
      <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** Кружок з ініціалами або знаком агентства. */
export function Initials({ children, square, className }: { children: ReactNode; square?: boolean; className?: string }) {
  return (
    <span className={cn('flex size-10 shrink-0 items-center justify-center bg-muted text-sm font-semibold', square ? 'rounded-md text-foreground' : 'rounded-full text-primary', className)}>
      {children}
    </span>
  )
}
