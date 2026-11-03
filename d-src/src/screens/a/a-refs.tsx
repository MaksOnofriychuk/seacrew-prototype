import { useState, type ReactNode } from 'react'
import { ArrowDownAZ, ArrowUpAZ, BookOpen, ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebInput, WebSelect } from '@/components/web/fields'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader } from '@/components/web/page-header'
import { FLEETS, SECONDARY_DEPARTMENTS } from '@/lib/data'
import { type OtherEntry } from '@/lib/data-admin'
import { ALL_OTHER, ALL_VESSELS, buildTree53 } from '@/lib/data-admin-53-h'
import { WebDialog } from '@/components/web/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { AdminPage, AdminTabs, CancelButton, Mono, WebMultiSelect, SideSheet, dt, useBagState } from './_parts'

type Tab = 'tree' | 'vessels' | 'other'
type Tree = Record<string, Record<string, string[]>>
const TREE53: Tree = buildTree53()
const VESSEL_TYPES = ALL_VESSELS
const OTHER_ENTRIES = ALL_OTHER
const SIZES = [10, 20, 50]

const sortDepts = (ds: string[]) => [...ds.filter((d) => !SECONDARY_DEPARTMENTS.includes(d)).sort(), ...ds.filter((d) => SECONDARY_DEPARTMENTS.includes(d))]

