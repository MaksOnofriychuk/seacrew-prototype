import { UserX } from 'lucide-react'
import { Wordmark } from '@/components/app/chrome'
import { Button } from '@/components/ui/button'
import { RECRUITERS } from '@/lib/data-web'
import type { ScreenProps } from '../types'

// r-no-org — рекрутера прибрали з організації (/no-organization у коді). Без оболонки кабінету.
export function RNoOrg({ go }: ScreenProps) {
  const email = RECRUITERS[1].email
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-16 shrink-0 items-center gap-2 px-12">
        <Wordmark />
        <span className="text-sm text-muted-foreground">для агентств</span>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="flex w-full max-w-[480px] flex-col gap-6">
          <span className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-primary">
            <UserX className="size-5" />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight">Вы не состоите ни в одной организации</h1>
            <p className="text-[15px] text-muted-foreground">
              Аккаунт <span className="text-foreground">{email}</span> больше не привязан к кадровой организации. Попросите владельца вашей организации снова добавить вас, а затем войдите.
            </p>
          </div>
          <Button variant="outline" className="h-10 self-start text-primary" onClick={() => go('r-login')}>
            Выйти
          </Button>
        </div>
      </div>
    </div>
  )
}
