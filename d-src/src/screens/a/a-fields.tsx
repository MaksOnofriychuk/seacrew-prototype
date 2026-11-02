import { useState } from 'react'
import { Database, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebSelect } from '@/components/web/fields'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { CATALOG, KNOWN_FIELDS, SYN_STATE_LABEL, type CatalogField, type SynState } from '@/lib/data-admin'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { AdminPage, Facts, Mono, Note, SideSheet, useBagState } from './_parts'

const TONE: Record<SynState, Tone> = { auto: 'success', admin: 'success', offer: 'warning', off: 'muted', none: 'muted' }
type Tab = 'all' | 'disputed' | 'none'
const isOn = (s: SynState) => s === 'auto' || s === 'admin'
const disputed = (f: CatalogField) => f.target !== null && f.rejected >= f.confirmed && f.confirmed + f.rejected > 0

// Підтвердили / відхилили — дві тонкі смуги пропорційно, числа поруч.
function Votes({ c, r }: { c: number; r: number }) {
  const total = c + r || 1
  return (
    <span className="flex items-center gap-3">
      <span className="flex h-1.5 w-20 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <span className="bg-success" style={{ width: `${(c / total) * 100}%` }} />
        <span className="ml-[2px] bg-signal" style={{ width: `${(r / total) * 100}%` }} />
      </span>
      <span className="text-sm">
        <Mono>{c}</Mono> <span className="text-muted-foreground">/</span> <Mono className={r ? 'text-signal' : 'text-muted-foreground'}>{r}</Mono>
      </span>
    </span>
  )
}

