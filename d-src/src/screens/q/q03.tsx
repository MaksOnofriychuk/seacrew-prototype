import { useEffect, useState } from 'react'
import { Camera, FileText, FolderOpen, IdCard, Image, Lock, Plus, ScanLine, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { ActionRow, Bar, DOC_TYPES, FlowScreen, Footer, Hint, otherType, QSheet, Title, useTimers, useToast, type DocTypeId, type DocUpload, type Upload, useQ } from './_parts'

// q03 — CV і один документ моряка на вибір (удостоверение або диплом). Другий документ — за бажанням.
// Правка п. 4: підпис другої кнопки — «Diploma / CoC | CoP».
export function Q03Upload({ go }: ScreenProps) {
  const { state, set, bag, setBag } = useQ()
  const type = state.docType as DocTypeId
  const cv = bag<Upload>('q.cv', { st: 'none', p: 0 })
  const doc = bag<DocUpload>('q.doc', { st: 'none', p: 0, pages: 0 })
  const doc2 = bag('q.doc2', false)
  const [sheet, setSheet] = useState<null | 'cv' | 'doc'>(null)
  const { later, clear } = useTimers()
  const { toast, toastNode } = useToast()

  // Повернулись на екран посеред завантаження — вважаємо його завершеним (як prefillUpload у C).
  // З e01/e02 («Сфотографировать ещё раз», «Загрузить файл»): документ ще не завантажено (retake у C),
  // а «Загрузить файл» одразу відкриває вікно вибору документа.
  useEffect(() => {
    const retake = bag<boolean>('q03.retake', false) === true
    const openDoc = bag<string | null>('q03.sheet', null) === 'doc'
    if (retake || openDoc) {
      setBag('q.doc', { st: 'none', p: 0, pages: 0 })
      setBag('q.doc2', false)
      setBag('q03.retake', null)
    }
    if (openDoc) {
      setBag('q03.sheet', null)
      setSheet('doc')
    }
    if (cv.st === 'up') setBag('q.cv', { st: 'done', p: 100 })
    if (!retake && !openDoc && doc.st === 'up') setBag('q.doc', { ...doc, st: 'done', p: 100 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const simulate = (key: string, start: Upload | DocUpload) => {
    let cur: Upload = { ...start, st: 'up', p: 0 }
    setBag(key, cur)
    const tick = () =>
      later(() => {
        const p = Math.min(100, cur.p + 17 + Math.round(Math.random() * 12))
        cur = { ...cur, p, st: p >= 100 ? 'done' : 'up' }
        setBag(key, cur)
        if (p < 100) tick()
      }, 120)
    tick()
  }

  const pickCv = () => {
    setSheet(null)
    simulate('q.cv', cv)
  }
  const pickDoc = () => {
    setSheet(null)
    simulate('q.doc', { ...doc, pages: Math.min(2, doc.pages + 1) })
  }
  const rmCv = () => {
    clear()
    const bak = cv
    setBag('q.cv', { st: 'none', p: 0 })
    toast('CV удалено', () => setBag('q.cv', bak))
  }
  const rmDoc = () => {
    clear()
    const bak = doc
    setBag('q.doc', { st: 'none', p: 0, pages: 0 })
    toast('Документ удалён', () => setBag('q.doc', bak))
  }
  const choose = (t: DocTypeId) => {
    set({ docType: t })
    setBag('q.doc2', false)
  }

  const cvOk = cv.st === 'done'
  const docOk = doc.st === 'done' && doc.pages > 0
  const miss = [!cvOk && 'CV', !docOk && 'документ моряка'].filter(Boolean)
  const other = DOC_TYPES[otherType(type)]

  return (
    <FlowScreen
      step={2}
      onBack={() => go('q02')}
      footer={
        <Footer className="border-t border-border pt-4">
          <Button size="lg" disabled={!(cvOk && docOk)} onClick={() => go('q04')}>
            Продолжить
          </Button>
          <Hint>{miss.length ? `Осталось: ${miss.join(', ')}` : ''}</Hint>
        </Footer>
      }
      overlay={
        <>
          {toastNode}
          <QSheet open={sheet === 'cv'} onClose={() => setSheet(null)} title="Добавить CV">
            <ActionRow icon={FolderOpen} title="Выбрать файл" sub="PDF или Word" onClick={pickCv} />
            <ActionRow icon={ScanLine} title="Сканировать" sub="Если CV напечатано" onClick={pickCv} />
            <ActionRow icon={Image} title="Выбрать из галереи" sub="Фото или скриншот" onClick={pickCv} />
            <Button size="lg" variant="outline" className="mt-4" onClick={() => setSheet(null)}>
              Отмена
            </Button>
          </QSheet>
          <QSheet
            open={sheet === 'doc'}
            onClose={() => setSheet(null)}
            title={DOC_TYPES[type].n}
            description="Снимите страницу с фото и данными. Если на развороте есть другие данные — добавьте её второй страницей."
          >
            <ActionRow icon={ScanLine} title="Сканировать документ" sub="Края найдутся сами" onClick={pickDoc} />
            <ActionRow icon={Camera} title="Сфотографировать" sub="При хорошем свете, без бликов" onClick={pickDoc} />
            <ActionRow icon={FolderOpen} title="Выбрать файл" sub="PDF или изображение" onClick={pickDoc} />
            <ActionRow icon={Image} title="Выбрать из галереи" onClick={pickDoc} />
            <Button size="lg" variant="outline" className="mt-4" onClick={() => setSheet(null)}>
              Отмена
            </Button>
          </QSheet>
        </>
      }
    >
      <Title sub="CV и один документ моряка — остальное потом.">Быстрая регистрация</Title>

      <Section title="CV" done={cvOk}>
        {cv.st === 'none' ? (
          <Drop icon={Plus} title="Добавить CV" sub="PDF, Word, фото или скан" onClick={() => setSheet('cv')} />
        ) : (
          <FileRow icon={FileText} name="CV_Andrii_Koval.pdf" meta="PDF, 412 КБ" up={cv.st === 'up'} p={cv.p} onRemove={rmCv} />
        )}
      </Section>

      <Section title="Документ моряка" done={docOk} extra={!docOk && <Badge variant="outline" className="font-normal text-muted-foreground">один на выбор</Badge>}>
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-md border border-border bg-surface p-1">
          {(Object.keys(DOC_TYPES) as DocTypeId[]).map((id) => {
            const on = id === type
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => choose(id)}
                className={cn('flex flex-col items-start rounded-[9px] border px-3 py-2 text-left transition-colors', on ? 'border-primary bg-surface' : 'border-transparent')}
              >
                <span className={cn('text-[15px] font-medium', on ? 'text-primary' : 'text-foreground')}>{DOC_TYPES[id].b}</span>
                <span className="text-sm text-muted-foreground">{DOC_TYPES[id].s}</span>
              </button>
            )
          })}
        </div>

        {doc.pages > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              {Array.from({ length: doc.pages }, (_, i) => (
                <PageThumb key={i} n={i + 1} />
              ))}
              {doc.pages < 2 && doc.st !== 'up' && (
                <button
                  type="button"
                  aria-label="Добавить страницу"
                  onClick={() => setSheet('doc')}
                  className="flex h-[104px] w-[78px] flex-col items-center justify-center gap-1 rounded-md border border-border bg-surface text-sm text-primary"
                >
                  <Plus className="size-5" />
                  Ещё страница
                </button>
              )}
            </div>
            {doc.st === 'up' ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">
                  Загружаем страницу {doc.pages}… <span className="font-mono">{doc.p}%</span>
                </span>
                <Bar value={doc.p} />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="size-3.5 text-success" />
                  <span>
                    Зашифровано, <span className="font-mono">{doc.pages}</span> стр.
                  </span>
                </span>
                <Button variant="ghost" size="icon" aria-label="Удалить документ" onClick={rmDoc} className="text-muted-foreground">
                  <Trash2 className="size-5" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Drop icon={ScanLine} title="Сканировать или сфотографировать" sub="Страница с фото и данными" onClick={() => setSheet('doc')} />
        )}

        {docOk &&
          (doc2 ? (
            <FileRow icon={IdCard} name={other.n} meta="1 стр., зашифровано" onRemove={() => setBag('q.doc2', false)} />
          ) : (
            <button type="button" onClick={() => setBag('q.doc2', true)} className="flex items-center gap-3 text-left">
              <Plus className="size-5 shrink-0 text-primary" />
              <span className="flex flex-col">
                <span className="text-[15px] font-medium text-primary">Добавить ещё: {other.b.toLowerCase()}</span>
                <span className="text-sm text-muted-foreground">Необязательно — можно позже</span>
              </span>
            </button>
          ))}

        <p className="text-sm text-muted-foreground">Загранпаспорт не подходит — он не подтверждает, что вы моряк.</p>
      </Section>
    </FlowScreen>
  )
}

function Section({ title, done, extra, children }: { title: string; done: boolean; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-7 flex flex-col gap-3 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {done ? <Badge variant="success">Загружено</Badge> : extra}
      </div>
      {children}
    </section>
  )
}

function Drop({ icon: Icon, title, sub, onClick }: { icon: typeof Plus; title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-4 text-left">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
        <Icon className="size-5" />
      </span>
      <span className="flex flex-col">
        <span className="text-[15px] font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{sub}</span>
      </span>
    </button>
  )
}

function FileRow({ icon: Icon, name, meta, up, p = 100, onRemove }: { icon: typeof Plus; name: string; meta: string; up?: boolean; p?: number; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <Icon className="size-6 shrink-0 text-primary" strokeWidth={1.75} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[15px] font-medium">{name}</span>
        {up ? (
          <Bar value={p} className="mt-1" />
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-3.5 text-success" />
            {meta}
          </span>
        )}
      </div>
      {up ? (
        <span className="w-10 text-right font-mono text-sm text-muted-foreground">{p}%</span>
      ) : (
        <Button variant="ghost" size="icon" aria-label="Удалить" onClick={onRemove} className="text-muted-foreground">
          <Trash2 className="size-5" />
        </Button>
      )}
    </div>
  )
}

// Мініатюра сторінки — як аркуш паперу зі смужкою-шапкою і рядком MRZ.
function PageThumb({ n }: { n: number }) {
  return (
    <div className="relative flex h-[104px] w-[78px] flex-col overflow-hidden rounded-md border border-border bg-surface">
      <div className="h-2.5 bg-primary" />
      <div className="flex gap-1.5 p-1.5">
        <div className="h-7 w-5 rounded-[3px] bg-muted" />
        <div className="flex flex-1 flex-col gap-1 pt-0.5">
          <span className="h-1 rounded-full bg-border" />
          <span className="h-1 w-3/4 rounded-full bg-border" />
          <span className="h-1 w-2/3 rounded-full bg-border" />
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-0.5 px-1.5 pb-1.5">
        <span className="h-0.5 rounded-full bg-muted-foreground/40" />
        <span className="h-0.5 rounded-full bg-muted-foreground/40" />
      </div>
      <span className="absolute right-1.5 bottom-3 font-mono text-[11px] text-muted-foreground">{n}</span>
    </div>
  )
}
