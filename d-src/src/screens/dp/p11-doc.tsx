import { useState } from 'react'
import { Camera, FolderOpen, Image, Lock, PenLine, Trash2 } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { Footer, NavBar } from '@/components/app/chrome'
import { Paper } from '@/components/app/paper'
import { ViewState } from '@/components/app/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { ActionRow, MenuRow, PageArt, plural, TextInput, useDP } from './_parts'
import { expiry, useDocs } from './_docs'

// p11 — документ (будь-який з p02, зокрема загранпаспорт і візи — правка №36): документ як папір,
// сторінки зашифровані, дані з документа. «Изменить данные» — поля прямо на папері; правку видно
// адміністратору. «Другие поля» — те, що прочитано, але профіль не заповнює. Видалення — з підтвердженням.

export function P11Doc({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useDP()
  const { docs, edits } = useDocs()
  const sel = bag<string>('doc.sel', 'sid')
  const d = docs.find((x) => x.id === sel) ?? docs[0]
  const [edit, setEdit] = useState<Record<string, string> | null>(null)
  const [sheet, setSheet] = useState<'photo' | 'delete' | null>(null)

  if (!d) {
    return (
      <div className="flex h-full flex-col">
        <NavBar title="Документ" onBack={() => go('p02')} />
        <ViewState error={{ title: 'Документ не найден' }}>
          <div className="px-6 py-10 text-[15px] text-muted-foreground">Документ удалён.</div>
        </ViewState>
      </div>
    )
  }

  const ex = expiry(d.exp)
  const changed = edits[d.id] ?? {}
  const isFile = d.group === 'cv'

  const save = () => {
    if (!edit) return
    const diff = Object.fromEntries(Object.entries(edit).filter(([k, v]) => d.fields.find((f) => f.k === k)?.value !== v))
    if (Object.keys(diff).length) {
      setBag('doc.edits', { ...edits, [d.id]: { ...changed, ...diff } })
      showToast('Изменения сохранены. Администратор сверит их с документом')
    }
    setEdit(null)
  }
  const remove = () => {
    setBag('docs.hidden', [...bag<string[]>('docs.hidden', []), d.id])
    showToast('Документ удалён')
    go('p02')
  }
  const replaced = () => {
    setSheet(null)
    showToast(isFile ? 'CV заменено. Новые данные покажем на проверку' : 'Фото заменено. Если в нём другие данные, попросим их проверить')
  }

  const body = (
    <>
      <div className="flex items-center gap-3 rounded-md bg-muted p-3">
        <div className="flex gap-1.5">
          {Array.from({ length: Math.min(d.pages, 3) }, (_, i) => (
            <PageArt key={i} n={i + 1} className="w-11 rounded-[5px]" />
          ))}
        </div>
        <span className="flex min-w-0 flex-col">
          <span className="text-[15px] font-medium">
            <span className="font-mono">{d.pages}</span> {plural(d.pages, 'страница', 'страницы', 'страниц')}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-3.5 text-success" />
            Зашифровано
          </span>
        </span>
      </div>
      <dl className="mt-3">
        {d.fields.map((f) => (
          <div key={f.k} className="flex items-center justify-between gap-4 border-t border-border py-2.5 first:border-t-0">
            <dt className="shrink-0 text-[15px] text-muted-foreground">{f.label}</dt>
            {edit && !(f.k === 'exp' && !d.exp) && f.k !== 'file' && f.k !== 'date' ? (
              <TextInput
                aria-label={f.label}
                mono={f.mono}
                value={edit[f.k] ?? f.value}
                onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })}
                className="h-10 w-44 shrink-0 text-right text-[15px] md:text-[15px]"
              />
            ) : (
              <dd className="flex min-w-0 flex-col items-end text-right">
                <span className={cn('text-[15px] font-medium', f.mono && 'font-mono font-normal')}>{f.value}</span>
                {changed[f.k] !== undefined && <span className="text-xs text-muted-foreground">исправлено вами</span>}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </>
  )

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Документ" onBack={() => go('p02')} />
      <ViewState loading={{ kind: 'cards', rows: 2 }} error={{ title: 'Не удалось открыть документ' }} empty={{ icon: Lock, title: 'Документ удалён', text: 'Его больше нет в профиле и в анкетах.' }}>
        <div className="screen-in min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <h1 className="mt-2 text-[26px] leading-tight font-semibold tracking-tight">{d.title}</h1>
          {ex && (
            <Badge variant={ex.variant} className="mt-2 h-7 px-3 text-sm font-normal">
              {ex.text}
            </Badge>
          )}

          <div className="mt-5">{d.paper ? <Paper title={d.paper}>{body}</Paper> : <div className="rounded-xl border border-border bg-surface px-5 py-4">{body}</div>}</div>
          <p className="mt-3 px-1 text-sm text-muted-foreground">{edit ? 'Правку увидит администратор и сверит её с фото документа.' : d.note}</p>

          {!edit && d.other && d.other.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground">Другие поля</h2>
              <dl className="rounded-xl border border-border bg-surface px-4">
                {d.other.map((o) => (
                  <div key={o.k} className="flex items-baseline justify-between gap-4 border-t border-border py-2.5 first:border-t-0">
                    <dt className="text-[15px] text-muted-foreground">{o.label}</dt>
                    <dd className="text-right text-[15px]">{o.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 px-1 text-sm text-muted-foreground">Хранятся вместе с документом и не заполняют профиль.</p>
            </section>
          )}

          {!edit && (
            <>
              <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
                <MenuRow icon={Camera} title={d.photo} onClick={() => setSheet('photo')} />
                {!isFile && <MenuRow icon={PenLine} title="Изменить данные" onClick={() => setEdit({})} />}
              </div>
              <button type="button" onClick={() => setSheet('delete')} className="mt-6 flex items-center gap-2 px-1 text-[15px] font-medium text-signal">
                <Trash2 className="size-4" />
                Удалить документ
              </button>
            </>
          )}
        </div>
      </ViewState>
      {edit && (
        <Footer className="flex-row border-t border-border bg-surface">
          <Button size="lg" variant="ghost" className="w-auto text-muted-foreground" onClick={() => setEdit(null)}>
            Отмена
          </Button>
          <Button size="lg" className="flex-1" onClick={save}>
            Сохранить изменения
          </Button>
        </Footer>
      )}
      <BottomSheet open={sheet === 'photo'} onClose={() => setSheet(null)} title={d.photo} description={isFile ? 'PDF или документ Word.' : 'Сфотографируйте или загрузите страницу с фото и данными.'}>
        {!isFile && <ActionRow icon={Camera} title="Сфотографировать" onClick={replaced} />}
        {!isFile && <ActionRow icon={Image} title="Выбрать из галереи" onClick={replaced} />}
        <ActionRow icon={FolderOpen} title="Выбрать файл" sub={isFile ? undefined : 'PDF или изображение'} onClick={replaced} />
        <Button size="lg" variant="ghost" className="mt-3 text-primary" onClick={() => setSheet(null)}>
          Отмена
        </Button>
      </BottomSheet>
      <BottomSheet
        open={sheet === 'delete'}
        onClose={() => setSheet(null)}
        title="Удалить документ?"
        description="Файл и данные документа удалятся из профиля. Агентства больше не увидят их в ваших анкетах."
      >
        <div className="flex flex-col gap-2">
          <Button size="lg" variant="outline" className="border-signal text-signal" onClick={remove}>
            Удалить документ
          </Button>
          <Button size="lg" variant="ghost" className="text-primary" onClick={() => setSheet(null)}>
            Отмена
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
