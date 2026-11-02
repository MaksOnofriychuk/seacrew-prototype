import { useState, type ReactNode } from 'react'
import { BellRing, Check, Lock, MessageSquare, Zap } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { Paper } from '@/components/app/paper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { FJ_JOBS } from '@/lib/data-feed-jobs'
import type { Plan } from '@/lib/data-premium'
import type { ScreenProps } from '../types'
import { SettingsGroup, SettingsRow } from '../m/_parts'
import { LockSheet, LockTag, useBack, useOpenPaywall, usePlan, usePr } from './_parts'

// pr-lock* — приклади замка на платній функції: вікно знизу «Доступно в Премиум».
// pr-lock — заповнення анкети з профілю (відповідь 117: «пока для всех, потом — для премиумов»);
// pr-lock-searches — понад 3 підборки (103); pr-lock-compare — порівняння вакансій (96);
// pr-lock-alerts — сповіщення про підходящу вакансію одразу (107).
// Вікно відкрите одразу; закрив — видно замок біля дії, тап знову відкриває вікно.
// З премиумом (після пробної неділі в paywall) дія просто працює.

type Feature = 'autofill' | 'searches' | 'compare' | 'alerts'

function useLock(go: ScreenProps['go'], id: string) {
  const { plan } = usePlan({ kind: 'free', until: '' } as Plan)
  const [open, setOpen] = useState(plan.kind !== 'trial' && plan.kind !== 'active')
  const paywall = useOpenPaywall(go, id)
  const premium = plan.kind === 'trial' || plan.kind === 'active'
  return { open, setOpen, premium, paywall }
}

function LockShell({ title, back, feature, lock, footer, children }: { title: string; back: () => void; feature: Feature; lock: ReturnType<typeof useLock>; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative flex h-full flex-col">
      <NavBar title={title} onBack={back} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-6">{children}</div>
      {footer}
      <LockSheet open={lock.open} onClose={() => lock.setOpen(false)} feature={feature} onTry={lock.paywall} />
    </div>
  )
}

/* ---------- анкета: заполнить из профиля ---------- */

export function PrLock({ go }: ScreenProps) {
  const lock = useLock(go, 'pr-lock')
  const { showToast } = usePr()
  const back = useBack('pr-lock', 'm-chat')
  const fields = ['Фамилия и имя', 'Дата рождения', 'Документ моряка, номер', 'Последнее судно', 'Английский']
  return (
    <LockShell
      title="Анкета"
      back={() => go(back)}
      feature="autofill"
      lock={lock}
      footer={
        <Footer className="border-t border-border bg-background">
          <Button size="lg" onClick={() => (lock.premium ? (showToast('Анкета заполнена из профиля'), go('m-form')) : lock.setOpen(true))}>
            {lock.premium ? <Zap /> : <Lock />} Заполнить из профиля
          </Button>
          <p className="text-center text-sm text-muted-foreground">{lock.premium ? 'Вы проверите каждое поле перед отправкой' : 'Можно заполнить вручную — бесплатно'}</p>
        </Footer>
      }
    >
      <div className="flex flex-col gap-1 px-2">
        <span className="text-[15px] font-semibold">BlueWave Crewing</span>
        <p className="text-sm text-muted-foreground">
          Для вакансии {FJ_JOBS[0].t}, {FJ_JOBS[0].ship}. Заполнить до <span className="font-mono">08.11.2026</span>
        </p>
      </div>
      <Paper title="Анкета BlueWave Crewing" className="mt-4">
        <div className="flex flex-col gap-4">
          {fields.map((f) => (
            <label key={f} className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{f}</span>
              <input className="h-11 rounded-md border border-input bg-surface px-3 text-base outline-none focus:border-primary" aria-label={f} />
            </label>
          ))}
        </div>
      </Paper>
    </LockShell>
  )
}

/* ---------- больше 3 подборок ---------- */

const SEARCH_NAMES = ['3rd Engineer, Chemical Tanker', '3rd Engineer, Container Ship', '2nd Engineer, Bulk Carrier']

