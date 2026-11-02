import { useState, type ComponentType, type ReactNode } from 'react'
import { Anchor, ChevronRight, FileText, Files, LifeBuoy, LogOut, Moon, Settings, ShieldCheck, TriangleAlert, UserRound } from 'lucide-react'
import { AvailabilityButton, AvailabilitySheet } from '@/components/app/availability'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { ProfileFillLine } from '@/components/app/profile-fill'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { MOBILE_ROUTES } from '@/lib/mobile-routes'
import { useProto } from '@/lib/proto-state'
import { readiness, useQ } from '../q/_parts'
import type { Acct } from '../q/q06'
import { Avatar, useMe } from '../p/_feed-parts'
import { daysLeft, useDocs } from '../dp/_docs'
import { plural } from '../p/_app-parts'
import { setTheme, useDark } from './_parts'

// Бокове меню (p04; ТЗ §6 — як у LinkedIn, панель зліва; відповідь 125): інформація профілю, документи, що скоро
// закінчуються (нагадування за 180 / 90 / 30 днів — відповідь 71), швидкий доступ «Мои документы», «Опыт работы»,
// «Моё CV · PDF»; далі «Настройки», «Поддержка», перемикач теми, «Выйти». «Уведомления» і «Входящие» тут більше
// немає — вони в дзвіночку й вкладці «Сообщения» (правка №16). Удаление аккаунта — у налаштуваннях.
// Підключено замість старого FeedDrawer (screens/p/_feed-drawer.tsx тепер реекспортує цей компонент).

export function SideMenu({ open, onClose, go }: { open: boolean; onClose: () => void; go: (id: string) => void }) {
  const me = useMe()
  const { setBag } = useProto()
  const dark = useDark()
  const [availOpen, setAvailOpen] = useState(false)
  const [logout, setLogout] = useState(false)
  const r = readiness(false)
  const { docs } = useDocs()
  // скоро закінчуються: перше нагадування — за 180 днів (відповідь 71); найближчі — першими
  const soon = docs
    .map((d) => ({ d, n: d.exp ? daysLeft(d.exp) : null }))
    .filter((x): x is { d: typeof x.d; n: number } => x.n !== null && x.n <= 180)
    .sort((a, b) => a.n - b.n)
    .slice(0, 2)
  const openDoc = (id: string) => {
    setBag('doc.sel', id)
    go('p11')
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" showCloseButton={false} onOpenAutoFocus={(e) => e.preventDefault()} className="w-[86%] max-w-none gap-0 overflow-y-auto px-6 pt-[58px] pb-5 sm:max-w-none">
        {/* інформація профілю */}
        <button type="button" onClick={() => go(MOBILE_ROUTES.profile)} className="flex flex-col items-start text-left">
          <Avatar size="lg">{me.initials}</Avatar>
          <SheetTitle className="mt-3 flex items-center gap-1.5 text-[22px] leading-tight font-semibold tracking-tight">
            {me.name}
            <ShieldCheck className="size-5 shrink-0 text-primary" aria-label="Документ моряка проверен" />
          </SheetTitle>
          <SheetDescription className="mt-1 text-[15px] text-foreground">3rd Engineer, Chemical Tanker</SheetDescription>
          <span className="text-sm text-muted-foreground">Гражданство: Украина</span>
        </button>

        <AvailabilityButton onClick={() => setAvailOpen(true)} className="mt-4" />
        <ProfileFillLine pct={r.pct} onClick={() => go(MOBILE_ROUTES.profile)} className="mt-4" />

        {soon.length > 0 && (
          <section aria-label="Скоро истекают" className="mt-5 flex flex-col gap-1 rounded-md bg-card px-3 py-2">
            {soon.map(({ d, n }) => (
              <button key={d.id} type="button" onClick={() => openDoc(d.id)} className="flex min-h-10 items-center gap-3 text-left">
                <TriangleAlert className={n < 0 ? 'size-4 shrink-0 text-signal' : 'size-4 shrink-0 text-warning'} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px]">{d.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {n < 0 ? (
                      'Срок истёк'
                    ) : (
                      <>
                        Истекает через <span className="font-mono">{n}</span> {plural(n, 'день', 'дня', 'дней')}
                      </>
                    )}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </section>
        )}

        <nav className="mt-5 flex flex-col border-t border-border pt-1">
          <Item icon={UserRound} label="Профиль" onClick={() => go(MOBILE_ROUTES.profile)} />
          <Item icon={Files} label="Мои документы" onClick={() => go(MOBILE_ROUTES.docs)} />
          <Item icon={Anchor} label="Опыт работы" onClick={() => go('p22')} />
          <Item icon={FileText} label="Моё CV · PDF" onClick={() => go('p20')} />
        </nav>
        <nav className="mt-1 flex flex-col border-t border-border pt-1">
          <Item icon={Settings} label="Настройки" onClick={() => go('m-settings')} />
          <Item
            icon={LifeBuoy}
            label="Поддержка"
            onClick={() => {
              setBag('back.m-support', 'p04')
              go('m-support')
            }}
          />
          <label className="flex min-h-11 cursor-pointer items-center gap-4 py-1.5">
            <Moon className="size-5 shrink-0 text-primary" />
            <span className="flex-1 text-[15px]">Тёмная тема</span>
            <Switch checked={dark} onCheckedChange={(v) => setTheme(v)} aria-label="Тёмная тема" />
          </label>
        </nav>
        <div className="min-h-4 flex-1" />
        <div className="border-t border-border pt-1">
          <Item icon={LogOut} label="Выйти" onClick={() => setLogout(true)} />
        </div>
      </SheetContent>
      <AvailabilitySheet open={availOpen} onClose={() => setAvailOpen(false)} />
      <LogoutSheet open={logout} onClose={() => setLogout(false)} onConfirm={() => go(MOBILE_ROUTES.login)} />
    </Sheet>
  )
}

function Item({ icon: Icon, label, onClick }: { icon: ComponentType<{ className?: string }>; label: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-11 items-center gap-4 py-1.5 text-left">
      <Icon className="size-5 shrink-0 text-primary" />
      <span className="flex-1 text-[15px]">{label}</span>
    </button>
  )
}

// Підтвердження виходу — спільне для меню й налаштувань.
export function LogoutSheet({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  const email = useQ().bag<Acct | null>('q.acct', null)?.email || 'you@example.com'
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Выйти из аккаунта?"
      description="Профиль и документы сохранятся. Чтобы вернуться, войдите по email или через Google и Apple."
      footer={
        <>
          <Button size="lg" variant="destructive" onClick={onConfirm}>
            Выйти
          </Button>
          <Button size="lg" variant="ghost" className="text-primary" onClick={onClose}>
            Остаться
          </Button>
        </>
      }
    >
      <p className="text-[15px] text-muted-foreground">
        Вы вошли как <span className="text-foreground">{email}</span>
      </p>
    </BottomSheet>
  )
}
