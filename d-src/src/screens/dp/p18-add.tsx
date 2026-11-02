import { useEffect, useState } from 'react'
import { Camera, Check, FileQuestion, FolderOpen, HeartPulse, Image, LoaderCircle, Plus, RotateCw, Sparkles, Trash2, TriangleAlert } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { Footer, NavBar } from '@/components/app/chrome'
import { useView } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { ADD_CATS, DETECTED, MAX_PAGES, READ, type AddCat } from '@/lib/data-docs-profile'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { ActionRow, Note, PageArt, PageThumb, useDP, useLater } from './_parts'
import { ADD_START, type AddState } from './_docs'

// p18 — «Добавить документ» (gaps №5; add.tsx у застосунку): сторінки одного документа (до 10) —
// кожну можна відкрити, повернути, прибрати; тип документа (ИИ підказує, моряк може змінити);
// «Распознать» → завантажувач з номером сторінки → сам переходить на p19 (як правка №13, без кнопки).
// «Ввести вручную» → p19 з порожніми полями. Стани панелі: «Пусто» — без сторінок,
// «Загрузка» — читаємо документ, «Ошибка» — розпізнавання не почалося.

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

export function P18Add({ go }: ScreenProps) {
  const { bag, setBag, state } = useDP()
  const view = useView()
  const later = useLater()
  const stored = bag<AddState | null>('dp.add', null)
  // «Пусто» з панелі — без сторінок, доки моряк щось не зробить.
  const [touched, setTouched] = useState(false)
  const st: AddState = view === 'empty' && !touched ? { cat: null, pages: [], manual: true } : (stored ?? { ...ADD_START, pages: [0, 0] })
  const put = (p: Partial<AddState>) => {
    setTouched(true)
    setWrong(false)
    setBag('dp.add', { ...st, ...p })
  }

  const [source, setSource] = useState(false)
  const [viewing, setViewing] = useState<number | null>(null)
  const [reading, setReading] = useState<number | null>(null)
  // Правка №12: «не той документ» (сценарій панелі «Это не документ моряка»). Лічильник — спільний
  // з реєстрацією (bag q.wrongDocs, як q04 і e02): перший раз — попередження, другий поспіль — e08.
  const [wrong, setWrong] = useState(false)
  // «Определяем тип…» — коротко після кожної зміни кількості сторінок.
  const [guessing, setGuessing] = useState(false)
  useEffect(() => {
    if (!st.pages.length) return
    setGuessing(true)
    const t = window.setTimeout(() => setGuessing(false), 900)
    return () => window.clearTimeout(t)
  }, [st.pages.length])

  const detected = st.pages.length > 0 && !guessing ? DETECTED : null
  const cat: AddCat | null = st.cat ?? detected
  const full = st.pages.length >= MAX_PAGES
  const canRead = st.pages.length > 0 && !!cat && !guessing

  const addPage = () => {
    setSource(false)
    if (!full) put({ pages: [...st.pages, 0], manual: false })
  }
  const rotate = (i: number) => put({ pages: st.pages.map((r, j) => (j === i ? (r + 90) % 360 : r)) })
  const remove = (i: number) => {
    put({ pages: st.pages.filter((_, j) => j !== i) })
    setViewing(null)
  }

  const recognise = () => {
    if (!canRead) return
    setBag('dp.add', { ...st, cat, manual: false })
    setWrong(false)
    setReading(1)
    st.pages.forEach((_, i) => later(() => setReading(i + 2), 700 * (i + 1)))
    later(() => {
      if (state.scenario !== 'notSeafarer') {
        setBag('q.wrongDocs', null)
        return go('p19')
      }
      if (bag<number>('q.wrongDocs', 0) >= 1) return go('e08')
      setBag('q.wrongDocs', 1)
      setReading(null)
      setWrong(true)
    }, 700 * st.pages.length + 300)
  }
  const manual = () => {
    if (!cat) return
    setBag('dp.add', { ...st, cat, manual: true })
    go('p19')
  }

  if (reading !== null || view === 'loading') {
    const total = Math.max(st.pages.length, 1)
    const n = Math.min(reading ?? 1, total)
    return (
      <div className="relative flex h-full flex-col">
        <NavBar onBack={() => go('p02')} />
        <div className="flex flex-1 flex-col items-start justify-center gap-6 px-6 pb-24" aria-live="polite">
          <div className="flex gap-2">
            {Array.from({ length: Math.min(total, 4) }, (_, i) => (
              <PageArt key={i} n={i + 1} rot={st.pages[i]} className={cn('w-16 transition-opacity duration-200', i + 1 > n && 'opacity-40')} />
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2.5 text-[26px] leading-tight font-semibold tracking-tight">
              <LoaderCircle className="size-6 animate-spin text-primary" />
              Читаем документ
            </h1>
            <p className="text-base text-muted-foreground">
              {total > 1 ? (
                <>
                  Страница <span className="font-mono">{n}</span> из <span className="font-mono">{total}</span>
                </>
              ) : (
                'Обычно это несколько секунд.'
              )}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col">
      <NavBar onBack={() => go('p02')} />
      <div className="screen-in min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Добавить документ</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Все страницы одного документа, до <span className="font-mono">{MAX_PAGES}</span>.
        </p>

        {wrong && (
          <div role="alert" className="screen-in mt-5 flex flex-col gap-2 rounded-md border border-border bg-surface px-4 py-3">
            <p className="flex items-start gap-3 text-[15px] leading-snug">
              <FileQuestion className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden="true" />
              <span>
                <span className="font-medium">Это не документ моряка.</span> Загрузите удостоверение или диплом.
              </span>
            </p>
            <p className="flex items-start gap-3 text-[15px] leading-snug">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              Ещё одна ошибка — и аккаунт будет заблокирован
            </p>
          </div>
        )}

        {st.pages.length > 0 ? (
          <div className="-mx-6 mt-6 flex gap-3 overflow-x-auto px-6 pt-2 pb-1">
            {st.pages.map((r, i) => (
              <PageThumb key={i} n={i + 1} rot={r} onOpen={() => setViewing(i)} onRotate={() => rotate(i)} onRemove={() => remove(i)} />
            ))}
            {!full && (
              <div className="flex w-[104px] shrink-0 flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setSource(true)}
                  className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-primary/50 text-sm font-medium text-primary active:scale-[0.98]"
                >
                  <Plus className="size-5" />
                  Страница
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-dashed border-primary/50">
            <p className="px-4 pt-4 text-[15px]">Сфотографируйте или загрузите страницу с фото и данными.</p>
            <div className="mt-3 grid grid-cols-3 border-t border-dashed border-primary/30">
              {(
                [
                  [Camera, 'Камера'],
                  [Image, 'Галерея'],
                  [FolderOpen, 'Файл'],
                ] as const
              ).map(([I, label]) => (
                <button key={label} type="button" onClick={addPage} className="flex flex-col items-center gap-1.5 border-l border-dashed border-primary/30 py-3.5 text-sm font-medium text-primary first:border-l-0">
                  <I className="size-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        {full && <p className="mt-2 text-sm text-muted-foreground">Это максимум. Уберите страницу, чтобы добавить другую.</p>}

        <section className="mt-8">
          <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground">Тип документа</h2>
          {st.pages.length > 0 && !st.cat && (
            <p className="mb-3 flex items-start gap-2 px-1 text-[15px]" aria-live="polite">
              {guessing ? (
                <>
                  <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />
                  <span className="text-muted-foreground">Определяем, что это за документ…</span>
                </>
              ) : (
                <>
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>Похоже, это {lower(READ[DETECTED].title)}. Если нет — выберите другой тип.</span>
                </>
              )}
            </p>
          )}
          <div role="radiogroup" aria-label="Тип документа" className="overflow-hidden rounded-xl border border-border bg-surface">
            {ADD_CATS.map((c) => {
              const on = c.id === cat
              return (
                <button key={c.id} type="button" role="radio" aria-checked={on} onClick={() => put({ cat: c.id })} className="flex min-h-13 w-full items-center gap-3 border-t border-border px-4 py-3 text-left first:border-t-0 active:bg-muted/60">
                  <span className="flex flex-1 flex-col">
                    <span className={cn('text-[15px]', on && 'font-medium')}>{c.label}</span>
                    {c.sub && <span className="text-sm text-muted-foreground">{c.sub}</span>}
                  </span>
                  {on && <Check className="size-5 shrink-0 text-primary" strokeWidth={2.5} />}
                </button>
              )
            })}
          </div>
          <button type="button" onClick={() => go('s5')} className="mt-3 flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <HeartPulse className="size-4 text-primary" />
            Медицинские документы вводятся <span className="font-medium text-primary">вручную</span>
          </button>
        </section>
      </div>

      <Footer className="border-t border-border pt-4">
        {view === 'error' && (
          <Note icon={TriangleAlert} tone="warning" className="border border-border">
            Не удалось начать распознавание. Проверьте соединение и попробуйте ещё раз.
          </Note>
        )}
        <Button size="lg" disabled={!canRead} onClick={recognise}>
          Распознать
        </Button>
        <Button size="lg" variant="ghost" className="text-primary" disabled={!cat} onClick={manual}>
          Ввести вручную
        </Button>
      </Footer>

      <BottomSheet open={source} onClose={() => setSource(false)} title="Ещё страница" description="Только страницы этого же документа.">
        <ActionRow icon={Camera} title="Сфотографировать" onClick={addPage} />
        <ActionRow icon={Image} title="Выбрать из галереи" onClick={addPage} />
        <ActionRow icon={FolderOpen} title="Выбрать файл" sub="PDF или изображение" onClick={addPage} />
      </BottomSheet>

      <BottomSheet
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={
          viewing !== null ? (
            <>
              Страница <span className="font-mono">{viewing + 1}</span> из <span className="font-mono">{st.pages.length}</span>
            </>
          ) : (
            ''
          )
        }
        footer={
          viewing !== null && (
            <div className="flex gap-2">
              <Button size="lg" variant="outline" className="flex-1 text-primary" onClick={() => rotate(viewing)}>
                <RotateCw /> Повернуть
              </Button>
              <Button size="lg" variant="outline" className="flex-1 text-signal" onClick={() => remove(viewing)}>
                <Trash2 /> Убрать
              </Button>
            </div>
          )
        }
      >
        {viewing !== null && (
          <div className="flex justify-center py-4">
            <PageArt n={viewing + 1} rot={st.pages[viewing]} className="w-[64%]" />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
