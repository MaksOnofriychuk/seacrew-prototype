import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Download, FileText, Image as ImageIcon, Link2, Mail, MessageCircle, Send, Share2, X, ZoomIn, ZoomOut } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { usePhonePortal } from '@/lib/phone-portal'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { WebDialog } from './dialog'

// Перегляд фото чи файлу у вебі (перевірка 03.11, №13): темне вікно на весь екран сторінки (у рамці браузера),
// зверху — закрити, назва, «Поделиться», «Скачать». Фото й файли не відкриваються тостом.

export function WebMediaViewer({
  open,
  onClose,
  title,
  subtitle,
  children,
  onShare,
  onDownload,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  onShare?: () => void
  onDownload?: () => void
}) {
  const container = usePhonePortal()
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal container={container}>
        <Dialog.Content
          aria-describedby={undefined}
          className="absolute inset-0 z-50 flex flex-col bg-black/92 text-white outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none"
        >
          <div className="flex h-16 shrink-0 items-center gap-2 px-4">
            <Dialog.Close aria-label="Закрыть" className="flex size-10 items-center justify-center rounded-full hover:bg-white/10">
              <X className="size-5" />
            </Dialog.Close>
            <div className="flex min-w-0 flex-1 flex-col px-2 leading-tight">
              <Dialog.Title className="truncate text-[15px] font-medium">{title}</Dialog.Title>
              {subtitle && <span className="truncate text-[13px] text-white/60">{subtitle}</span>}
            </div>
            {onShare && (
              <button type="button" onClick={onShare} className="flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-white/10">
                <Share2 className="size-4.5" /> Поделиться
              </button>
            )}
            {onDownload && (
              <button type="button" onClick={onDownload} className="flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-white/10">
                <Download className="size-4.5" /> Скачать
              </button>
            )}
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-8 pb-8" onClick={(e) => e.target === e.currentTarget && onClose()}>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Страница документа без справжнього скана: смуга з назвою і рядки (як «папір» в інших екранах).
export function DocPage({ name, className }: { name: string; className?: string }) {
  return (
    <div className={cn('flex aspect-[1/1.35] h-full max-h-[620px] flex-col overflow-hidden rounded-md bg-white text-[#0B1220] shadow-xl', className)}>
      <div className="flex items-center gap-2 bg-[#1F4E8C] px-6 py-3 text-sm font-medium text-white">
        <FileText className="size-4" />
        <span className="truncate">{name}</span>
      </div>
      <div className="flex flex-col gap-3 px-8 py-7">
        {[78, 62, 70, 46, 66, 54, 72, 40, 58, 64, 36].map((w, i) => (
          <span key={i} className="h-2 rounded-full bg-[#E3E8EF]" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}

// Фото без справжнього знімка: аркуш документа, знятий під кутом.
export function PhotoPage({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-full max-h-[560px] w-full max-w-[760px] items-center justify-center rounded-md bg-[#1b2538]', className)}>
      <div className="flex h-[78%] w-[52%] -rotate-2 flex-col gap-3 overflow-hidden rounded-md border border-white/10 bg-[#F3F6FA] shadow-xl">
        <span className="h-6 bg-[#1F4E8C]" />
        <span className="flex flex-col gap-2.5 px-5">
          {[80, 60, 72, 50, 66].map((w, i) => (
            <span key={i} className="h-2 rounded-full bg-[#CBD3DF]" style={{ width: `${w}%` }} />
          ))}
          <span className="mt-4 h-2 w-1/3 self-end rounded-full bg-[#CBD3DF]" />
        </span>
      </div>
    </div>
  )
}

// «Поделиться» — выбор, куда отправить: скопировать ссылку, мессенджер, почта (правка №14).
export function WebShareDialog({ open, onClose, title = 'Поделиться', description }: { open: boolean; onClose: () => void; title?: string; description?: string }) {
  const { showToast } = useProto()
  const items = [
    { icon: Link2, title: 'Скопировать ссылку', sub: 'Вставьте в любой чат', done: 'Ссылка скопирована' },
    { icon: Send, title: 'Telegram', done: 'Ссылка отправлена в Telegram' },
    { icon: MessageCircle, title: 'WhatsApp', done: 'Ссылка отправлена в WhatsApp' },
    { icon: Mail, title: 'Почта', sub: 'Письмо со ссылкой', done: 'Письмо со ссылкой готово' },
  ]
  return (
    <WebDialog open={open} onClose={onClose} title={title} description={description} className="w-[420px]">
      <ul className="-mx-2 -mt-1 flex flex-col">
        {items.map((i) => (
          <li key={i.title}>
            <button
              type="button"
              onClick={() => {
                onClose()
                showToast(i.done)
              }}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left hover:bg-muted"
            >
              <i.icon className="size-5 shrink-0 text-primary" />
              <span className="flex flex-col leading-tight">
                <span className="text-[15px] font-medium">{i.title}</span>
                {i.sub && <span className="text-[13px] text-muted-foreground">{i.sub}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </WebDialog>
  )
}

/** Готовое «открыть → поделиться → скачать» для одного вложения. */
export function useAttachment() {
  const { showToast } = useProto()
  const [file, setFile] = useState<{ name: string; kind: 'photo' | 'file'; subtitle?: string } | null>(null)
  const [share, setShare] = useState(false)
  return {
    open: (name: string, kind: 'photo' | 'file', subtitle?: string) => setFile({ name, kind, subtitle }),
    node: (
      <>
        <WebMediaViewer
          open={!!file && !share}
          onClose={() => setFile(null)}
          title={file?.name ?? ''}
          subtitle={file?.subtitle}
          onShare={() => setShare(true)}
          onDownload={() => showToast(`Файл скачан: ${file?.name}`)}
        >
          {file?.kind === 'photo' ? <PhotoPage /> : <DocPage name={file?.name ?? ''} />}
        </WebMediaViewer>
        <WebShareDialog open={share} onClose={() => setShare(false)} title={file?.kind === 'photo' ? 'Поделиться фото' : 'Поделиться файлом'} description={file?.name} />
      </>
    ),
  }
}

/**
 * Просмотр файла или фото на весь экран страницы (правило 13): закрыть, название, «Поделиться» и «Скачать».
 * Содержимое — условный лист (в прототипе настоящих файлов нет).
 */
export function FileViewer({ open, onClose, title, subtitle, pages = 1, kind = 'doc', startPage = 0 }: { open: boolean; onClose: () => void; title: string; subtitle?: string; pages?: number; kind?: 'doc' | 'photo'; startPage?: number }) {
  const portal = usePhonePortal()
  const { showToast } = useProto()
  const [page, setPage] = useState(startPage)
  const [zoom, setZoom] = useState(false)
  const [share, setShare] = useState(false)
  useEffect(() => {
    if (open) {
      setPage(startPage)
      setZoom(false)
      setShare(false)
    }
  }, [open, startPage])
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open || !portal) return null
  const done = (t: string) => (setShare(false), showToast(t))
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="absolute inset-0 z-[60] flex flex-col bg-black/95 text-white animate-in fade-in-0 duration-200 motion-reduce:animate-none">
      <div className="relative flex h-16 shrink-0 items-center gap-3 px-4">
        <button type="button" onClick={onClose} aria-label="Закрыть" className="flex size-10 items-center justify-center rounded-full hover:bg-white/10">
          <X className="size-5" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[15px] font-medium">{title}</span>
          {(subtitle || pages > 1) && (
            <span className="truncate text-sm text-white/65">
              {subtitle}
              {subtitle && pages > 1 && ', '}
              {pages > 1 && (
                <>
                  стр. <span className="font-mono">{page + 1}</span> из <span className="font-mono">{pages}</span>
                </>
              )}
            </span>
          )}
        </div>
        <button type="button" onClick={() => setZoom(!zoom)} aria-label={zoom ? 'Уменьшить' : 'Увеличить'} className="flex size-10 items-center justify-center rounded-full hover:bg-white/10">
          {zoom ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}
        </button>
        <button type="button" onClick={() => setShare(!share)} aria-label="Поделиться" aria-expanded={share} className="flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium hover:bg-white/10">
          <Share2 className="size-4" /> Поделиться
        </button>
        <button type="button" onClick={() => done(`${title} скачан`)} aria-label="Скачать" className="flex size-10 items-center justify-center rounded-full hover:bg-white/10">
          <Download className="size-5" />
        </button>
        {share && (
          <div className="absolute top-14 right-16 z-10 flex w-[260px] flex-col rounded-lg border border-white/15 bg-neutral-900 p-1 text-sm shadow-lg">
            {[
              [Link2, 'Скопировать ссылку', 'Ссылка скопирована'],
              [Mail, 'Отправить по почте', 'Письмо со ссылкой подготовлено'],
              [Send, 'Передать коллеге', 'Файл передан коллеге'],
            ].map(([I, l, t]) => {
              const Icon = I as typeof Link2
              return (
                <button key={l as string} type="button" onClick={() => done(t as string)} className="flex h-10 items-center gap-3 rounded-md px-3 text-left hover:bg-white/10">
                  <Icon className="size-4 text-white/70" /> {l as string}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-4 overflow-auto px-6 pb-6">
        {pages > 1 && (
          <button type="button" aria-label="Предыдущая страница" disabled={page === 0} onClick={() => setPage(page - 1)} className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30">
            <ChevronLeft className="size-6" />
          </button>
        )}
        <div
          className={cn(
            'flex shrink-0 flex-col gap-3 rounded-md bg-neutral-100 p-8 text-neutral-400 transition-transform duration-200 motion-reduce:transition-none',
            kind === 'doc' ? 'aspect-[3/4] h-[640px]' : 'aspect-[4/3] h-[520px] items-center justify-center bg-neutral-300',
            zoom && 'scale-125',
          )}
        >
          {kind === 'doc' ? (
            <>
              <span className="h-4 w-2/5 rounded bg-neutral-300" />
              <span className="mb-4 h-3 w-1/4 rounded bg-neutral-200" />
              {Array.from({ length: 14 }, (_, i) => (
                <span key={i} className="h-2.5 rounded bg-neutral-200" style={{ width: `${95 - ((i * 37 + page * 11) % 40)}%` }} />
              ))}
              <span className="mt-auto self-end rounded border-2 border-neutral-300 px-3 py-1 text-xs font-medium">образец</span>
            </>
          ) : (
            <>
              <ImageIcon className="size-14" />
              <span className="text-sm">Фото, образец</span>
            </>
          )}
        </div>
        {pages > 1 && (
          <button type="button" aria-label="Следующая страница" disabled={page === pages - 1} onClick={() => setPage(page + 1)} className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30">
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>
    </div>,
    portal,
  )
}

