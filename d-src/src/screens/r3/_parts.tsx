import { useMemo, type ReactNode } from 'react'
import { Smartphone } from 'lucide-react'
import { Wordmark } from '@/components/app/chrome'
import { Button } from '@/components/ui/button'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { WebDialog } from '../r1/_parts'

// Спільне для екранів «Веб, частина 3»: публічні сторінки (без кабінету), позначка «пример»,
// кнопки магазинів застосунків, QR-код, вікно «Скачайте приложение». Ключі bag — з префіксом 'r3.'.

export type Go = (id: string) => void

/** «2026-11-14» → «14.11.2026» */
export const ruDate = (iso: string) => (iso ? iso.split('-').reverse().join('.') : '')

/** €1 234 */
export const eur = (n: number) => `€${n.toLocaleString('ru-RU').replace(/ /g, ' ')}`

// Позначка для того, на що замовник ще не відповів (відп. 139–141, 160, 161): тихо, пунктиром.
export function ExampleMark({ className, children = 'пример' }: { className?: string; children?: ReactNode }) {
  return (
    <span className={cn('inline-flex h-5 shrink-0 items-center rounded-sm border border-dashed border-warning/70 px-1.5 text-xs font-normal tracking-normal text-warning', className)}>
      {children}
    </span>
  )
}

/* ---------- публічні сторінки ---------- */

// Звичайна веб-сторінка без кабінету: шапка з «Seafolio», вміст, тихий низ.
export function PublicLayout({ go, onGetApp, here, children }: { go: Go; onGetApp: () => void; /** id этой страницы: «Назад» из текстов вернёт сюда */ here?: string; children: ReactNode }) {
  const { setBag } = useProto()
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-8 border-b border-border bg-surface px-10">
        <button type="button" onClick={() => go('pub-landing')} className="flex items-center" aria-label="Seafolio, на главную">
          <Wordmark />
        </button>
        <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground" aria-label="Разделы сайта">
          <button type="button" onClick={() => go('pub-job')} className="hover:text-foreground">
            Вакансии
          </button>
          <button type="button" onClick={() => go('r-login')} className="hover:text-foreground">
            Для агентств
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" className="h-10 text-primary" onClick={() => go('r-login')}>
            Войти в кабинет
          </Button>
          <Button className="h-10" onClick={onGetApp}>
            <Smartphone /> Скачать приложение
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-[1120px] items-center gap-6 px-10 py-6 text-sm text-muted-foreground">
            <span>
              © <span className="font-mono">2026</span> Seafolio
            </span>
            {(
              [
                ['terms', 'Условия сервиса'],
                ['privacy', 'Конфиденциальность'],
                ['support', 'Поддержка'],
              ] as const
            ).map(([id, t]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setBag('legal.web', id)
                  setBag('back.pub-legal', here ?? 'pub-landing')
                  go('pub-legal')
                }}
                className="hover:text-foreground"
              >
                {t}
              </button>
            ))}
          </div>
        </footer>
      </div>
    </div>
  )
}

// Кнопки магазинів — без логотипів брендів, лише підписи.
export function StoreButtons({ className, vertical = false }: { className?: string; vertical?: boolean }) {
  const { showToast } = useProto()
  const items = [
    { store: 'App Store', caption: 'Загрузите в' },
    { store: 'Google Play', caption: 'Доступно в' },
  ]
  return (
    <div className={cn('flex gap-3', vertical && 'flex-col', className)}>
      {items.map((i) => (
        <button
          key={i.store}
          type="button"
          onClick={() => showToast(`Откроется ${i.store}`)}
          className="flex h-12 w-[168px] flex-col items-start justify-center rounded-lg bg-foreground px-4 text-left text-background transition-transform active:scale-[0.98] motion-reduce:transition-none"
        >
          <span className="text-[11px] leading-none opacity-80">{i.caption}</span>
          <span className="mt-0.5 text-base leading-tight font-semibold">{i.store}</span>
        </button>
      ))}
    </div>
  )
}

// Умовний QR-код: стабільний візерунок із трьома «очима». Білий фон завжди — щоб камера читала і в темній темі.
export function QrCode({ seed, size = 132, className }: { seed: string; size?: number; className?: string }) {
  const N = 25
  const cells = useMemo(() => {
    let h = 2166136261
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
    const rnd = () => {
      h ^= h << 13
      h ^= h >>> 17
      h ^= h << 5
      return (h >>> 0) / 4294967296
    }
    const eye = (x: number, y: number) => (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8)
    const out: [number, number][] = []
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!eye(x, y) && rnd() > 0.52) out.push([x, y])
    return out
  }, [seed])
  const Eye = ({ x, y }: { x: number; y: number }) => (
    <>
      <rect x={x} y={y} width={7} height={7} fill="#0B1220" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#FFFFFF" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#0B1220" />
    </>
  )
  return (
    <span className={cn('inline-flex shrink-0 rounded-lg border border-border bg-white p-2.5', className)}>
      <svg viewBox={`0 0 ${N} ${N}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label="QR-код со ссылкой на приложение">
        {cells.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#0B1220" />
        ))}
        <Eye x={0} y={0} />
        <Eye x={N - 7} y={0} />
        <Eye x={0} y={N - 7} />
      </svg>
    </span>
  )
}

// «Скачайте приложение»: QR для телефону поруч і кнопки магазинів (відп. 102: «Откликнуться» пропонує завантажити застосунок).
export function GetAppDialog({ open, onClose, title, text, seed }: { open: boolean; onClose: () => void; title: string; text: ReactNode; seed: string }) {
  const { showToast } = useProto()
  return (
    <WebDialog open={open} onClose={onClose} title={title} description={text} className="w-[560px]">
      <div className="flex items-center gap-6">
        <QrCode seed={seed} size={148} />
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Наведите камеру телефона на код или скачайте приложение из магазина.</p>
          <StoreButtons vertical />
        </div>
      </div>
      <p className="border-t border-border pt-4 text-sm text-muted-foreground">
        Приложение уже установлено?{' '}
        <button
          type="button"
          onClick={() => {
            onClose()
            showToast('Откроется приложение Seafolio')
          }}
          className="font-medium text-primary hover:underline"
        >
          Открыть в приложении
        </button>
      </p>
    </WebDialog>
  )
}
