import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Share2, X } from 'lucide-react'
import { usePhonePortal } from '@/lib/phone-portal'
import { cn } from '@/lib/utils'

// Перегляд фото чи файлу на весь екран телефона (перевірка прототипу 03.11, №35): темний фон, зверху — закрити,
// назва й «Поделиться»; тап по фото — збільшити вдвічі / повернути. Підпис — унизу.
export function MediaViewer({
  open,
  onClose,
  title,
  caption,
  onShare,
  zoomable = true,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  caption?: string
  onShare?: () => void
  zoomable?: boolean
  children: ReactNode
}) {
  const phone = usePhonePortal()
  const [zoom, setZoom] = useState(false)
  if (!open || !phone) return null
  const close = () => {
    setZoom(false)
    onClose()
  }
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title ?? 'Просмотр'} className="absolute inset-0 z-50 flex flex-col bg-black text-white animate-in fade-in-0 duration-200 motion-reduce:animate-none">
      <div className="flex h-14 shrink-0 items-center gap-1 px-2 pt-[50px] box-content">
        <button type="button" onClick={close} aria-label="Закрыть" className="flex size-11 items-center justify-center rounded-full active:bg-white/10">
          <X className="size-6" />
        </button>
        <span className="min-w-0 flex-1 truncate text-center text-[15px] font-medium">{title}</span>
        {onShare ? (
          <button type="button" onClick={onShare} aria-label="Поделиться" className="flex size-11 items-center justify-center rounded-full active:bg-white/10">
            <Share2 className="size-5" />
          </button>
        ) : (
          <span className="size-11" />
        )}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto">
        <button
          type="button"
          aria-label={zoomable ? (zoom ? 'Уменьшить' : 'Увеличить') : undefined}
          disabled={!zoomable}
          onClick={() => setZoom(!zoom)}
          className={cn('w-full transition-transform duration-200 motion-reduce:transition-none', zoom ? 'scale-200 cursor-zoom-out' : zoomable && 'cursor-zoom-in')}
        >
          {children}
        </button>
      </div>
      {caption && <p className="shrink-0 px-6 pt-3 pb-8 text-center text-[15px] text-white/85">{caption}</p>}
    </div>,
    phone,
  )
}
