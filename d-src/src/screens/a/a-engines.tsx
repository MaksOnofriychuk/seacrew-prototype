import { useState } from 'react'
import { Cpu, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebSelect } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { ENGINES, ENGINE_CHANGES, ENGINE_STATE_LABEL, POLICY_LABEL, type Engine, type EngineChange, type EngineState } from '@/lib/data-admin'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { AdminPage, Mono, Note, SectionTitle, dt, useBagState } from './_parts'

const TONE: Record<EngineState, Tone> = { working: 'success', 'disabled-by-admin': 'muted', 'daily-limit': 'warning', 'missing-key': 'error', 'rate-limited': 'warning' }
const usd = (n: number) => '$' + n.toFixed(2).replace('.', ',')
const now = () => '2026-11-02 ' + new Date().toTimeString().slice(0, 5)

function LimitInput({ label, value, onChange, placeholder, w = 'w-24' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; w?: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <input
        value={value}
        inputMode="decimal"
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
        onClick={(e) => e.stopPropagation()}
        placeholder={placeholder}
        className={cn('h-8 rounded-md border border-border bg-surface px-2 font-mono text-sm text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground focus:border-primary', w)}
      />
    </label>
  )
}

function Limits({ e, onSave }: { e: Engine; onSave: (patch: Partial<Engine>, what: string[]) => void }) {
  const [req, setReq] = useState(e.reqLimit?.toString() ?? '')
  const [usdL, setUsd] = useState(e.usdLimit?.toString() ?? '')
  const [to, setTo] = useState(e.timeout?.toString() ?? '')
  const dirty = req !== (e.reqLimit?.toString() ?? '') || usdL !== (e.usdLimit?.toString() ?? '') || to !== (e.timeout?.toString() ?? '')
  const num = (s: string) => (s ? Number(s.replace(',', '.')) : null)
  const badTimeout = !!to && (Number(to) < 10 || Number(to) > 300)
  const save = () => {
    const what: string[] = []
    const show = (v: number | null, unit = '') => (v === null ? 'без лимита' : v + unit)
    if (num(req) !== e.reqLimit) what.push(`Запусков в день: ${show(e.reqLimit)} → ${show(num(req))}`)
    if (num(usdL) !== e.usdLimit) what.push(`USD в день: ${show(e.usdLimit)} → ${show(num(usdL))}`)
    if (num(to) !== e.timeout) what.push(`Тайм-аут: ${e.timeout ? e.timeout + ' с' : 'по умолчанию'} → ${to ? to + ' с' : 'по умолчанию'}`)
    onSave({ reqLimit: num(req), usdLimit: num(usdL), timeout: num(to) }, what)
  }
  return (
    <div className="flex items-end gap-2 py-1">
      <LimitInput label="Запусков" value={req} onChange={setReq} placeholder="без лимита" />
      <LimitInput label="USD" value={usdL} onChange={setUsd} placeholder="без лимита" />
      <LimitInput label="Тайм-аут, с" value={to} onChange={setTo} placeholder="60" w="w-16" />
      <Button size="sm" variant={dirty ? 'default' : 'outline'} disabled={!dirty || badTimeout} onClick={save} title={badTimeout ? 'Тайм-аут — от 10 до 300 с' : undefined}>
        Сохранить
      </Button>
    </div>
  )
}

