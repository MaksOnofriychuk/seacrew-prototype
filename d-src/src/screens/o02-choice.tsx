import { useState } from 'react'
import { ChevronRight, Eye, ListChecks, Lock, Zap } from 'lucide-react'
import { Wordmark } from '@/components/app/chrome'
import { HeroPanel } from '@/components/app/hero-panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { ScreenProps } from './registry'

// o02 — вибір способу. Тексти й порядок — з вкладки C: «Пошагово» рекомендований і перший.
export function O02Choice({ go }: ScreenProps) {
  const [login, setLogin] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <HeroPanel className="h-[300px]">
        <div className="relative px-6 pt-[58px]">
          <Wordmark />
        </div>
        <h1 className="relative mt-auto px-6 pb-4 text-[36px] leading-[1.1] font-semibold tracking-tight text-balance">
          Ваша морская карьера в одном приложении
        </h1>
      </HeroPanel>

      <div className="flex flex-1 flex-col px-6 pt-6">
        <h2 className="text-base font-semibold">Выберите способ</h2>
        <div className="mt-3 flex flex-col gap-3">
          <Option
            strong
            icon={ListChecks}
            title="Пошагово"
            tag={<Badge variant="outline" className="border-primary text-primary">рекомендуем</Badge>}
            text="Весь профиль по шагам, можно с перерывами"
            onClick={() => go('o04')}
          />
          <Option
            icon={Zap}
            title="Быстро"
            tag={<span className="text-sm text-muted-foreground">≈ 1 минута</span>}
            text="CV и документ моряка — остальное потом"
            onClick={() => go('o03')}
          />
          <Option plain icon={Eye} title="Посмотреть без регистрации" text="Лента и вакансии — как гость" onClick={() => go('g01')} />
        </div>

        <div className="mt-auto flex flex-col items-center gap-2 pb-4 text-center">
          <p className="text-[15px] text-muted-foreground">
            Уже есть аккаунт?{' '}
            <button type="button" className="font-semibold text-primary" onClick={() => setLogin(true)}>
              Войти
            </button>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5 text-primary" /> Бесплатно, документы шифруются
          </p>
        </div>
      </div>

      <Sheet open={login} onOpenChange={setLogin}>
        <SheetContent side="bottom" showCloseButton={false} className="gap-0 px-6 pt-6 pb-8">
          <SheetTitle className="text-2xl font-semibold tracking-tight">Вход</SheetTitle>
          <div className="mt-5 flex flex-col gap-2">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" placeholder="you@example.com" className="h-12" />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Label htmlFor="login-pass">Пароль</Label>
            <Input id="login-pass" type="password" className="h-12" />
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Button size="lg" onClick={() => setLogin(false)}>
              Войти
            </Button>
            <Button size="lg" variant="ghost" className="text-primary">
              Восстановить пароль
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Option(p: {
  icon: typeof Eye
  title: string
  text: string
  tag?: React.ReactNode
  strong?: boolean
  plain?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={p.onClick}
      className={cn(
        'flex w-full items-center gap-4 rounded-xl px-5 py-4 text-left transition-colors active:scale-[0.99]',
        p.strong && 'border-2 border-primary bg-surface',
        !p.strong && !p.plain && 'bg-surface',
        p.plain && 'px-1 py-2',
      )}
    >
      <p.icon className={cn('size-6 shrink-0', p.strong ? 'text-primary' : 'text-muted-foreground')} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[17px] font-semibold">{p.title}</span>
          {p.tag}
        </span>
        <span className="text-sm text-muted-foreground">{p.text}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </button>
  )
}