export function PrLockSearches({ go }: ScreenProps) {
  const lock = useLock(go, 'pr-lock-searches')
  const back = useBack('pr-lock-searches', 'p05')
  return (
    <LockShell title="Новая подборка" back={() => go(back)} feature="searches" lock={lock}>
      <p className="px-2 text-[15px] text-muted-foreground">
        Сохранено <span className="font-mono">3</span> из <span className="font-mono">3</span> бесплатных подборок.
      </p>
      <ul className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
        {SEARCH_NAMES.map((n) => (
          <li key={n} className="flex items-center gap-3 border-t border-border px-5 py-4 first:border-t-0">
            <BellRing className="size-5 shrink-0 text-primary" />
            <span className="flex-1 text-[15px] font-medium">{n}</span>
          </li>
        ))}
        <li className="border-t border-border">
          <button type="button" onClick={() => (lock.premium ? go('p17') : lock.setOpen(true))} className="flex w-full items-center gap-3 px-5 py-4 text-left">
            <span className="flex-1 text-[15px] font-medium text-primary">4th Engineer, Oil Tanker</span>
            {lock.premium ? <span className="text-sm text-muted-foreground">сохранить</span> : <LockTag />}
          </button>
        </li>
      </ul>
      <p className="mt-3 px-2 text-sm text-muted-foreground">Удалите одну из подборок — и новую можно будет сохранить бесплатно.</p>
    </LockShell>
  )
}

/* ---------- сравнение вакансий ---------- */

export function PrLockCompare({ go }: ScreenProps) {
  const lock = useLock(go, 'pr-lock-compare')
  const { setBag } = usePr()
  const back = useBack('pr-lock-compare', 'p09')
  const [picked, setPicked] = useState<number[]>([0, 4])
  const list = [0, 1, 4, 5]
  const toggle = (k: number) => setPicked(picked.includes(k) ? picked.filter((x) => x !== k) : picked.length < 3 ? [...picked, k] : picked)
  const compare = () => {
    if (!lock.premium) return lock.setOpen(true)
    setBag('pr.compare', picked)
    setBag('back.pr-compare', 'pr-lock-compare')
    go('pr-compare')
  }
  return (
    <LockShell
      title="Выберите вакансии"
      back={() => go(back)}
      feature="compare"
      lock={lock}
      footer={
        <Footer className="border-t border-border bg-background">
          <Button size="lg" disabled={picked.length < 2} onClick={compare}>
            {!lock.premium && <Lock />} Сравнить <span className="font-mono">{picked.length}</span> вакансии
          </Button>
        </Footer>
      }
    >
      <p className="px-2 text-[15px] text-muted-foreground">Из сохранённых, до трёх сразу.</p>
      <ul className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
        {list.map((k) => {
          const j = FJ_JOBS[k]
          const on = picked.includes(k)
          return (
            <li key={k} className="border-t border-border first:border-t-0">
              <label className="flex cursor-pointer items-center gap-4 px-5 py-4">
                <Checkbox checked={on} onCheckedChange={() => toggle(k)} aria-label={`${j.t}, ${j.co}`} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[17px] font-semibold">{j.t}</span>
                  <span className="text-[15px] font-semibold text-primary">{j.sal}</span>
                  <span className="text-sm text-muted-foreground">
                    {j.ship}, {j.co}
                  </span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </LockShell>
  )
}

/* ---------- подходящие вакансии сразу ---------- */

export function PrLockAlerts({ go }: ScreenProps) {
  const lock = useLock(go, 'pr-lock-alerts')
  const { bag, setBag, showToast } = usePr()
  const back = useBack('pr-lock-alerts', 'm-notif-settings')
  const on = bag<boolean>('pr.instantAlerts', false)
  return (
    <LockShell title="Уведомления о вакансиях" back={() => go(back)} feature="alerts" lock={lock}>
      <SettingsGroup title="Приходят всем сразу">
        <SettingsRow icon={MessageSquare} title="Сообщения и предложения рекрутеров" right={<Check className="size-5 text-success" strokeWidth={2.25} />} />
        <SettingsRow icon={BellRing} title="Новые вакансии по подборкам" sub="Раз в день или при обновлении" right={<Switch checked aria-label="Новые вакансии по подборкам" onCheckedChange={() => showToast('Настраивается в подборках')} />} />
      </SettingsGroup>
      <SettingsGroup title="Премиум" note="Пришлём, как только агентство опубликует вакансию под вашу должность и тип судна.">
        <SettingsRow
          icon={Zap}
          title="Подходящие вакансии сразу"
          onClick={lock.premium ? undefined : () => lock.setOpen(true)}
          right={
            lock.premium ? (
              <Switch
                checked={on}
                aria-label="Подходящие вакансии сразу"
                onCheckedChange={(v) => {
                  setBag('pr.instantAlerts', v)
                  showToast(v ? 'Включено' : 'Выключено')
                }}
              />
            ) : (
              <LockTag />
            )
          }
        />
      </SettingsGroup>
    </LockShell>
  )
}