export function AEngines({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [engines, setEngines] = useBagState<Engine[]>('a.engines', ENGINES)
  const [log, setLog] = useBagState<EngineChange[]>('a.engineLog', ENGINE_CHANGES)
  const [docs, setDocs] = useBagState('a.engineDocs', 'claude-sonnet')
  const [blanks, setBlanks] = useBagState('a.engineBlanks', 'gpt-vision')

  const write = (engine: string, what: string[]) => setLog([...what.map((w, i) => ({ id: `n${Date.now()}${i}`, when: now(), who: 'admin@seafolio.example', engine, what: w })), ...log])

  const toggle = (e: Engine, on: boolean) => {
    setEngines(engines.map((x) => (x.id === e.id ? { ...x, enabled: on, state: on ? (x.runs >= (x.reqLimit ?? Infinity) ? 'daily-limit' : 'working') : 'disabled-by-admin' } : x)))
    write(e.id, [`Включён: ${on ? 'выкл. → вкл.' : 'вкл. → выкл.'}`])
    showToast(`${e.label} ${on ? 'включён' : 'выключен'}`)
  }

  const save = (e: Engine, patch: Partial<Engine>, what: string[]) => {
    setEngines(engines.map((x) => (x.id === e.id ? { ...x, ...patch } : x)))
    write(e.id, what)
    showToast('Лимиты сохранены')
  }

  const label = (id: string) => engines.find((e) => e.id === id)?.label ?? id
  const pickDefault = (role: 'docs' | 'blanks', id: string) => {
    const before = role === 'docs' ? docs : blanks
    if (role === 'docs') setDocs(id)
    else setBlanks(id)
    write(id, [`По умолчанию для ${role === 'docs' ? 'документов' : 'бланков'}: ${label(before)} → ${label(id)}`])
    showToast('Движок по умолчанию изменён')
  }
  const opts = (forms: boolean) => engines.filter((e) => !forms || e.readsForms).map((e) => ({ value: e.id, label: e.enabled && e.state !== 'missing-key' ? e.label : `${e.label} (выключен)` }))

  const columns: Column<Engine>[] = [
    {
      key: 'engine',
      header: 'Движок',
      width: '22%',
      sortValue: (e) => e.label,
      cell: (e) => (
        <span className="flex flex-col leading-tight">
          <span className="truncate font-medium">
            {e.label}
            {(e.id === docs || e.id === blanks) && <span className="ml-2 text-xs font-normal text-primary">{e.id === docs ? 'документы' : 'бланки'}</span>}
          </span>
          <span className="truncate text-sm text-muted-foreground">{POLICY_LABEL[e.policy]}</span>
        </span>
      ),
    },
    { key: 'state', header: 'Состояние', width: '20%', sortValue: (e) => e.state, cell: (e) => <StatusDot tone={TONE[e.state]}>{ENGINE_STATE_LABEL[e.state]}</StatusDot> },
    {
      key: 'on',
      header: 'Включён',
      width: '8%',
      cell: (e) => (
        <Switch
          aria-label={`${e.label}: включён`}
          checked={e.enabled}
          disabled={e.state === 'missing-key'}
          title={e.state === 'missing-key' ? 'Без ключа движок не включить' : undefined}
          onCheckedChange={(v) => toggle(e, v)}
        />
      ),
    },
    {
      key: 'today',
      header: 'Сегодня',
      width: '11%',
      sortValue: (e) => e.runs,
      cell: (e) => (
        <span className="flex flex-col leading-tight">
          <span>
            <Mono>{e.runs}</Mono> <span className="text-muted-foreground">запусков</span>
          </span>
          <span className="text-sm text-muted-foreground">{e.tier === 'free' ? 'бесплатно' : <Mono>{usd(e.cost)}</Mono>}</span>
        </span>
      ),
    },
    { key: 'limits', header: 'Лимит в сутки и тайм-аут', cell: (e) => <Limits key={`${e.id}-${e.reqLimit}-${e.usdLimit}-${e.timeout}`} e={e} onSave={(p, w) => save(e, p, w)} /> },
  ]

  const logCols: Column<EngineChange>[] = [
    { key: 'when', header: 'Когда', width: '18%', mono: true, sortValue: (c) => c.when, cell: (c) => dt(c.when) },
    { key: 'who', header: 'Кто', width: '24%', cell: (c) => <span className="text-muted-foreground">{c.who}</span> },
    { key: 'engine', header: 'Движок', width: '20%', cell: (c) => label(c.engine) },
    { key: 'what', header: 'Что изменилось', cell: (c) => c.what },
  ]

  return (
    <AdminPage active="a-engines" go={go}>
      <PageHeader title="Движки распознавания" description="Включайте и выключайте движки и ограничивайте, сколько каждый может сделать за сутки (UTC). Каждое изменение пишется в журнал." />
      <Note className="mb-6">Аварийный выключатель на сервере главнее любого переключателя здесь. Движок без ключа включить нельзя, и ни один переключатель не открывает движку реальные документы.</Note>

      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] items-end gap-6 rounded-xl border border-border bg-surface px-6 py-5">
        <WebField id="eng-docs" label="По умолчанию для документов">
          <WebSelect id="eng-docs" value={docs} onChange={(v) => pickDefault('docs', v)} options={opts(false)} />
        </WebField>
        <WebField id="eng-blanks" label="По умолчанию для бланков">
          <WebSelect id="eng-blanks" value={blanks} onChange={(v) => pickDefault('blanks', v)} options={opts(true)} />
        </WebField>
        <p className="pb-1 text-sm text-muted-foreground">Документы моряков читает первый, если моряк не выбрал другой. Бланки агентств — второй, остальные включённые идут запасными.</p>
      </div>

      <DataTable columns={columns} rows={engines} rowKey={(e) => e.id} empty={{ icon: Cpu, title: 'Движков нет', text: 'Подключённые движки появятся здесь после настройки ключей на сервере.' }} />

      <SectionTitle>Журнал изменений</SectionTitle>
      <DataTable columns={logCols} rows={log} rowKey={(c) => c.id} initialSort={{ key: 'when', dir: 'desc' }} empty={{ icon: History, title: 'Изменений пока нет', text: 'Здесь появится, кто и когда менял движки и лимиты.' }} />
    </AdminPage>
  )
}
