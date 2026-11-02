import { CircleArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../registry'
import { ErrorLayout } from './_error-layout'

// e09 — «Обновите приложение» (ADR-085): версія застосунку нижча за мінімальну на сервері (API → 426).
// Замість «неизвестной ошибки» — цей екран; назад і хрестика немає, лише «Обновить» (App Store / TestFlight).
// Версії вигадані.
const VERSIONS = [
  { label: 'У вас', num: '1.0.2', note: '' },
  { label: 'Нужна', num: '1.2.0', note: 'или новее' },
]

export function E09Update(_: ScreenProps) {
  const { showToast } = useProto()
  return (
    <ErrorLayout
      low
      brand
      icon={CircleArrowUp}
      tone="primary"
      title="Обновите приложение"
      text="Эта версия Seafolio больше не поддерживается. Обновите приложение, чтобы продолжить."
      actions={
        <Button size="lg" onClick={() => showToast('Открываем App Store')}>
          Обновить
        </Button>
      }
    >
      <dl className="mt-8 flex flex-col border-t border-border">
        {VERSIONS.map((x) => (
          <div key={x.label} className="flex items-baseline justify-between gap-4 border-b border-border py-3">
            <dt className="text-[15px] text-muted-foreground">{x.label}</dt>
            <dd className="text-[15px]">
              <span className="font-mono">{x.num}</span>
              {x.note && <span className="text-muted-foreground"> {x.note}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </ErrorLayout>
  )
}
