import type { ComponentType } from 'react'
import { Camera, FolderOpen, Image, PenLine, ScanLine } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'

export type SourceItem = {
  icon: ComponentType<{ className?: string }>
  title: string
  sub?: string
  onClick: () => void
}

// Единое окно выбора источника: сгруппированный список в рамке, иконка слева, подпись серым.
// Без «Отмена»: закрывается тапом вне окна или свайпом. Наборы пунктов — фабрики ниже.
export function SourceSheet({
  open,
  onClose,
  title,
  description,
  items,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  items: SourceItem[]
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} description={description}>
      <ul className="overflow-hidden rounded-xl border border-border">
        {items.map((it) => (
          <li key={it.title} className="border-t border-border first:border-t-0">
            <button type="button" onClick={it.onClick} className="flex min-h-16 w-full items-center gap-3.5 px-4 py-3 text-left transition-colors active:bg-muted">
              <it.icon className="size-5 shrink-0 text-primary" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] leading-snug">{it.title}</span>
                {it.sub && <span className="text-sm leading-snug text-muted-foreground">{it.sub}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  )
}

type Opt = { title?: string; sub?: string }
const make = (icon: SourceItem['icon'], def: string, defSub?: string) => (onClick: () => void, o: Opt = {}): SourceItem => ({
  icon,
  title: o.title ?? def,
  sub: 'sub' in o ? o.sub : defSub,
  onClick,
})

// Типовые пункты — як у вікні документа швидкої реєстрації (зразок Макса, №13): назва і підпис.
// Порядок у вікні: сканувати, сфотографувати, файл, галерея, вручну. Текст можна уточнити ({ sub: 'PDF или Word' }).
export const srcScan = make(ScanLine, 'Сканировать документ')
export const srcCamera = make(Camera, 'Сфотографировать', 'При хорошем свете, без бликов')
export const srcFile = make(FolderOpen, 'Выбрать файл', 'PDF или изображение')
export const srcGallery = make(Image, 'Выбрать из галереи')
export const srcManual = make(PenLine, 'Ввести вручную', 'Если нет фото или файла')

// Повний набір для документа (і вручну, якщо треба).
export const docSources = (onPick: () => void, onManual?: () => void) => [
  srcScan(onPick),
  srcCamera(onPick),
  srcFile(onPick),
  srcGallery(onPick),
  ...(onManual ? [srcManual(onManual)] : []),
]
