import { useState, type ReactNode } from 'react'
import { BookOpen, ChevronRight, Plus } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebInput, WebSelect } from '@/components/web/fields'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { FLEETS, FLEET_TREE, SECONDARY_DEPARTMENTS, type Fleet } from '@/lib/data'
import { OTHER_ENTRIES, VESSEL_TYPES, type OtherEntry } from '@/lib/data-admin'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { AdminPage, CancelButton, Mono, SideSheet, dt, useBagState } from './_parts'

type Tab = 'tree' | 'vessels' | 'other'
type Tree = Record<string, Record<string, string[]>>

const sortDepts = (ds: string[]) => [...ds.filter((d) => !SECONDARY_DEPARTMENTS.includes(d)).sort(), ...ds.filter((d) => SECONDARY_DEPARTMENTS.includes(d))]

export function ARefs({ go }: ScreenProps) {
  const [others] = useBagState<string[]>('a.otherDone', [])
  const pending = OTHER_ENTRIES.filter((o) => !others.includes(o.id)).length
  const [tab, setTab] = useBagState<Tab>('a.refsTab', 'tree')
  return (
    <AdminPage active="a-refs" go={go}>
      <PageHeader title="Справочники" description="Списки, из которых моряки и агентства выбирают флот, департамент, должность и тип судна. Меняете их только вы — в приложении новое видно сразу." />
      <PageTabs<Tab>
        tabs={[
          { id: 'tree', label: 'Флоты, департаменты, должности' },
          { id: 'vessels', label: 'Типы судов', count: VESSEL_TYPES.length },
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
  const [tree, setTree] = useBagState<Tree>('a.tree', FLEET_TREE as Tree)
  const [fleet, setFleet] = useState<string>('Merchant')
  const [dept, setDept] = useState<string>('Engine')
  const [add, setAdd] = useState<'fleet' | 'dept' | 'pos' | null>(null)
  const [name, setName] = useState('')
  const depts = sortDepts(Object.keys(tree[fleet] ?? {}))
  const positions = [...(tree[fleet]?.[dept] ?? [])].sort()

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
    <ViewState loading={{ kind: 'cards', rows: 1 }} empty={{ icon: BookOpen, title: 'Справочник пуст', text: 'Добавьте первый флот — затем департаменты и должности в нём.' }}>
      <div className="grid h-[560px] grid-cols-[1fr_1fr_1.3fr] overflow-hidden rounded-xl border border-border bg-surface">
        <MillerCol title="Флот" count={Object.keys(tree).length} onAdd={() => setAdd('fleet')}>
          {Object.keys(tree).map((f) => (
            <Item key={f} label={f} hint={`${Object.values(tree[f]).flat().length}`} active={f === fleet} chevron onClick={() => (setFleet(f), setDept(sortDepts(Object.keys(tree[f]))[0] ?? ''))} />
          ))}
        </MillerCol>
        <MillerCol title="Департамент" count={depts.length} onAdd={() => setAdd('dept')}>
          {depts.map((d) => (
            <Item key={d} label={d} hint={`${tree[fleet][d].length}`} active={d === dept} chevron muted={SECONDARY_DEPARTMENTS.includes(d)} onClick={() => setDept(d)} />
          ))}
        </MillerCol>
        <MillerCol title="Должность" count={positions.length} onAdd={dept ? () => setAdd('pos') : undefined} last>
          {positions.map((p) => (
            <Item key={p} label={p} onClick={() => showToast(`${p}: переименовать или убрать можно после согласования списков`)} />
          ))}
          {!positions.length && <p className="px-5 py-4 text-sm text-muted-foreground">{dept ? 'Должностей пока нет.' : 'Выберите департамент.'}</p>}
        </MillerCol>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Вторичные департаменты (Hotel & Entertainment, Other) в приложении стоят в конце списка.</p>

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

function MillerCol({ title, count, onAdd, last, children }: { title: string; count: number; onAdd?: () => void; last?: boolean; children: ReactNode }) {
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
      <div className="min-h-0 flex-1 overflow-y-auto py-1">{children}</div>
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
  const [fleet, setFleet] = useState('')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [nf, setNf] = useState('')
  const rows = list.filter((v) => !fleet || v.fleet === fleet).filter((v) => !q || v.name.toLowerCase().includes(q.toLowerCase()))
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
        <FilterSelect label="Флот" value={fleet} onChange={setFleet} options={[...FLEETS]} />
        <Button variant="outline" className="h-10 text-primary" onClick={() => setAdding(true)}>
          <Plus /> Добавить тип
        </Button>
      </FilterBar>
      <DataTable columns={columns} rows={rows} rowKey={(v) => v.name} onRowClick={(v) => showToast(v.jobs ? `${v.name} есть в вакансиях — его можно только переименовать` : `${v.name} нигде не используется — можно убрать`)} empty={{ icon: BookOpen, title: 'Типов судов нет', text: 'Добавьте первый тип и выберите, к какому флоту он относится.' }} />
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
  const rows = OTHER_ENTRIES.filter((o) => !done.includes(o.id))
  const finish = (id: string, toast: string) => {
    setDone([...done, id])
    showToast(toast)
  }

  const options = (o: OtherEntry) => {
    if (o.list === 'Тип судна') return VESSEL_TYPES.map((v) => v.name)
    const [f, d] = o.context.split(' → ')
    return [...(FLEET_TREE[f as Fleet]?.[d] ?? [])].sort()
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
    { key: 'c', header: 'Где', width: '24%', cell: (o) => <span className="text-muted-foreground">{o.context}</span> },
    { key: 'p', header: 'Моряков', width: '10%', align: 'right', mono: true, sortValue: (o) => o.people, cell: (o) => o.people },
    { key: 'd', header: 'Впервые', width: '12%', mono: true, sortValue: (o) => o.first, cell: (o) => dt(o.first) },
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
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => finish(o.id, `«${o.text}» отклонено`)}>
            Отклонить
          </Button>
        </span>
      ),
    },
  ]

  return (
    <>
      <p className="mb-4 max-w-[720px] text-[15px] text-muted-foreground">Если нужного пункта нет, моряк выбирает «Other» и вписывает своё. Добавьте пункт в справочник или замените на существующий — у моряков значение обновится само.</p>
      <DataTable columns={columns} rows={rows} rowKey={(o) => o.id} initialSort={{ key: 'p', dir: 'desc' }} empty={{ icon: BookOpen, title: 'Всё разобрано', text: 'Новые «Other» от моряков появятся здесь.' }} />
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
