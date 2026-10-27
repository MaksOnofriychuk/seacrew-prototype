import { useState, type ComponentType, type ReactNode } from 'react'
import { Camera, ChevronRight, FileText, FolderOpen, GraduationCap, HeartPulse, IdCard, Lock, PenLine, Plus, ScanLine, TriangleAlert, Trash2 } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { Paper } from '@/components/app/paper'
import { TabBar } from '@/components/app/tab-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ActionRow, FORM_DEFAULTS, Note, TextInput, type QForm } from '../q/_parts'
import { useHashParams, type DocData } from '../s/_core-parts'
import { AppSheet, plural, TAB_TO, TabHead, useApp } from './_app-parts'

type Go = (id: string) => void
type Icon = ComponentType<{ className?: string }>

/* ================= дані документів ================= */

// «Сьогодні» в прототипі — фіксоване, щоб строки на знімках не «пливли».
const TODAY = new Date(2026, 9, 27)

export function daysLeft(exp: string) {
  const m = exp.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!m) return null
  const d = new Date(+m[3], +m[2] - 1, +m[1])
  return Math.round((d.getTime() - TODAY.getTime()) / 86400000)
}

// Строк на плашці: лише для документа, що спливає (за 60 днів — перше нагадування) або вже сплив.
export function expiry(exp: string | null): { text: string; variant: 'warning' | 'error' | 'success' } | null {
  if (!exp) return null
  const n = daysLeft(exp)
  if (n === null) return null
  if (n < 0) return { text: 'Срок истёк', variant: 'error' }
  if (n <= 60) return { text: `Истекает через ${n} ${plural(n, 'день', 'дня', 'дней')}`, variant: 'warning' }
  return { text: 'Действует', variant: 'success' }
}

type Field = { k: string; label: string; value: string; mono?: boolean }
type Group = 'sid' | 'dip' | 'med' | 'cv'

export type Doc = {
  id: string
  group: Group
  icon: Icon
  title: string
  /** назва на «папері»; немає — це не документ (CV), шапки primary не буде */
  paper?: string
  num?: string
  exp: string | null
  fields: Field[]
  note: string
  photo: string
}

export const GROUPS: { id: Group; title: string }[] = [
  { id: 'sid', title: 'Документ моряка' },
  { id: 'dip', title: 'Дипломы и сертификаты' },
  { id: 'med', title: 'Медицинские' },
  { id: 'cv', title: 'CV' },
]

// Медичний документ для знімків (?med=1) — той самий, що на s5?demo=1.
const DEMO_MED: { id: string; d: DocData } = {
  id: 'demo',
  d: { name: 'Медосмотр (PEME)', num: 'MC-0001', issue: '14.11.2024', exp: '14.11.2026', noExp: false, country: 'Украина', file: true },
}

const mask = (num: string, prefix = '') => (num ? `${prefix}•••${num.slice(-3)}` : '')

