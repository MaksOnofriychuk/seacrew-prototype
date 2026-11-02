import { useState } from 'react'
import { Check, FileQuestion, Info, Lock, Plus, RotateCw, Stamp, TriangleAlert, X } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { Footer, NavBar } from '@/components/app/chrome'
import { Paper } from '@/components/app/paper'
import { EmptyState, useView } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { READ, type AddCat, type OtherField, type ReadField } from '@/lib/data-docs-profile'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { Field, maskDate, Note, PageArt, plural, SourceTag, TextInput, useDP, validDate } from './_parts'
import { type AddedDoc, type AddState } from './_docs'

// p19 — «Проверьте документ» після додавання в застосунку (gaps №5; extraction/[id] у застосунку).
// Сторінки документа (кожну можна відкрити); поля — з позначкою «из документа», сумнівні — «проверьте»,
// виправлені — «исправлено вами». «Другие поля» — прочитане, якого застосунок ще не знає: зберігається
// з документом, профіль не заповнює; можна прибрати або додати своє. «Подтвердить» → документ у p02.
// Режим «Ввести вручную» — ті самі поля, порожні. Стани панелі: «Пусто» — нічого не прочитано,
// «Загрузка» — ще читаємо, «Ошибка» — не вдалося прочитати.

const DEFAULT: AddState = { cat: 'visa', pages: [0, 0], manual: false }
const isDate = (f: ReadField) => f.mono && /дата|до$/i.test(f.label)

