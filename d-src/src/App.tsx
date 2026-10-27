import { ControlPanel } from '@/components/control-panel'
import { PhoneFrame } from '@/components/phone-frame'
import { useRoute } from '@/lib/route'
import { SCREENS } from '@/screens/registry'

export function App() {
  const [route, setRoute] = useRoute(SCREENS[0].id)
  const def = SCREENS.find((s) => s.id === route.screen) ?? SCREENS[0]
  // Екрани додаються етапами: перехід на ще не зроблений екран нічого не робить.
  const go = (id: string) => SCREENS.some((s) => s.id === id) && setRoute((r) => ({ ...r, screen: id }))

  return (
    <div className="flex min-h-full flex-col md:h-full md:flex-row">
      <ControlPanel
        screen={def.id}
        theme={route.theme}
        onScreen={go}
        onTheme={(theme) => setRoute((r) => ({ ...r, theme }))}
      />
      <main className="flex flex-1 items-start justify-center overflow-auto bg-card p-6 max-[480px]:p-0">
        <PhoneFrame bleed={def.bleed}>
          <def.Component key={def.id} go={go} />
        </PhoneFrame>
      </main>
    </div>
  )
}