export function useDocs() {
  const { bag } = useApp()
  const params = useHashParams()
  const form = bag<{ v: QForm } | null>('q.form', null)?.v ?? FORM_DEFAULTS
  const edits = bag<Record<string, Record<string, string>>>('doc.edits', {})
  const hidden = bag<string[]>('docs.hidden', [])
  const demoMed = params.get('med') === '1' || bag<boolean>('docs.demoMed', false)
  const meds = bag<{ id: string; d: DocData }[]>('s5.docs', [])
  const s = (k: string) => String(form[k] ?? '')
  const name = `${s('first')} ${s('last')}`.trim()

  const list: Doc[] = [
    {
      id: 'sid',
      group: 'sid',
      icon: IdCard,
      title: 'Удостоверение личности моряка',
      paper: s('docName'),
      num: `${s('docNum').slice(0, 3)}${mask(s('docNum'))}`,
      exp: form.docNoExp ? null : s('docExp'),
      fields: [
        { k: 'name', label: 'Имя и фамилия', value: name },
        { k: 'num', label: 'Номер', value: s('docNum'), mono: true },
        { k: 'issue', label: 'Дата выдачи', value: s('docIssue'), mono: true },
        { k: 'exp', label: 'Действует до', value: form.docNoExp ? 'Без срока' : s('docExp'), mono: !form.docNoExp },
        { k: 'country', label: 'Страна выдачи', value: s('docCountry') },
      ],
      note: 'Данные прочитаны из документа и подтверждены вами.',
      photo: 'Заменить фото',
    },
    {
      id: 'dip',
      group: 'dip',
      icon: GraduationCap,
      title: `Диплом ${s('dipRank')}`,
      paper: s('dipName'),
      num: mask(s('dipNum'), '№ '),
      exp: form.dipNoExp ? null : s('dipExp'),
      fields: [
        { k: 'rank', label: 'Должность', value: s('dipRank') },
        { k: 'stcw', label: 'Правило STCW', value: s('dipStcw'), mono: true },
        { k: 'level', label: 'Уровень', value: s('dipLevel') },
        { k: 'num', label: 'Номер', value: s('dipNum'), mono: true },
        { k: 'issue', label: 'Дата выдачи', value: s('dipIssue'), mono: true },
        { k: 'exp', label: 'Действует до', value: form.dipNoExp ? 'Без срока' : s('dipExp'), mono: !form.dipNoExp },
        { k: 'country', label: 'Страна выдачи', value: s('dipCountry') },
      ],
      note: 'Данные прочитаны из документа и подтверждены вами.',
      photo: 'Заменить фото',
    },
    // Медичні — лише ті, що моряк ввів сам на кроці «Медицинские» (ИИ їх не читає).
    ...(meds.length ? meds : demoMed ? [DEMO_MED] : []).map(
      (m): Doc => ({
        id: `med-${m.id}`,
        group: 'med',
        icon: HeartPulse,
        title: m.d.name || 'Медицинский документ',
        paper: m.d.name || 'Медицинский документ',
        num: mask(m.d.num),
        exp: m.d.noExp ? null : m.d.exp,
        fields: [
          { k: 'num', label: 'Номер', value: m.d.num, mono: true },
          { k: 'issue', label: 'Дата выдачи', value: m.d.issue, mono: true },
          { k: 'exp', label: 'Действует до', value: m.d.noExp ? 'Без срока' : m.d.exp, mono: !m.d.noExp },
          { k: 'country', label: 'Страна выдачи', value: m.d.country },
        ],
        note: 'Данные введены вами. Администратор сверит их с фото документа.',
        photo: 'Заменить фото',
      }),
    ),
    {
      id: 'cv',
      group: 'cv',
      icon: FileText,
      title: 'CV',
      exp: null,
      fields: [
        { k: 'file', label: 'Файл', value: `${s('first') || 'CV'}_${s('last') || 'file'}.pdf` },
        { k: 'date', label: 'Загружено', value: '25.10.2026', mono: true },
      ],
      note: 'Данные из CV перенесены в профиль после вашего подтверждения.',
      photo: 'Заменить файл',
    },
  ]

  // Правки моряка поверх прочитаних даних.
  const docs = list
    .filter((d) => !hidden.includes(d.id))
    .map((d) => {
      const e = edits[d.id]
      if (!e) return d
      const fields = d.fields.map((f) => (e[f.k] !== undefined ? { ...f, value: e[f.k] } : f))
      return { ...d, fields, exp: e.exp !== undefined && d.exp ? e.exp : d.exp }
    })
  return { docs, edits, demoMed }
}

/* ================= p02 — документи ================= */

