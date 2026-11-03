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
            <button type="button" onClick={it.onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-muted">
              <it.icon className="size-5 shrink-0 text-primary" />
              <span className="flex flex-1 flex-col">
                <span className="text-[15px]">{it.title}</span>
                {it.sub && <span className="text-sm text-muted-foreground">{it.sub}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  )
}

type Opt = { title?: string; sub?: string }
const make = (icon: SourceItem['icon'], def: string) => (onClick: () => void, o: Opt = {}): SourceItem => ({ icon, title: o.title ?? def, sub: o.sub, onClick })

// Типовые пункты: тексты можно уточнить ({ title: 'Сфотографировать страницу с визой' }).
export const srcCamera = make(Camera, 'Сфотографировать')
export const srcScan = make(ScanLine, 'Сканировать документ')
export const srcFile = make(FolderOpen, 'Загрузить файл')
export const srcGallery = make(Image, 'Выбрать из галереи')
export const srcManual = make(PenLine, 'Ввести вручную')