export function AFields({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [fields, setFields] = useBagState<CatalogField[]>('a.catalog', CATALOG)
  const [n, setN] = useBagState('a.synN', 3)
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [doc, setDoc] = useState('')
  const [src, setSrc] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [target, setTarget] = useState('')
  const open = fields.find((f) => f.id === openId)

  const rows = fields
    .filter((f) => (tab === 'disputed' ? disputed(f) : tab === 'none' ? f.target === null : true))
    .filter((f) => !doc || f.docType === doc)
    .filter((f) => !src || f.source === src)
    .filter((f) => !q || f.label.toLowerCase().includes(q.toLowerCase()))

  const update = (id: string, patch: Partial<CatalogField>, toast: string) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)))
    showToast(toast)
  }

  const columns: Column<CatalogField>[] = [
    {
      key: 'label',
      header: 'Как написано в документе',
      width: '22%',
      sortValue: (f) => f.label,
      cell: (f) => (
        <span className="flex items-baseline gap-2">
          <span className="truncate font-medium">{f.label}</span>
          <Mono className="text-xs text-muted-foreground">{f.lang}</Mono>
        </span>
      ),
    },
    {
      key: 'doc',
      header: 'Документ',
      width: '16%',
      sortValue: (f) => f.docType,
      cell: (f) => (
        <span className="flex flex-col leading-tight">
          <span className="truncate">{f.docType}</span>
          <span className="text-sm text-muted-foreground">{f.source === 'ai' ? 'нашёл ИИ' : 'вписал моряк'}</span>
        </span>
      ),
    },
    { key: 'people', header: 'Моряков', width: '9%', align: 'right', mono: true, sortValue: (f) => f.people, cell: (f) => f.people.toLocaleString('ru') },
    { key: 'target', header: 'Поле в профиле', width: '16%', sortValue: (f) => f.target ?? '', cell: (f) => (f.target ? f.target : <span className="text-muted-foreground">не выбрано</span>) },
    { key: 'votes', header: 'Подтвердили / нет', width: '16%', sortValue: (f) => f.confirmed - f.rejected, cell: (f) => (f.target ? <Votes c={f.confirmed} r={f.rejected} /> : <span className="text-muted-foreground">—</span>) },
    { key: 'state', header: 'Синоним', width: '13%', sortValue: (f) => f.state, cell: (f) => <StatusDot tone={TONE[f.state]}>{SYN_STATE_LABEL[f.state]}</StatusDot> },
    {
      key: 'on',
      header: '',
      width: '8%',
      align: 'right',
      cell: (f) =>
        f.target ? (
          <span onClick={(e) => e.stopPropagation()} className="inline-flex">
            <Switch
              aria-label={`Синоним ${f.label}`}
              checked={isOn(f.state)}
              onCheckedChange={(v) => update(f.id, { state: v ? 'admin' : 'off' }, v ? `«${f.label}» → ${f.target}: включено` : `«${f.label}»: синоним выключен`)}
            />
          </span>
        ) : null,
    },
  ]

  return (
    <AdminPage active="a-fields" go={go}>
      <PageHeader
        title="Каталог полей"
        description="Названия полей из подтверждённых документов — без значений. Синоним раскладывает такое поле в известное поле профиля; в инструкцию для ИИ каталог не попадает."
      />

      <div className="mb-6 flex items-center gap-6 rounded-xl border border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Меньше" disabled={n <= 1} onClick={() => setN(n - 1)}>
            <Minus />
          </Button>
          <span className="w-12 text-center font-mono text-2xl font-semibold text-primary" aria-live="polite">
            {n}
          </span>
          <Button variant="outline" size="icon" aria-label="Больше" disabled={n >= 20} onClick={() => setN(n + 1)}>
            <Plus />
          </Button>
        </div>
        <p className="max-w-[640px] text-[15px]">
          Синоним включается сам, когда его подтвердили <Mono>{n}</Mono> разных моряков и отклонений меньше, чем подтверждений. Включённые вами вручную автоматика не трогает.
        </p>
      </div>

      <PageTabs<Tab>
        tabs={[
          { id: 'all', label: 'Все', count: fields.length },
          { id: 'disputed', label: 'Спорные', count: fields.filter(disputed).length },
          { id: 'none', label: 'Без поля', count: fields.filter((f) => f.target === null).length },
        ]}
        value={tab}
        onChange={setTab}
      />
      <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Название поля' }} onReset={doc || src || q ? () => (setDoc(''), setSrc(''), setQ('')) : undefined} count={rows.length}>
        <FilterSelect label="Документ" value={doc} onChange={setDoc} options={[...new Set(CATALOG.map((f) => f.docType))]} />
        <FilterSelect label="Откуда" value={src} onChange={setSrc} options={[{ value: 'ai', label: 'Нашёл ИИ' }, { value: 'seafarer', label: 'Вписал моряк' }]} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(f) => f.id}
        onRowClick={(f) => (setOpenId(f.id), setTarget(f.target ?? ''))}
        selectedKey={openId ?? undefined}
        initialSort={{ key: 'people', dir: 'desc' }}
        empty={{ icon: Database, title: tab === 'disputed' ? 'Спорных синонимов нет' : 'Полей пока нет', text: 'Названия появятся, когда моряки подтвердят первые документы.' }}
      />

      <SideSheet
        open={!!open}
        onOpenChange={(v) => !v && setOpenId(null)}
        title={open ? `«${open.label}»` : ''}
        description={open ? `${open.docType}, язык ${open.lang}` : undefined}
        footer={
          open && (
            <>
              {isOn(open.state) && (
                <Button variant="outline" className="mr-auto" onClick={() => (update(open.id, { state: 'off' }, 'Синоним выключен'), setOpenId(null))}>
                  Выключить
                </Button>
              )}
              <Button disabled={!target} onClick={() => (update(open.id, { target, state: 'admin' }, `«${open.label}» → ${target}: включено`), setOpenId(null))}>
                {open.target && target === open.target && !isOn(open.state) ? 'Включить синоним' : 'Сохранить и включить'}
              </Button>
            </>
          )
        }
      >
        {open && (
          <>
            {disputed(open) && <Note tone="warning">Моряки чаще переносят значение в другое поле, чем оставляют здесь. Проверьте, то ли поле выбрано.</Note>}
            <Facts
              items={[
                ['Моряков видели', <Mono key="p">{open.people}</Mono>],
                ['Откуда', open.source === 'ai' ? 'Нашёл ИИ' : 'Вписал моряк'],
                ['Подтвердили', <Mono key="c">{open.confirmed}</Mono>],
                ['Перенесли в другое поле', <Mono key="r">{open.rejected}</Mono>],
              ]}
            />
            <WebField id="fld-target" label="Поле в профиле" hint="Значение ляжет в это поле. Моряк увидит и сможет перенести.">
              <WebSelect id="fld-target" value={target} onChange={setTarget} options={KNOWN_FIELDS} />
            </WebField>
          </>
        )}
      </SideSheet>
    </AdminPage>
  )
}