export function ARefs({ go }: ScreenProps) {
  const [others] = useBagState<string[]>('a.otherDone', [])
  const pending = OTHER_ENTRIES.filter((o) => !others.includes(o.id)).length
  const [tree] = useBagState<Tree>('a.tree', TREE53)
  const [vessels] = useBagState('a.vessels', VESSEL_TYPES)
  const [tab, setTab] = useBagState<Tab>('a.refsTab', 'tree')
  return (
    <AdminPage active="a-refs" go={go}>
      <PageHeader title="Справочники" description="Списки, из которых моряки и агентства выбирают флот, департамент, должность и тип судна. Меняете их только вы — в приложении новое видно сразу." />
      <AdminTabs<Tab>
        tabs={[
          { id: 'tree', label: 'Флоты, департаменты, должности', count: Object.values(tree).reduce((n, f) => n + Object.values(f).flat().length, 0) },
          { id: 'vessels', label: 'Типы судов', count: vessels.length },
          { id: 'other', label: '«Other» на проверке', count: pending },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'tree' && <TreeView />}
      {tab === 'vessels' && <Vessels />}
      {tab === 'other' && <Others />}
    </AdminPage>
  )
}

// Три колонки, як у виборі на телефоні: флот → департамент → посада.
function TreeView() {
  const { showToast } = useProto()
  const [tree, setTree] = useBagState<Tree>('a.tree', TREE53)
  const [fleet, setFleet] = useState<string>('Merchant')
  const [dept, setDept] = useState<string>('Engine')
  const [add, setAdd] = useState<'fleet' | 'dept' | 'pos' | null>(null)
  const [name, setName] = useState('')
  const [editPos, setEditPos] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [pq, setPq] = useState('')
  const [pdir, setPdir] = useState<'asc' | 'desc'>('asc')
  const [psize, setPsize] = useState(10)
  const [ppage, setPpage] = useState(0)
  const depts = sortDepts(Object.keys(tree[fleet] ?? {}))
  const allPos = [...(tree[fleet]?.[dept] ?? [])].sort((a, b) => (pdir === 'asc' ? a.localeCompare(b) : b.localeCompare(a)))
  const found = pq.trim() ? allPos.filter((p) => p.toLowerCase().includes(pq.trim().toLowerCase())) : allPos
  const pages = Math.max(1, Math.ceil(found.length / psize))
  const cur = Math.min(ppage, pages - 1)
  const positions = found.slice(cur * psize, (cur + 1) * psize)
  const pick = (f: string, d: string) => (setFleet(f), setDept(d), setPq(''), setPpage(0))

  const save = () => {
    const n = name.trim()
    if (!n) return
    if (add === 'fleet') {
      setTree({ ...tree, [n]: {} })
      setFleet(n)
      setDept('')
    } else if (add === 'dept') {
      setTree({ ...tree, [fleet]: { ...tree[fleet], [n]: [] } })
      setDept(n)
    } else if (add === 'pos') {
      setTree({ ...tree, [fleet]: { ...tree[fleet], [dept]: [...(tree[fleet][dept] ?? []), n] } })
    }
    showToast(`Добавлено: ${n}`)
    setName('')
    setAdd(null)
  }

  const where = add === 'dept' ? `во флот ${fleet}` : add === 'pos' ? `в ${fleet} → ${dept}` : ''

  return (
    <ViewState loading={<MillerSkeleton />} empty={{ icon: BookOpen, title: 'Справочник пуст', text: 'Добавьте первый флот — затем департаменты и должности в нём.' }}>
      <div className="grid h-[620px] grid-cols-[1fr_1fr_1.4fr] overflow-hidden rounded-xl border border-border bg-surface">
        <MillerCol title="Флот" count={Object.keys(tree).length} onAdd={() => setAdd('fleet')}>
          {Object.keys(tree).map((f) => (
            <Item key={f} label={f} hint={`${Object.values(tree[f]).flat().length}`} active={f === fleet} chevron onClick={() => pick(f, sortDepts(Object.keys(tree[f]))[0] ?? '')} />
          ))}
        </MillerCol>
        <MillerCol title="Департамент" count={depts.length} onAdd={() => setAdd('dept')}>
          {depts.map((d) => (
            <Item key={d} label={d} hint={`${tree[fleet][d].length}`} active={d === dept} chevron muted={SECONDARY_DEPARTMENTS.includes(d)} onClick={() => pick(fleet, d)} />
          ))}
        </MillerCol>
        <MillerCol
          title="Должность"
          count={found.length}
          onAdd={dept ? () => setAdd('pos') : undefined}
          last
          toolbar={
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-2.5 focus-within:border-primary">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input value={pq} onChange={(e) => (setPq(e.target.value), setPpage(0))} placeholder="Найти должность" aria-label="Найти должность" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                {pq && (
                  <button type="button" aria-label="Очистить" onClick={() => setPq('')} className="text-muted-foreground">
                    <X className="size-4" />
                  </button>
                )}
              </label>
              <Button variant="outline" size="icon" aria-label={pdir === 'asc' ? 'Сортировка: А — Я' : 'Сортировка: Я — А'} title={pdir === 'asc' ? 'Сортировка: А — Я' : 'Сортировка: Я — А'} onClick={() => setPdir(pdir === 'asc' ? 'desc' : 'asc')}>
                {pdir === 'asc' ? <ArrowDownAZ /> : <ArrowUpAZ />}
              </Button>
            </div>
          }
          footer={
            found.length > SIZES[0] ? (
              <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2 text-sm">
                <Select value={String(psize)} onValueChange={(x) => (setPsize(Number(x)), setPpage(0))}>
                  <SelectTrigger size="sm" aria-label="Сколько строк показывать" className="w-[96px] bg-surface font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((n) => (
                      <SelectItem key={n} value={String(n)} className="font-mono">
                        по {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="font-mono text-muted-foreground">
                  {cur * psize + 1}–{Math.min((cur + 1) * psize, found.length)} из {found.length}
                </span>
                <span className="flex">
                  <button type="button" aria-label="Предыдущая страница" disabled={cur === 0} onClick={() => setPpage(cur - 1)} className="flex size-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent">
                    <ChevronLeft className="size-4" />
                  </button>
                  <button type="button" aria-label="Следующая страница" disabled={cur === pages - 1} onClick={() => setPpage(cur + 1)} className="flex size-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent">
                    <ChevronRight className="size-4" />
                  </button>
                </span>
              </div>
            ) : undefined
          }
        >
          {positions.map((p) => (
            <Item key={p} label={p} onClick={() => (setEditPos(p), setNewName(p))} />
          ))}
          {!positions.length && <p className="px-5 py-4 text-sm text-muted-foreground">{!dept ? 'Выберите департамент.' : pq ? 'Ничего не найдено. Измените запрос.' : 'Должностей пока нет.'}</p>}
        </MillerCol>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Вторичные департаменты (Hotel & Entertainment, Other) в приложении стоят в конце списка.</p>

      <SideSheet
        open={editPos !== null}
        onOpenChange={(v) => !v && setEditPos(null)}
        title={editPos ?? ''}
        description={`${fleet} → ${dept}`}
        footer={
          <>
            <Button variant="ghost" className="mr-auto text-signal" onClick={() => editPos && (setTree({ ...tree, [fleet]: { ...tree[fleet], [dept]: tree[fleet][dept].filter((x) => x !== editPos) } }), showToast(`Убрано: ${editPos}. У моряков значение сохранится как есть`), setEditPos(null))}>
              Убрать из списка
            </Button>
            <CancelButton onClick={() => setEditPos(null)} />
            <Button
              disabled={!newName.trim() || newName.trim() === editPos}
              onClick={() => editPos && (setTree({ ...tree, [fleet]: { ...tree[fleet], [dept]: tree[fleet][dept].map((x) => (x === editPos ? newName.trim() : x)) } }), showToast(`Переименовано: ${newName.trim()}`), setEditPos(null))}
            >
              Переименовать
            </Button>
          </>
        }
      >
        <WebField id="pos-name" label="Название" hint="Как в морских документах, на английском.">
          <WebInput id="pos-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        </WebField>
      </SideSheet>

      <SideSheet
        open={!!add}
        onOpenChange={(v) => !v && setAdd(null)}
        title={add === 'fleet' ? 'Новый флот' : add === 'dept' ? 'Новый департамент' : 'Новая должность'}
        description={where ? `Добавится ${where}.` : 'Затем добавьте в него департаменты и должности.'}
        footer={
          <>
            <CancelButton onClick={() => setAdd(null)} />
            <Button disabled={!name.trim()} onClick={save}>
              Добавить
            </Button>
          </>
        }
      >
        <WebField id="ref-name" label="Название" hint="Как в морских документах, на английском.">
          <WebInput id="ref-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={add === 'pos' ? 'Reefer Engineer' : add === 'dept' ? 'Safety / HSE' : 'Inland'} autoFocus />
        </WebField>
      </SideSheet>
    </ViewState>
  )
}

