import { useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { FieldMsg } from '@/components/app/field-msg'
import { SourceSheet, srcCamera, srcGallery } from '@/components/app/source-sheet'
import { Button } from '@/components/ui/button'
import { TOPIC_SECTIONS, type GroupTopic } from '@/lib/data-premium'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { Field, TextInput } from '../q/_parts'
import { PhotoBlock, useGroups } from './pr-group-state'

// pr-group-new — «Новая тема» (правка №43). Раздел, заголовок, текст, фото; после «Опубликовать» тема
// попадает в «Мои темы» со статусом «На проверке» (модерация). Обязательные поля — резерв строки под ошибку.

export function PrGroupNew({ go }: ScreenProps) {
  const { g, patch, showToast } = useGroups()
  const [section, setSection] = useState<string>('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState(false)
  const [src, setSrc] = useState(false)
  const [tried, setTried] = useState(false)

  const errSection = tried && !section ? 'Выберите раздел' : undefined
  const errTitle = tried && !title.trim() ? 'Напишите заголовок' : undefined
  const errText = tried && !text.trim() ? 'Опишите вопрос' : undefined

  const publish = () => {
    setTried(true)
    if (!section || !title.trim() || !text.trim()) return
    const t: GroupTopic = {
      id: 'n' + (g.mine.length + 1),
      title: title.trim(),
      text: text.trim(),
      author: 'Вы',
      av: 'Я',
      replies: 0,
      last: 'сейчас',
      tag: section,
      status: 'review',
      mine: true,
      photo: photo ? 'Фото к теме' : undefined,
    }
    patch({ mine: [t, ...g.mine], tab: 'mine', section: 'all' })
    go('pr-groups')
    showToast('Тема отправлена на проверку — появится после модерации')
  }
  const pick = () => {
    setPhoto(true)
    setSrc(false)
  }

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Новая тема" onBack={() => go('pr-groups')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-4">
        <div className="flex flex-col gap-1">
          <span className="text-[15px] font-medium">Раздел</span>
          <div role="group" aria-label="Раздел" className="mt-1 flex flex-wrap gap-2">
            {TOPIC_SECTIONS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={section === s}
                onClick={() => setSection(s)}
                className={cn('h-10 rounded-full border px-4 text-[15px] font-medium transition-colors duration-200', section === s ? 'border-primary bg-muted text-primary' : errSection ? 'border-signal bg-surface' : 'border-border bg-surface')}
              >
                {s}
              </button>
            ))}
          </div>
          <FieldMsg error={errSection} className="mt-1" />
        </div>

        <div className="mt-2 flex flex-col gap-1">
          <Field id="gn-title" label="Заголовок" error={errTitle} note={`${title.length}/80`}>
            <TextInput id="gn-title" value={title} maxLength={80} invalid={!!errTitle} onChange={(e) => setTitle(e.target.value)} placeholder="О чём хотите спросить" />
          </Field>
          <Field id="gn-text" label="Вопрос" error={errText} note="Чем подробнее, тем быстрее ответят">
            <textarea
              id="gn-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-invalid={!!errText || undefined}
              rows={5}
              placeholder="Опишите ситуацию: порт, документ, должность"
              className={cn('w-full resize-none rounded-md border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring', errText ? 'border-signal' : 'border-input')}
            />
          </Field>
        </div>

        <div className="mt-2">
          <span className="text-[15px] font-medium">Фото</span>
          {photo ? (
            <div className="relative mt-2 animate-in fade-in-0 duration-200 motion-reduce:animate-none">
              <PhotoBlock />
              <button type="button" aria-label="Убрать фото" onClick={() => setPhoto(false)} className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground active:scale-95">
                <X className="size-5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setSrc(true)} className="mt-2 flex h-14 w-full items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-4 text-left text-[15px] text-primary active:bg-muted">
              <ImagePlus className="size-5" /> Добавить фото
              <span className="ml-auto text-sm text-muted-foreground">необязательно</span>
            </button>
          )}
        </div>
      </div>
      <Footer className="border-t border-border bg-background">
        <Button size="lg" onClick={publish}>
          Опубликовать
        </Button>
        <p className="text-center text-sm text-muted-foreground">Модератор проверит тему перед публикацией</p>
      </Footer>
      <SourceSheet open={src} onClose={() => setSrc(false)} title="Добавить фото" items={[{ ...srcCamera(pick), icon: Camera }, srcGallery(pick)]} />
    </div>
  )
}
