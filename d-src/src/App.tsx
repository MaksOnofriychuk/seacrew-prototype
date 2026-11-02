import { useEffect } from 'react'
import { LayoutTemplate } from 'lucide-react'
import { BrowserFrame } from '@/components/browser-frame'
import { ControlPanel } from '@/components/control-panel'
import { PhoneFrame } from '@/components/phone-frame'
import { ProtoProvider, ToastHost } from '@/lib/proto-state'
import { useRoute } from '@/lib/route'
import { PLATFORMS, SCREENS, screensFor, type Platform } from '@/screens/registry'

export function App() {
  const [route, setRoute] = useRoute()
  // Платформа — від екрана; невідомий екран → перший екран платформи з адреси (або порожня платформа).
  const found = SCREENS.find((s) => s.id === route.screen)
  const platform: Platform = found?.platform ?? route.platform
  const def = found ?? screensFor(platform)[0]
  const screenId = def?.id ?? ''

  useEffect(() => {
    if (route.screen !== screenId || route.platform !== platform) setRoute((r) => ({ ...r, screen: screenId, platform }))
  }, [route.screen, route.platform, screenId, platform, setRoute])

  // Перехід з екрана: лише на вже зроблений екран; стан екрана скидається на «Обычное».
  const go = (id: string) => {
    const to = SCREENS.find((s) => s.id === id)
    if (to) setRoute((r) => ({ ...r, screen: id, platform: to.platform, view: 'normal' }))
  }
  // З панелі: стан екрана лишається — так зручно гортати «Пусто» по екранах.
  const pick = (id: string) => {
    const to = SCREENS.find((s) => s.id === id)
    if (to) setRoute((r) => ({ ...r, screen: id, platform: to.platform }))
  }
  const pickPlatform = (p: Platform) => setRoute((r) => ({ ...r, platform: p, screen: screensFor(p)[0]?.id ?? '' }))

  const web = platform !== 'mobile'

  return (
    <ProtoProvider view={route.view} onView={(view) => setRoute((r) => ({ ...r, view }))}>
      <div className="flex min-h-full flex-col md:h-full md:flex-row">
        <ControlPanel
          platform={platform}
          screen={screenId}
          theme={route.theme}
          view={route.view}
          onPlatform={pickPlatform}
          onScreen={pick}
          onTheme={(theme) => setRoute((r) => ({ ...r, theme }))}
          onView={(view) => setRoute((r) => ({ ...r, view }))}
        />
        <main
          className={
            web
              ? 'flex min-w-0 flex-1 items-start justify-center-safe overflow-auto bg-card p-6 max-[480px]:p-3'
              : 'flex flex-1 items-start justify-center overflow-auto bg-card p-6 max-[480px]:p-0'
          }
        >
          {!def ? (
            <Placeholder platform={platform} />
          ) : web ? (
            <BrowserFrame path={def.path ?? '/' + def.id}>
              <def.Component key={def.id} go={go} />
              <ToastHost />
            </BrowserFrame>
          ) : (
            <PhoneFrame bleed={def.bleed}>
              <def.Component key={def.id} go={go} />
              <ToastHost />
            </PhoneFrame>
          )}
        </main>
      </div>
    </ProtoProvider>
  )
}

// Платформа без екранів: не падаємо, а кажемо, що екрани ще малюються.
function Placeholder({ platform }: { platform: Platform }) {
  const label = PLATFORMS.find((p) => p.id === platform)?.label
  return (
    <div className="mt-24 flex max-w-[360px] flex-col items-center gap-3 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-primary">
        <LayoutTemplate className="size-5" />
      </span>
      <h1 className="text-lg font-semibold">Экраны появятся позже</h1>
      <p className="text-[15px] text-muted-foreground">Платформа «{label}» ещё рисуется.</p>
    </div>
  )
}
