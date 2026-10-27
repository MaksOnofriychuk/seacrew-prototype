import type { ReactNode } from 'react'
import { BatteryFull, Signal, Wifi } from 'lucide-react'

// Рамка 390×844 (iPhone 15). Без тіней: межу телефона дає рамка кольору border.
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-[844px] w-[390px] shrink-0 flex-col overflow-hidden rounded-[48px] border border-border bg-background text-foreground max-[480px]:h-dvh max-[480px]:w-full max-[480px]:rounded-none max-[480px]:border-0">
      <div className="flex h-[50px] shrink-0 items-center justify-between px-8 pt-1 text-[15px] font-semibold">
        <span>9:41</span>
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <Signal className="size-4" />
          <Wifi className="size-4" />
          <BatteryFull className="size-5" />
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <div className="flex h-[30px] shrink-0 items-center justify-center" aria-hidden="true">
        <div className="h-[5px] w-[134px] rounded-full bg-foreground" />
      </div>
    </div>
  )
}
