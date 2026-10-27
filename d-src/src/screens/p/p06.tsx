import { useState } from 'react'
import { Check, ImageIcon, ShieldCheck, Ship, X } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { Note } from '../q/_parts'
import { VOYAGES } from '../s/_core-voyage'
import { Avatar, hashParam, useMe, useMyPosts } from './_feed-parts'

// p06 — нова публікація (C: newPostScreen): текст, фото, судно; підказка про особисті дані й модерацію.
// «Опубликовать» → стрічка з тостом «Публикация отправлена на проверку»; публікація видна там зі статусом.
// Сильний елемент — поле тексту; головна дія внизу.
export function P06NewPost({ go }: ScreenProps) {
  const { showToast } = useProto()
  const me = useMe()
  const { add } = useMyPosts()
  const [text, setText] = useState(() => hashParam('text') ?? '')
  const [photo, setPhoto] = useState(false)
  const [vessel, setVessel] = useState<string | null>(null)
  const [pick, setPick] = useState(false)
  // Судна — з рейсів профілю (крок «Морской стаж»).
  const vessels = VOYAGES.map((v) => ({ name: v.vessel, type: v.type }))

  const publish = () => {
    add({ id: 'my' + Date.now(), text: text.trim(), photo, vessel })
    go('p01')
    showToast('Публикация отправлена на проверку')
  }

  return (
    <div className="flex h-full flex-col">
      <NavBar
        title="Новая публикация"
        right={
          <button type="button" aria-label="Закрыть" onClick={() => go('p01')} className="flex size-11 items-center justify-center rounded-md text-primary">
            <X className="size-6" />
          </button>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-3 pb-6">
        <div className="flex items-center gap-3">
          <Avatar className="bg-card text-primary">{me.initials}</Avatar>
          <span className="flex flex-col">
            <span className="text-[15px] font-semibold">{me.name}</span>
            <span className="text-sm text-muted-foreground">Видят моряки и агентства</span>
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          aria-label="Текст публикации"
          placeholder="Расскажите о рейсе, компании или задайте вопрос коллегам"
          className="mt-4 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-base leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-primary"
        />

        {(photo || vessel) && (
          <ul className="mt-3 flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
            {photo && (
              <Attached icon={ImageIcon} title="Фото с палубы.jpg" sub="Покажется под текстом" onRemove={() => setPhoto(false)} />
            )}
            {vessel && <Attached icon={Ship} title={vessel} sub="Судно в публикации" onRemove={() => setVessel(null)} />}
          </ul>
        )}

        <div className="mt-3 flex gap-3">
          <Button variant="outline" className="h-10 flex-1" disabled={photo} onClick={() => setPhoto(true)}>
            <ImageIcon className="text-primary" /> Фото
          </Button>
          <Button variant="outline" className="h-10 flex-1" onClick={() => setPick(true)}>
            <Ship className="text-primary" /> Судно
          </Button>
        </div>

        <Note icon={ShieldCheck} className="mt-5">
          Не публикуйте номера документов и личные данные. Публикации проверяет модератор.
        </Note>
      </div>
      <Footer>
        <Button size="lg" disabled={!text.trim()} onClick={publish}>
          Опубликовать
        </Button>
      </Footer>

      <Sheet open={pick} onOpenChange={setPick}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[88%] gap-0 overflow-y-auto px-6 pt-6 pb-8">
          <SheetTitle className="text-2xl leading-tight font-semibold tracking-tight">Судно</SheetTitle>
          <SheetDescription className="mt-2 text-base">Из ваших рейсов. Коллеги увидят, о каком судне речь.</SheetDescription>
          <ul className="mt-5 flex flex-col">
            {vessels.map((v) => (
              <li key={v.name} className="border-t border-border first:border-t-0">
                <button
                  type="button"
                  onClick={() => {
                    setVessel(v.name)
                    setPick(false)
                  }}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <span className="flex flex-1 flex-col">
                    <span className={cn('text-base', vessel === v.name && 'font-semibold')}>{v.name}</span>
                    <span className="text-sm text-muted-foreground">{v.type}</span>
                  </span>
                  {vessel === v.name && <Check className="size-5 text-primary" />}
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Attached({ icon: Icon, title, sub, onRemove }: { icon: typeof Ship; title: string; sub: string; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
        <Icon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{sub}</span>
      </span>
      <button type="button" aria-label="Убрать" onClick={onRemove} className="flex size-9 items-center justify-center text-muted-foreground">
        <X className="size-5" />
      </button>
    </li>
  )
}
