import { useState, type ComponentType, type ReactNode } from 'react'
import { Bookmark, Clock, FileText, Files, Inbox, Lock, Mail, ShieldCheck, Ship } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { AvailabilityButton, AvailabilitySheet } from '@/components/app/availability'
import { ProfileFillLine } from '@/components/app/profile-fill'
import { useProto } from '@/lib/proto-state'
import { readiness } from '../q/_parts'
import { Avatar, useMe } from './_feed-parts'

// Бокове меню (C: drawerHtml), як у LinkedIn: хто ви, статус доступності, приглашения й анкеты,
// готовність до анкет, що скоро спливає, швидкий доступ; унизу — настройки.
// Відкривається з аватара на стрічці; панель з того боку, де аватар.

// Статус — спільні AvailabilityButton / AvailabilitySheet (правки №1, №15, №19, №20), як у профілі q09.

export function FeedDrawer({ open, onClose, go }: { open: boolean; onClose: () => void; go: (id: string) => void }) {
  const { showToast } = useProto()
  const me = useMe()
  const [availOpen, setAvailOpen] = useState(false)
  const r = readiness(false)

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" showCloseButton={false} onOpenAutoFocus={(e) => e.preventDefault()} className="w-[86%] max-w-none gap-0 overflow-y-auto px-6 pt-[58px] pb-5 sm:max-w-none">
        <Avatar size="lg">
          {me.initials}
        </Avatar>
        <SheetTitle className="mt-3 flex items-center gap-1.5 text-[22px] leading-tight font-semibold tracking-tight">
          {me.name}
          <ShieldCheck className="size-5 shrink-0 text-primary" aria-label="Документ моряка проверен" />
        </SheetTitle>
        <SheetDescription className="mt-1 text-[15px] text-foreground">3rd Engineer, Chemical Tanker</SheetDescription>
        <p className="text-sm text-muted-foreground">Гражданство: Украина</p>

        <AvailabilityButton onClick={() => setAvailOpen(true)} className="mt-4" />

        <div className="mt-4 flex gap-6 border-t border-border pt-4">
          <Count n={2} label="приглашения" onClick={() => go('p03')} />
          <Count n={1} label="анкета ждёт ответа" onClick={() => go('p03')} />
        </div>

        <ProfileFillLine pct={r.pct} onClick={() => go('q09')} className="mt-4" />

        <button type="button" onClick={() => go('p02')} className="mt-4 flex items-start gap-3 rounded-md bg-muted px-4 py-3 text-left text-sm">
          <Clock className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>
            <span className="font-medium">Скоро истекает:</span> медосмотр, через 20 дней
          </span>
        </button>

        <nav className="mt-4 flex flex-col border-t border-border pt-1">
          <Item icon={Files} label="Мои документы" count={3} onClick={() => go('p02')} />
          <Item icon={Ship} label="Морской стаж" onClick={() => go('s6')} />
          <Item icon={FileText} label="Моё CV, PDF" onClick={() => showToast('CV собрано из профиля (пример)')} />
          <Item icon={Inbox} label="Мои анкеты" count={1} onClick={() => go('p03')} />
          <Item icon={Mail} label="Приглашения агентств" count={2} onClick={() => go('p03')} />
          <Item icon={Bookmark} label="Сохранённое" onClick={() => go('p09')} />
        </nav>
        <div className="min-h-4 flex-1" />
        <div className="border-t border-border pt-1">
          <Item icon={Lock} label="Настройки и конфиденциальность" onClick={() => go('q10')} />
        </div>
      </SheetContent>
      <AvailabilitySheet open={availOpen} onClose={() => setAvailOpen(false)} />
    </Sheet>
  )
}

function Count({ n, label, onClick }: { n: number; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-baseline gap-1.5 text-left">
      <span className="font-mono text-xl font-medium text-primary">{n}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </button>
  )
}

function Item({ icon: Icon, label, count, onClick }: { icon: ComponentType<{ className?: string }>; label: ReactNode; count?: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-11 items-center gap-4 py-1.5 text-left">
      <Icon className="size-5 shrink-0 text-primary" />
      <span className="flex-1 text-[15px]">{label}</span>
      {count !== undefined && <span className="font-mono text-sm text-muted-foreground">{count}</span>}
    </button>
  )
}