export function P19Check({ go }: ScreenProps) {
  const { bag, setBag, set, showToast } = useDP()
  const view = useView()
  const st = bag<AddState>('dp.add', DEFAULT)
  const cat: AddCat = st.cat ?? 'visa'
  const read = READ[cat]
  const manual = st.manual

  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(read.fields.map((f) => [f.k, manual ? '' : f.value])))
  const [other, setOther] = useState<OtherField[]>(() => (manual ? [] : read.other))
  const [adding, setAdding] = useState<{ label: string; value: string; tried: boolean } | null>(null)
  const [viewing, setViewing] = useState<number | null>(null)
  const [tried, setTried] = useState(false)
  // Диплом: необов'язкове фото Endorsement (відповідь 75) — коли це окремий аркуш.
  const [endorse, setEndorse] = useState(false)
  const pages = st.pages

  const orig = (f: ReadField) => (manual ? '' : f.value)
  const edited = (f: ReadField) => !manual && vals[f.k] !== f.value
  const lowLeft = read.fields.filter((f) => f.low && !edited(f) && !manual).length
  const dateBad = (f: ReadField) => isDate(f) && !!vals[f.k] && !validDate(vals[f.k])
  const missing = (f: ReadField) => ((f.k === 'num' && cat !== 'vac') || f.k === 'name' || f.k === 'country') && !vals[f.k]?.trim()
  const problems = read.fields.filter((f) => dateBad(f) || missing(f))

  const tag = (f: ReadField) => {
    if (manual || !vals[f.k]) return null
    if (edited(f)) return <SourceTag kind="edited" />
    if (f.low) return <SourceTag kind="check" />
    return <SourceTag kind="doc" />
  }

  const confirm = () => {
    setTried(true)
    if (problems.length) return
    const doc: AddedDoc = {
      id: `add-${Date.now()}`,
      cat,
      fields: read.fields.map((f) => ({ ...f, value: vals[f.k].trim() })).filter((f) => f.value),
      other,
      pages: Math.max(pages.length, 1),
      manual,
      endorse: cat === 'dip' && endorse,
    }
    setBag('dp.added', [...bag<AddedDoc[]>('dp.added', []), doc])
    setBag('dp.add', null)
    showToast(cat === 'passport' ? 'Загранпаспорт обновлён' : 'Документ добавлен')
    go('p02')
  }
  const toManual = () => {
    setBag('dp.add', { ...st, cat, manual: true })
    setVals(Object.fromEntries(read.fields.map((f) => [f.k, ''])))
    setOther([])
    set({ view: 'normal' })
  }

  const addOther = () => {
    if (!adding) return
    const label = adding.label.trim()
    const value = adding.value.trim()
    if (!label || !value || other.some((o) => o.label.toLowerCase() === label.toLowerCase())) return setAdding({ ...adding, tried: true })
    setOther([...other, { k: `mine-${Date.now()}`, label, value, mine: true }])
    setAdding(null)
  }
  const addErr = adding?.tried
    ? !adding.label.trim()
      ? 'Введите название поля.'
      : other.some((o) => o.label.toLowerCase() === adding.label.trim().toLowerCase())
        ? 'Такое поле уже есть.'
        : !adding.value.trim()
          ? 'Введите значение.'
          : null
    : null

  // Ввели вручну одразу з p02 (тип уже відомий) — назад у документи.
  const nav = <NavBar onBack={() => go(manual && !pages.length ? 'p02' : 'p18')} />

  if (view === 'loading') {
    return (
      <div className="flex h-full flex-col">
        {nav}
        <div className="flex flex-1 flex-col items-start justify-center gap-3 px-6 pb-24" aria-busy="true">
          <div className="flex gap-2">
            {pages.slice(0, 4).map((r, i) => (
              <PageArt key={i} n={i + 1} rot={r} className="w-16" />
            ))}
          </div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">Читаем документ</h1>
          <p className="text-base text-muted-foreground">Обычно это несколько секунд. Страница откроется сама.</p>
        </div>
      </div>
    )
  }
  if (view === 'error' || view === 'empty') {
    const err = view === 'error'
    return (
      <div className="flex h-full flex-col">
        {nav}
        <EmptyState
          icon={err ? TriangleAlert : FileQuestion}
          title={err ? 'Не удалось распознать' : 'Ни одно поле не распознано'}
          text={err ? 'На этот раз документ не прочитался. Переснимите страницы при хорошем свете или введите данные вручную.' : 'Похоже, на фото не видно данных. Переснимите страницу или введите данные вручную.'}
          className={err ? '[&>span]:text-signal' : undefined}
          action={
            <div className="mt-2 flex w-full flex-col gap-2">
              <Button size="lg" onClick={() => go('p18')}>
                <RotateCw /> Переснять
              </Button>
              <Button size="lg" variant="ghost" className="text-primary" onClick={toManual}>
                Ввести вручную
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col">
      {nav}
      <div className="screen-in min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Проверьте документ</h1>
        <p className="mt-3 text-base text-muted-foreground">
          {manual ? 'Введите данные как в документе. Администратор сверит их с фото.' : 'Данные из документа уже заполнены. Проверьте их и подтвердите.'}
        </p>

        {pages.length > 0 && (
          <div className="-mx-6 mt-5 flex gap-2 overflow-x-auto px-6">
            {pages.map((r, i) => (
              <button key={i} type="button" onClick={() => setViewing(i)} aria-label={`Страница ${i + 1}, открыть`} className="w-14 shrink-0 active:scale-[0.98]">
                <PageArt n={i + 1} rot={r} />
              </button>
            ))}
            <span className="flex items-end pb-0.5 pl-1 text-sm whitespace-nowrap text-muted-foreground">
              <span className="font-mono">{pages.length}</span>&nbsp;{plural(pages.length, 'страница', 'страницы', 'страниц')}
            </span>
          </div>
        )}

        {cat === 'dip' && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface py-2.5 pr-1.5 pl-3">
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full bg-muted', endorse ? 'text-success' : 'text-primary')}>
              {endorse ? <Check className="size-4.5" strokeWidth={2.5} /> : <Stamp className="size-4.5" />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[15px] font-medium">Endorsement</span>
              <span className="text-sm text-muted-foreground">{endorse ? 'Фото добавлено' : 'Необязательно'}</span>
            </span>
            {endorse ? (
              <button type="button" aria-label="Убрать фото Endorsement" onClick={() => setEndorse(false)} className="flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground">
                <X className="size-4.5" />
              </button>
            ) : (
              <Button variant="ghost" className="h-10 text-[15px] text-primary" onClick={() => setEndorse(true)}>
                Добавить фото
              </Button>
            )}
          </div>
        )}

        {lowLeft > 0 && (
          <Note icon={TriangleAlert} tone="warning" className="mt-5 border border-border bg-surface">
            <span className="font-mono">{lowLeft}</span> {plural(lowLeft, 'поле плохо читается', 'поля плохо читаются', 'полей плохо читаются')} на фото — сверьте с документом.
          </Note>
        )}

        <Paper title={read.title} className="mt-5">
          <div className="flex flex-col gap-5 py-1">
            {read.fields.map((f) => {
              const id = `p19-${f.k}`
              const bad = tried && (dateBad(f) || missing(f))
              return (
                <Field
                  key={f.k}
                  id={id}
                  label={f.label}
                  tag={tag(f)}
                  error={bad ? (dateBad(f) ? 'Введите существующую дату в формате ДД.ММ.ГГГГ.' : 'Заполните это поле.') : null}
                  note={edited(f) && orig(f) ? <>В документе: <span className={cn(f.mono && 'font-mono')}>{orig(f)}</span></> : null}
                >
                  <TextInput
                    id={id}
                    mono={f.mono}
                    value={vals[f.k]}
                    invalid={bad}
                    inputMode={isDate(f) ? 'numeric' : undefined}
                    placeholder={isDate(f) ? 'ДД.ММ.ГГГГ' : 'Как в документе'}
                    className={cn(f.low && !edited(f) && !manual && 'border-warning')}
                    onChange={(e) => setVals({ ...vals, [f.k]: isDate(f) ? maskDate(e.target.value) : e.target.value })}
                  />
                </Field>
              )
            })}
          </div>
        </Paper>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Другие поля</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {other.length
              ? 'Этих полей приложение пока не знает. Они хранятся вместе с документом и не заполняют профиль. Уберите лишние.'
              : 'Чего-то не хватает? Добавьте поле — оно сохранится вместе с документом.'}
          </p>
          {other.length > 0 && (
            <ul className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
              {other.map((o) => (
                <li key={o.k} className="flex items-center gap-3 border-t border-border py-2 pr-1.5 pl-4 first:border-t-0">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      {o.label}
                      {o.mine && <SourceTag kind="you" />}
                    </span>
                    <span className="truncate text-[15px]">{o.value}</span>
                  </span>
                  <button type="button" aria-label={`Убрать «${o.label}»`} onClick={() => setOther(other.filter((x) => x.k !== o.k))} className="flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground">
                    <X className="size-4.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {adding ? (
            <div className="screen-in mt-3 flex flex-col gap-4 rounded-xl border border-border bg-surface px-4 py-4">
              <Field id="p19-new-label" label="Название поля">
                <TextInput id="p19-new-label" autoFocus value={adding.label} placeholder="Например: группа крови" onChange={(e) => setAdding({ ...adding, label: e.target.value })} />
              </Field>
              <Field id="p19-new-value" label="Значение" error={addErr}>
                <TextInput id="p19-new-value" value={adding.value} placeholder="Например: A+" onChange={(e) => setAdding({ ...adding, value: e.target.value })} />
              </Field>
              <div className="flex gap-2">
                <Button variant="ghost" className="h-11 text-[15px] text-muted-foreground" onClick={() => setAdding(null)}>
                  Отмена
                </Button>
                <Button variant="secondary" className="h-11 flex-1 text-[15px] text-primary" onClick={addOther}>
                  Добавить поле
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setAdding({ label: '', value: '', tried: false })} className="mt-3 flex items-center gap-2 px-1 text-[15px] font-medium text-primary">
              <Plus className="size-4" />
              Добавить поле
            </button>
          )}
        </section>

        <div className="mt-8 flex flex-col gap-3">
          {(manual || read.fields.some(edited)) && <Note icon={Info}>Администратор сверит {manual ? 'введённые данные' : 'исправления'} с фото документа.</Note>}
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Lock className="mt-0.5 size-4 shrink-0" />
            Подтверждённое попадает в профиль и в анкеты. Файлы агентства не видят.
          </p>
        </div>
      </div>

      <Footer className="border-t border-border pt-4">
        <Button size="lg" onClick={confirm}>
          Подтвердить
        </Button>
        <p className="min-h-5 text-center text-sm text-muted-foreground">{tried && problems.length ? 'Исправьте отмеченные поля' : ''}</p>
      </Footer>

      <BottomSheet
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={
          viewing !== null ? (
            <>
              Страница <span className="font-mono">{viewing + 1}</span> из <span className="font-mono">{pages.length}</span>
            </>
          ) : (
            ''
          )
        }
        footer={
          <Button size="lg" variant="ghost" className="text-primary" onClick={() => setViewing(null)}>
            Закрыть
          </Button>
        }
      >
        {viewing !== null && (
          <div className="flex justify-center py-4">
            <PageArt n={viewing + 1} rot={pages[viewing]} className="w-[64%]" />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
