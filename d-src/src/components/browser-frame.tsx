import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Lock, RotateCw } from 'lucide-react'
import { FrameKindContext } from '@/lib/frame'
import { PhonePortalContext } from '@/lib/phone-portal'

const W = 1440
const H = 900
const BAR = 44
/** менше не зменшуємо — далі горизонтальний скрол */
const MIN_SCALE = 0.5

// Вікно браузера 1440×900 з рядком адреси (crew.app/…). Без тіней: межу дає рамка кольору border.
// Масштабується, щоб влізти в область; на вузькому екрані — не менше 50 % і горизонтальний скрол.
// Вікна (Sheet) відкриваються всередині вікна браузера, як і в телефоні.
export function BrowserFrame({ children, path }: { children: ReactNode; path: string }) {
  const outer = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [el, setEl] = useState<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const box = outer.current?.parentElement
    if (!box) return
    const fit = () => {
      const cs = getComputedStyle(box)
      const w = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const h = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      const s = Math.min(1, w / W, h > 200 ? h / (H + BAR) : 1)
      setScale(Math.max(MIN_SCALE, Math.floor(s * 1000) / 1000))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={outer} className="relative shrink-0" style={{ width: W * scale, height: (H + BAR) * scale }}>
      <div
        className="absolute top-0 left-0 flex origin-top-left flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground"
        style={{ width: W, height: H + BAR, transform: `scale(${scale})` }}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4" style={{ height: BAR }} aria-hidden="true">
          <span className="flex gap-1.5">
            <span className="size-3 rounded-full bg-border" />
            <span className="size-3 rounded-full bg-border" />
            <span className="size-3 rounded-full bg-border" />
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <ChevronLeft className="size-4" />
            <ChevronRight className="size-4" />
            <RotateCw className="ml-1 size-3.5" />
          </span>
          <span className="flex h-7 w-[560px] items-center gap-2 rounded-md bg-muted px-3 text-[13px] text-muted-foreground">
            <Lock className="size-3" />
            <span className="truncate">
              <span className="text-foreground">crew.app</span>
              {path}
            </span>
          </span>
        </div>
        <FrameKindContext.Provider value="web">
          <PhonePortalContext.Provider value={el}>
            <div ref={setEl} className="relative flex min-h-0 flex-1 flex-col">
              {children}
            </div>
          </PhonePortalContext.Provider>
        </FrameKindContext.Provider>
      </div>
    </div>
  )
}