export function DocsScreen({ go }: { go: Go }) {
  const { setBag, showToast } = useApp()
  const { docs, demoMed } = useDocs()
  const [add, setAdd] = useState(false)
  const warn = docs.filter((d) => expiry(d.exp)?.variant !== 'success' && expiry(d.exp))

  const open = (id: string) => {
    setBag('doc.sel', id)
    if (demoMed) setBag('docs.demoMed', true)
    go('p11')
  }
  const picked = () => {
    setAdd(false)
    showToast('Документ загружен. Когда ИИ его прочитает, попросим проверить данные')
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <TabHead
          title="Документы"
          onMenu={() => go('p04')}
          action={
            <button type="button" aria-label="Добавить документ" onClick={() => setAdd(true)} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95">
              <Plus className="size-5" strokeWidth={2.25} />
            </button>
          }
        />
        <div className="flex flex-col px-4 pt-3">
          <p className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
            <Lock className="size-3.5 shrink-0 text-success" />
            Файлы зашифрованы. Агентства видят их только с вашего разрешения.
          </p>
          {warn.map((d) => (
            <Note key={d.id} icon={TriangleAlert} tone="warning" className="mt-4 border border-border bg-surface">
              <span className="font-medium">
                {d.title}: {expiry(d.exp)?.text.toLowerCase()}.
              </span>{' '}
              Мы напомним ещё раз за <span className="font-mono">7</span> дней до окончания срока.
            </Note>
          ))}
          <ul className="mt-5 overflow-hidden rounded-xl border border-border bg-surface">
            {GROUPS.map((g) => {
              const items = docs.filter((d) => d.group === g.id)
              return (
                <li key={g.id} className="border-t border-border first:border-t-0">
                  <h2 className="px-4 pt-3.5 -mb-1 text-sm text-muted-foreground">{g.title}</h2>
                  <ul>
                    {items.map((d) => (
                      <DocRow key={d.id} d={d} onClick={() => open(d.id)} />
                    ))}
                    {!items.length &&
                      (g.id === 'med' ? (
                        <AddRow icon={HeartPulse} title="Добавить медицинский документ" sub="Часто нужен в анкетах. Вводится вручную, с отдельным согласием" onClick={() => go('s5')} />
                      ) : (
                        <AddRow icon={Plus} title="Добавить документ" sub="ИИ прочитает документ, вы проверите данные" onClick={() => setAdd(true)} />
                      ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <TabBar active="docs" onTab={(t) => (t === 'docs' ? undefined : go(TAB_TO[t]))} />
      <AppSheet open={add} onClose={() => setAdd(false)} title="Добавить документ" description="ИИ прочитает документ, вы проверите данные.">
        <ActionRow icon={ScanLine} title="Сканировать документ" sub="Края найдутся сами" onClick={picked} />
        <ActionRow icon={Camera} title="Сфотографировать" sub="При хорошем свете, без бликов" onClick={picked} />
        <ActionRow icon={FolderOpen} title="Выбрать файл" sub="PDF или изображение" onClick={picked} />
        <ActionRow icon={HeartPulse} title="Медицинский документ" sub="Вводится вручную, ИИ его не читает" onClick={() => go('s5')} />
        <Button size="lg" variant="ghost" className="mt-3 text-primary" onClick={() => setAdd(false)}>
          Отмена
        </Button>
      </AppSheet>
    </div>
  )
}

function DocRow({ d, onClick }: { d: Doc; onClick: () => void }) {
  const ex = expiry(d.exp)
  const urgent = ex && ex.variant !== 'success' ? ex : null
  const sub = d.group === 'cv' ? d.fields[0].value : d.num
  return (
    <li className="border-t border-border first:border-t-0">
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <d.icon className="size-5 shrink-0 text-primary" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-medium">{d.title}</span>
          <span className="text-sm text-muted-foreground">
            <span className={d.group === 'cv' ? undefined : 'font-mono'}>{sub}</span>
            {d.exp && (
              <>
                , до <span className="font-mono">{d.exp}</span>
              </>
            )}
          </span>
          {urgent && (
            <Badge variant={urgent.variant} className="mt-1 font-normal">
              {urgent.text}
            </Badge>
          )}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </li>
  )
}

function AddRow({ icon: Icon, title, sub, onClick }: { icon: Icon; title: string; sub: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
          <Icon className="size-4.5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-medium text-primary">{title}</span>
          <span className="text-sm text-muted-foreground">{sub}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </li>
  )
}

/* ================= p11 — документ ================= */

export function DocScreen({ go }: { go: Go }) {
  const { bag, setBag, showToast } = useApp()
  const { docs, edits } = useDocs()
  const sel = bag<string>('doc.sel', 'sid')
  const d = docs.find((x) => x.id === sel) ?? docs[0]
  const [edit, setEdit] = useState<Record<string, string> | null>(null)
  const [sheet, setSheet] = useState<'photo' | 'delete' | null>(null)
  const ex = expiry(d.exp)
  const changed = edits[d.id] ?? {}
  const canEdit = d.group !== 'cv'

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
    showToast(d.group === 'cv' ? 'CV заменено. Новые данные покажем на проверку' : 'Фото заменено. Если ИИ найдёт другие данные, попросим их проверить')
  }

  const body = (
    <>
      <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-md bg-muted text-primary">
        <d.icon className="size-9" />
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="size-3.5 text-success" />
          Зашифровано
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
              <dd className="flex flex-col items-end text-right">
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
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <h1 className="mt-2 text-[26px] leading-tight font-semibold tracking-tight">{d.title}</h1>
        {ex && (
          <Badge variant={ex.variant} className="mt-2 h-7 px-3 text-sm font-normal">
            {ex.text}
          </Badge>
        )}

        <div className="mt-5">{d.paper ? <Paper title={d.paper}>{body}</Paper> : <div className="rounded-xl border border-border bg-surface px-5 py-4">{body}</div>}</div>
        <p className="mt-3 px-1 text-sm text-muted-foreground">{edit ? 'Правку увидит администратор и сверит её с фото документа.' : d.note}</p>

        {!edit && (
          <>
            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
              <MenuRow icon={Camera} title={d.photo} onClick={() => setSheet('photo')} />
              {canEdit && <MenuRow icon={PenLine} title="Изменить данные" onClick={() => setEdit({})} />}
            </div>
            <button type="button" onClick={() => setSheet('delete')} className="mt-6 flex items-center gap-2 px-1 text-[15px] font-medium text-signal">
              <Trash2 className="size-4" />
              Удалить документ
            </button>
          </>
        )}
      </div>
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
      <AppSheet open={sheet === 'photo'} onClose={() => setSheet(null)} title={d.photo} description="ИИ прочитает новый файл, вы проверите данные.">
        <ActionRow icon={ScanLine} title="Сканировать документ" sub="Края найдутся сами" onClick={replaced} />
        <ActionRow icon={Camera} title="Сфотографировать" sub="При хорошем свете, без бликов" onClick={replaced} />
        <ActionRow icon={FolderOpen} title="Выбрать файл" sub="PDF или изображение" onClick={replaced} />
        <Button size="lg" variant="ghost" className="mt-3 text-primary" onClick={() => setSheet(null)}>
          Отмена
        </Button>
      </AppSheet>
      <AppSheet
        open={sheet === 'delete'}
        onClose={() => setSheet(null)}
        title="Удалить документ?"
        description="Файл и данные документа удалятся из профиля. Агентства больше не увидят его в ваших анкетах."
      >
        <div className="flex flex-col gap-2">
          <Button size="lg" variant="outline" className="border-signal text-signal" onClick={remove}>
            Удалить документ
          </Button>
          <Button size="lg" variant="ghost" className="text-primary" onClick={() => setSheet(null)}>
            Отмена
          </Button>
        </div>
      </AppSheet>
    </div>
  )
}

function MenuRow({ icon: Icon, title, onClick }: { icon: Icon; title: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-13 w-full items-center gap-3 border-t border-border px-4 py-3 text-left first:border-t-0">
      <Icon className="size-5 shrink-0 text-primary" />
      <span className="flex-1 text-[15px]">{title}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}
