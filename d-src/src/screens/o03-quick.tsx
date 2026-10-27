import { Clock, FileText, IdCard, Mail } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { Group } from '@/components/app/group'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from './registry'

// o03 — що приготувати для швидкого шляху (тексти з C, oPath('q')).
const ITEMS = [
  { icon: FileText, title: 'CV', text: 'PDF, Word, фото или скан' },
  { icon: IdCard, title: 'Удостоверение или диплом моряка', text: 'Один документ на выбор' },
  { icon: Mail, title: 'Доступ к почте', text: 'Пришлём код подтверждения' },
]

export function O03Quick({ go }: ScreenProps) {
  return (
    <div className="flex h-full flex-col">
      <NavBar onBack={() => go('o02')} />
      <div className="flex flex-1 flex-col px-6 pt-2">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Быстрая регистрация</h1>
        <p className="mt-3 text-base text-muted-foreground">Приготовьте файлы — и аккаунт готов за пару минут.</p>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4 text-primary" /> ≈ 1–2 минуты
        </p>

        <Group title="Что понадобится" className="mt-8">
          <ul className="-my-1">
            {ITEMS.map((x) => (
              <li key={x.title} className="flex items-start gap-4 border-t border-border py-5 first:border-t-0 first:pt-2">
                <x.icon className="mt-0.5 size-6 shrink-0 text-primary" strokeWidth={1.75} />
                <span className="flex flex-col gap-1">
                  <span className="text-[17px] font-medium">{x.title}</span>
                  <span className="text-sm text-muted-foreground">{x.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </Group>
      </div>
      <Footer>
        <Button size="lg" onClick={() => go('q02')}>
          Продолжить
        </Button>
      </Footer>
    </div>
  )
}
