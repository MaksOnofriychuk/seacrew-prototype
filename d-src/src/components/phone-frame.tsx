import type { ReactNode } from 'react'
import { BatteryFull, Signal, Wifi } from 'lucide-react'

// Рамка 390×844 (iPhone 15). Без тіней: межу телефона дає рамка кольору border.
// bleed — екран сам займає місце під рядком статусу (герой на всю висоту зверху).
export function PhoneFrame({ children, bleed = false }: { children: ReactNode; bleed?: boolean }) {
  return (
    <div className="relative flex h-[844px] w-[390px] shrink-0 flex-col overflow-hidden rounded-[48px] border border-border bg-background text-foreground max-[480px]:h-dvh max-[480px]:w-full max-[480px]:rounded-none max-[480px]:border-0">
      <div className="absolute inset-x-0 top-0 z-10 flex h-[50px] items-center justify-between px-8 pt-1 text-[15px] font-semibold">
        <span>9:41</span>
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <Signal className="size-4" />
          <Wifi className="size-4" />
          <BatteryFull className="size-5" />
        </span>
      </div>
      <div className={`flex min-h-0 flex-1 flex-col ${bleed ? '' : 'pt-[50px]'}`}>{children}</div>
      <div className="flex h-[30px] shrink-0 items-center justify-center" aria-hidden="true">
        <div className="h-[5px] w-[134px] rounded-full bg-foreground" />
      </div>
    </div>
  )
}