// Завантаження: ті самі три колонки, у кожній — сірі рядки замість пунктів.
function MillerSkeleton() {
  const widths = [['w-24', 'w-20', 'w-28', 'w-16', 'w-24'], ['w-20', 'w-16', 'w-24'], ['w-28', 'w-24', 'w-32', 'w-20', 'w-28', 'w-24']]
  return (
    <div aria-busy="true" aria-label="Загрузка" className="grid h-[620px] grid-cols-[1fr_1fr_1.4fr] overflow-hidden rounded-xl border border-border bg-surface">
      {widths.map((col, i) => (
        <div key={i} className={cn('flex flex-col', i < 2 && 'border-r border-border')}>
          <div className="flex h-12 shrink-0 items-center border-b border-border px-5">
            <span className="block h-3 w-20 rounded-full bg-muted" />
          </div>
          <div className="flex flex-col py-1">
            {col.map((w, j) => (
              <div key={j} className="flex h-10 items-center px-5">
                <span className={cn('block h-3 rounded-full bg-muted', w)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MillerCol({ title, count, onAdd, last, toolbar, footer, children }: { title: string; count: number; onAdd?: () => void; last?: boolean; toolbar?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className={cn('flex min-h-0 flex-col', !last && 'border-r border-border')}>
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border pr-2 pl-5">
        <span className="text-sm font-medium text-muted-foreground">
          {title} <Mono className="ml-1 text-xs">{count}</Mono>
        </span>
        {onAdd && (
          <Button variant="ghost" size="sm" className="text-primary" onClick={onAdd}>
            <Plus /> Добавить
          </Button>
        )}
      </div>
      {toolbar}
      <div className="min-h-0 flex-1 overflow-y-auto py-1">{children}</div>
      {footer}
    </div>
  )
}

function Item({ label, hint, active, chevron, muted, onClick }: { label: string; hint?: string; active?: boolean; chevron?: boolean; muted?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={cn('flex h-10 w-full items-center gap-2 px-5 text-left text-[15px] transition-colors', active ? 'bg-muted font-medium text-primary' : 'hover:bg-muted', muted && !active && 'text-muted-foreground')}
    >
      <span className="flex-1 truncate">{label}</span>
      {hint && <Mono className="text-xs text-muted-foreground">{hint}</Mono>}
      {chevron && <ChevronRight className={cn('size-4', active ? 'text-primary' : 'text-muted-foreground/60')} />}
    </button>
  )
}

function Vessels() {
  const { showToast } = useProto()
  const [list, setList] = useBagState('a.vessels', VESSEL_TYPES)
  const [fleets, setFleets] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<string | null>(null)
  const [vname, setVname] = useState('')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [nf, setNf] = useState('')
  const rows = list.filter((v) => !fleets.length || fleets.includes(v.fleet)).filter((v) => !q || v.name.toLowerCase().includes(q.toLowerCase()))
  const columns: Column2[] = [
    { key: 'n', header: 'Тип судна', width: '40%', sortValue: (v) => v.name, cell: (v) => <span className="font-medium">{v.name}</span> },
    { key: 'f', header: 'Флот', width: '30%', sortValue: (v) => v.fleet, cell: (v) => v.fleet },
    { key: 'j', header: 'Вакансий сейчас', align: 'right', mono: true, sortValue: (v) => v.jobs, cell: (v) => v.jobs },
  ]
  const add = () => {
    setList([...list, { name: name.trim(), fleet: nf, jobs: 0 }])
    showToast(`Добавлено: ${name.trim()}`)
    setAdding(false)
    setName('')
    setNf('')
  }
  return (
    <>
      <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Тип судна' }} count={rows.length}>
        <WebMultiSelect label="Флот" className="w-[260px]" values={fleets} onChange={setFleets} options={[...FLEETS]} />
        <Button variant="outline" className="h-10 text-primary" onClick={() => setAdding(true)}>
          <Plus /> Добавить тип
        </Button>
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(v) => v.name}
        pageSizes={SIZES}
        initialSort={{ key: 'n', dir: 'asc' }}
        sortOptions={[
          { key: 'n', dir: 'asc', label: 'Название: А — Я' },
          { key: 'n', dir: 'desc', label: 'Название: Я — А' },
          { key: 'j', dir: 'desc', label: 'Вакансии: сначала больше' },
          { key: 'j', dir: 'asc', label: 'Вакансии: сначала меньше' },
          { key: 'f', dir: 'asc', label: 'Флот: А — Я' },
        ]}
        onRowClick={(v) => (setEdit(v.name), setVname(v.name))} empty={{ icon: BookOpen, title: 'Типов судов нет', text: 'Добавьте первый тип и выберите, к какому флоту он относится.' }} />
      <SideSheet
        open={edit !== null}
        onOpenChange={(v) => !v && setEdit(null)}
        title={edit ?? ''}
        description={(() => {
          const j = list.find((v) => v.name === edit)?.jobs ?? 0
          return j ? `Есть в вакансиях: ${j}. Убрать нельзя, переименовать можно.` : 'Нигде не используется, можно убрать.'
        })()}
        footer={
          <>
            {!(list.find((v) => v.name === edit)?.jobs) && (
              <Button variant="ghost" className="mr-auto text-signal" onClick={() => (setList(list.filter((v) => v.name !== edit)), showToast(`Убрано: ${edit}`), setEdit(null))}>
                Убрать
              </Button>
            )}
            <CancelButton onClick={() => setEdit(null)} />
            <Button disabled={!vname.trim() || vname.trim() === edit} onClick={() => (setList(list.map((v) => (v.name === edit ? { ...v, name: vname.trim() } : v))), showToast(`Переименовано: ${vname.trim()}`), setEdit(null))}>
              Переименовать
            </Button>
          </>
        }
      >
        <WebField id="vt-edit" label="Название" hint="Как в морских документах, на английском.">
          <WebInput id="vt-edit" value={vname} onChange={(e) => setVname(e.target.value)} />
        </WebField>
      </SideSheet>
      <SideSheet
        open={adding}
        onOpenChange={setAdding}
        title="Новый тип судна"
        description="Появится в выборе типа судна у моряков и агентств."
        footer={
          <>
            <CancelButton onClick={() => setAdding(false)} />
            <Button disabled={!name.trim() || !nf} onClick={add}>
              Добавить
            </Button>
          </>
        }
      >
        <WebField id="vt-name" label="Название" hint="Как в морских документах, на английском.">
          <WebInput id="vt-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Heavy Lift Vessel" />
        </WebField>
        <WebField id="vt-fleet" label="Флот">
          <WebSelect id="vt-fleet" value={nf} onChange={setNf} options={[...FLEETS]} />
        </WebField>
      </SideSheet>
    </>
  )
}
type Column2 = Column<(typeof VESSEL_TYPES)[number]>

function Others() {
  const { showToast } = useProto()
  const [done, setDone] = useBagState<string[]>('a.otherDone', [])
  const [replace, setReplace] = useState<OtherEntry | null>(null)
  const [target, setTarget] = useState('')
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const [reject, setReject] = useState<OtherEntry | null>(null)
  const rows = OTHER_ENTRIES.filter((o) => !done.includes(o.id)).filter((o) => !kind || o.list === kind).filter((o) => !q.trim() || `${o.text} ${o.context}`.toLowerCase().includes(q.trim().toLowerCase()))
  const finish = (id: string, toast: string) => {
    setDone([...done, id])
    showToast(toast)
  }

  const options = (o: OtherEntry) => {
    if (o.list === 'Тип судна') return VESSEL_TYPES.map((v) => v.name)
    const [f, d] = o.context.split(' → ')
    return [...(TREE53[f]?.[d] ?? [])].sort()
  }

  const columns: Column<OtherEntry>[] = [
    {
      key: 't',
      header: 'Что вписали',
      width: '24%',
      sortValue: (o) => o.text,
      cell: (o) => (
        <span className="flex flex-col leading-tight">
          <span className="font-medium">{o.text}</span>
          <span className="text-sm text-muted-foreground">{o.list}</span>
        </span>
      ),
    },
    { key: 'c', header: 'Где', width: '31%', sortValue: (o) => o.context, cell: (o) => <span className="text-muted-foreground" title={o.context}>{o.context}</span> },
    { key: 'p', header: 'Моряков', width: '9%', align: 'right', mono: true, sortValue: (o) => o.people, cell: (o) => o.people },
    { key: 'd', header: 'Впервые', width: '11%', mono: true, sortValue: (o) => o.first, cell: (o) => dt(o.first) },
    {
      key: 'a',
      header: '',
      align: 'right',
      cell: (o) => (
        <span className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="text-primary" onClick={() => finish(o.id, `«${o.text}» добавлено в справочник`)}>
            Добавить
          </Button>
          <Button variant="ghost" size="sm" onClick={() => (setReplace(o), setTarget(''))}>
            Заменить
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setReject(o)}>
            Отклонить
          </Button>
        </span>
      ),
    },
  ]

  return (
    <>
      <p className="mb-4 max-w-[720px] text-[15px] text-muted-foreground">Если нужного пункта нет, моряк выбирает «Other» и вписывает своё. Добавьте пункт в справочник или замените на существующий — у моряков значение обновится само.</p>
      <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Что вписали или где' }} onReset={q || kind ? () => (setQ(''), setKind('')) : undefined} count={rows.length}>
        <FilterSelect label="Список" value={kind} onChange={setKind} options={['Должность', 'Тип судна']} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(o) => o.id}
        initialSort={{ key: 'p', dir: 'desc' }}
        pageSizes={SIZES}
        sortOptions={[
          { key: 'p', dir: 'desc', label: 'Моряков: сначала больше' },
          { key: 'p', dir: 'asc', label: 'Моряков: сначала меньше' },
          { key: 'd', dir: 'desc', label: 'Впервые: сначала новые' },
          { key: 'd', dir: 'asc', label: 'Впервые: сначала старые' },
          { key: 't', dir: 'asc', label: 'Текст: А — Я' },
          { key: 'c', dir: 'asc', label: 'Где: А — Я' },
        ]}
        empty={{ icon: BookOpen, title: 'Всё разобрано', text: 'Новые «Other» от моряков появятся здесь.' }} />
      <WebDialog
        open={!!reject}
        onClose={() => setReject(null)}
        title={`Отклонить «${reject?.text ?? ''}»?`}
        description={reject ? `У ${reject.people} моряков значение останется как вписано, в справочник оно не попадёт.` : undefined}
        footer={
          <>
            <CancelButton onClick={() => setReject(null)} />
            <Button variant="destructive" onClick={() => (reject && finish(reject.id, `«${reject.text}» отклонено`), setReject(null))}>
              Отклонить
            </Button>
          </>
        }
      />
      <SideSheet
        open={!!replace}
        onOpenChange={(v) => !v && setReplace(null)}
        title={`Заменить «${replace?.text ?? ''}»`}
        description={replace ? `У ${replace.people} моряков значение станет выбранным пунктом.` : undefined}
        footer={
          <>
            <CancelButton onClick={() => setReplace(null)} />
            <Button disabled={!target} onClick={() => (replace && finish(replace.id, `«${replace.text}» заменено на ${target}`), setReplace(null))}>
              Заменить
            </Button>
          </>
        }
      >
        {replace && (
          <WebField id="oth-target" label={replace.list === 'Тип судна' ? 'Тип судна' : `Должность в ${replace.context}`}>
            <WebSelect id="oth-target" value={target} onChange={setTarget} options={options(replace)} />
          </WebField>
        )}
      </SideSheet>
    </>
  )
}
