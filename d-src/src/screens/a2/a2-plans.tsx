import { useState, type ReactNode } from 'react'
import { Building2, Layers, Pencil } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebCheckbox, WebField, WebInput, WebSelect } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { COMPANY_PLANS, ORG_PLANS, SEARCH_LABEL, money, type CompanyPlan, type OrgPlanRow } from '@/lib/data-admin-2'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { AdminPage, AdminTabs, CancelButton, Facts, Mono, Note, SideSheet, dt, useBagState } from '../a/_parts'
import { Sample } from './_parts'

type Tab = 'plans' | 'orgs'
const ORG_STATE: Record<OrgPlanRow['state'], { tone: Tone; label: string }> = {
  ok: { tone: 'success', label: 'Оплачен' },
  overdue: { tone: 'error', label: 'Оплата не прошла' },
  free: { tone: 'muted', label: 'Бесплатно' },
}
const LEVEL_TEXT = ['Не нужна', 'Уровень 1', 'Уровень 2']
const lim = (n: number | null) => (n === null ? <span className="text-muted-foreground">Без лимита</span> : <Mono>{n.toLocaleString('ru')}</Mono>)

type Draft = Record<string, Record<string, string | boolean>>
const toDraft = (plans: CompanyPlan[]): Draft =>
  Object.fromEntries(
    plans.map((p) => [
      p.id,
      { month: String(p.month), year: String(p.year), recruiters: p.recruiters === null ? '' : String(p.recruiters), jobs: p.jobs === null ? '' : String(p.jobs), invites: p.invites === null ? '' : String(p.invites), search: p.search, forms: p.forms, minLevel: String(p.minLevel) },
    ]),
  )
const num = (s: string | boolean) => (s === '' ? null : Number(s))

export function A2Plans({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [tab, setTab] = useState<Tab>('plans')
  const [plans, setPlans] = useBagState<CompanyPlan[]>('a2.plans', COMPANY_PLANS)
  const [orgPlans, setOrgPlans] = useBagState<OrgPlanRow[]>('a2.orgPlans', ORG_PLANS)
  const [, setOrg] = useBagState('a.org', 'org-mc')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => toDraft(plans))
  const [openOrg, setOpenOrg] = useState<string | null>(null)
  const [newPlan, setNewPlan] = useState('')
  const org = orgPlans.find((o) => o.orgId === openOrg)

  const setD = (id: string, k: string, v: string | boolean) => setDraft({ ...draft, [id]: { ...draft[id], [k]: v } })
  const bad = (s: string | boolean, allowEmpty = false) => typeof s === 'string' && (s === '' ? !allowEmpty : !(Number(s) >= 0 && Number.isFinite(Number(s))))
  const invalid = plans.some((p) => bad(draft[p.id].month) || bad(draft[p.id].year))

  const save = () => {
    setPlans(
      plans.map((p) => {
        const d = draft[p.id]
        return { ...p, month: Number(d.month), year: Number(d.year), recruiters: num(d.recruiters), jobs: num(d.jobs), invites: num(d.invites), search: d.search as CompanyPlan['search'], forms: !!d.forms, minLevel: Number(d.minLevel) as 0 | 1 | 2 }
      }),
    )
    setEditing(false)
    showToast('Тарифы сохранены. Новые цены — со следующей оплаты')
  }

  const cellInput = (id: string, k: string, placeholder?: string) => (
    <WebInput aria-label={k} inputMode="numeric" value={draft[id][k] as string} onChange={(e) => setD(id, k, e.target.value)} placeholder={placeholder} className={cn('h-9 font-mono', bad(draft[id][k], !!placeholder) && 'border-signal')} />
  )

  // лимиты выбираются из ряда значений (правило 4); «Без лимита» — пустое значение
  const limitSelect = (id: string, k: string, steps: number[]) => {
    const cur = draft[id][k] as string
    const all = [...new Set([...steps, ...(cur ? [Number(cur)] : [])])].sort((a, b) => a - b)
    return (
      <WebSelect
        value={cur || 'none'}
        onChange={(v) => setD(id, k, v === 'none' ? '' : v)}
        options={[{ value: 'none', label: 'Без лимита' }, ...all.map((n) => ({ value: String(n), label: n.toLocaleString('ru') }))]}
        className="h-9 data-[size=default]:h-9 font-mono"
      />
    )
  }

  const ROWS: { label: string; hint?: string; view: (p: CompanyPlan) => ReactNode; edit: (p: CompanyPlan) => ReactNode }[] = [
    { label: 'Рекрутеров в компании', view: (p) => lim(p.recruiters), edit: (p) => limitSelect(p.id, 'recruiters', [1, 2, 3, 5, 10, 25]) },
    { label: 'Активных вакансий', view: (p) => lim(p.jobs), edit: (p) => limitSelect(p.id, 'jobs', [1, 3, 5, 10, 25, 50, 100]) },
    { label: 'Приглашений морякам в месяц', view: (p) => lim(p.invites), edit: (p) => limitSelect(p.id, 'invites', [10, 25, 50, 100, 250, 500, 1000, 2500]) },
    {
      label: 'Поиск по базе моряков',
      view: (p) => SEARCH_LABEL[p.search],
      edit: (p) => <WebSelect value={draft[p.id].search as string} onChange={(v) => setD(p.id, 'search', v)} options={Object.entries(SEARCH_LABEL).map(([value, label]) => ({ value, label }))} className="h-9 data-[size=default]:h-9" />,
    },
    {
      label: 'Анкеты и импорт анкет',
      view: (p) => (p.forms ? 'Есть' : <span className="text-muted-foreground">Нет</span>),
      edit: (p) => (
        <WebCheckbox id={`forms-${p.id}`} checked={!!draft[p.id].forms} onChange={(v) => setD(p.id, 'forms', v)}>
          Есть
        </WebCheckbox>
      ),
    },
    {
      label: 'Нужна проверка компании',
      view: (p) => (p.minLevel ? LEVEL_TEXT[p.minLevel] : <span className="text-muted-foreground">Не нужна</span>),
      edit: (p) => <WebSelect value={draft[p.id].minLevel as string} onChange={(v) => setD(p.id, 'minLevel', v)} options={LEVEL_TEXT.map((l, i) => ({ value: String(i), label: l }))} className="h-9 data-[size=default]:h-9" />,
    },
  ]

  const orgCols: Column<OrgPlanRow>[] = [
    { key: 'org', header: 'Организация', width: '30%', sortValue: (o) => o.org, cell: (o) => <span className="font-medium">{o.org}</span> },
    { key: 'plan', header: 'Тариф', width: '14%', sortValue: (o) => o.plan, cell: (o) => o.plan },
    { key: 'since', header: 'С', width: '13%', mono: true, sortValue: (o) => o.since, cell: (o) => dt(o.since) },
    { key: 'next', header: 'Следующая оплата', width: '16%', mono: true, sortValue: (o) => o.next ?? '9999', cell: (o) => (o.next ? dt(o.next) : <span className="font-sans text-muted-foreground">—</span>) },
    { key: 'ch', header: 'Как', width: '10%', cell: (o) => <span className="text-muted-foreground">{o.channel}</span> },
    { key: 'state', header: 'Статус', sortValue: (o) => o.state, cell: (o) => <StatusDot tone={ORG_STATE[o.state].tone}>{ORG_STATE[o.state].label}</StatusDot> },
  ]

  return (
    <AdminPage active="a2-plans" go={go}>
      <PageHeader
        title="Тарифы компаний"
        description="Сколько платят агентства и что получают за эти деньги. Изменения цен действуют со следующей оплаты, лимиты — сразу."
        meta={
          <span className="flex items-center gap-2">
            Цены и лимиты — для примера, модель оплаты компаний ещё не выбрана <Sample q="160–161" />
          </span>
        }
        actions={
          tab === 'plans' &&
          !editing && (
            <Button variant="outline" onClick={() => (setDraft(toDraft(plans)), setEditing(true))}>
              <Pencil /> Изменить тарифы
            </Button>
          )
        }
      />
      <AdminTabs<Tab>
        tabs={[
          { id: 'plans', label: 'Тарифы', count: plans.length },
          { id: 'orgs', label: 'Компании на тарифах', count: orgPlans.length },
        ]}
        value={tab}
        onChange={(t) => (setTab(t), setEditing(false))}
      />

      {tab === 'plans' ? (
        <ViewState loading={{ kind: 'cards', rows: 1 }} empty={{ icon: Layers, title: 'Тарифов нет', text: 'Все компании работают бесплатно.' }}>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col style={{ width: '28%' }} />
                {plans.map((p) => (
                  <col key={p.id} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-border align-top">
                  <th scope="col" className="px-6 py-5 font-normal">
                    <span className="flex flex-col gap-1">
                      <span className="text-[15px] font-semibold">Что получает компания</span>
                      <span className="text-sm text-muted-foreground">Так тарифы видят агентства при выборе и оплате.</span>
                    </span>
                  </th>
                  {plans.map((p) => (
                    <th key={p.id} scope="col" className="border-l border-border px-6 py-5 font-normal">
                      <span className="flex flex-col gap-2">
                        <span className="text-lg font-semibold">{p.name}</span>
                        {editing ? (
                          <span className="grid grid-cols-2 gap-2">
                            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                              $ в месяц
                              {cellInput(p.id, 'month')}
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                              $ в год
                              {cellInput(p.id, 'year')}
                            </label>
                          </span>
                        ) : (
                          <span className="flex flex-col">
                            <span className="flex items-baseline gap-1.5">
                              <Mono className="text-[32px] leading-none font-semibold tracking-tight">{p.month ? money(p.month) : '$0'}</Mono>
                              <span className="text-sm text-muted-foreground">{p.month ? 'в месяц' : 'бесплатно'}</span>
                            </span>
                            <span className="mt-1 text-sm text-muted-foreground">{p.year ? <>или <Mono>{money(p.year)}</Mono> в год</> : 'навсегда'}</span>
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          Компаний: <Mono className="text-foreground">{p.orgs}</Mono>
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.label} className="border-t border-border first:border-t-0">
                    <th scope="row" className="px-6 py-3.5 text-[15px] font-normal text-muted-foreground">
                      {r.label}
                    </th>
                    {plans.map((p) => (
                      <td key={p.id} className="h-14 border-l border-border px-6 py-2 text-[15px]">
                        {editing ? r.edit(p) : r.view(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {editing && (
              <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/50 px-6 py-4">
                <span className="mr-auto text-sm text-muted-foreground">Компании получат письмо об изменениях.</span>
                <CancelButton onClick={() => setEditing(false)} />
                <Button disabled={invalid} onClick={save}>
                  Сохранить тарифы
                </Button>
              </div>
            )}
          </div>
          {!editing && <Note className="mt-6">Компания, которая не оплатила тариф, через 7 дней переходит на «Старт». Вакансии сверх лимита снимаются с публикации, но не удаляются.</Note>}
        </ViewState>
      ) : (
        <DataTable
          columns={orgCols}
          rows={orgPlans}
          rowKey={(o) => o.orgId}
          onRowClick={(o) => (setOpenOrg(o.orgId), setNewPlan(o.plan))}
          selectedKey={openOrg ?? undefined}
          initialSort={{ key: 'next', dir: 'asc' }}
          empty={{ icon: Building2, title: 'Компаний на тарифах нет', text: 'Когда агентство выберет тариф, оно появится здесь.' }}
        />
      )}

      <SideSheet
        open={!!org}
        onOpenChange={(v) => !v && setOpenOrg(null)}
        title={org?.org}
        description={org ? `Сейчас тариф «${org.plan}»` : undefined}
        footer={
          org && (
            <>
              <Button variant="ghost" className="mr-auto text-primary" onClick={() => (setOrg(org.orgId), go('a-org'))}>
                Карточка организации
              </Button>
              <Button
                disabled={newPlan === org.plan}
                onClick={() => {
                  setOrgPlans(orgPlans.map((o) => (o.orgId === org.orgId ? { ...o, plan: newPlan, state: newPlan === 'Старт' ? 'free' : o.state === 'free' ? 'ok' : o.state, next: newPlan === 'Старт' ? null : (o.next ?? '2026-12-02') } : o)))
                  showToast(`${org.org}: тариф «${newPlan}»`)
                  setOpenOrg(null)
                }}
              >
                Сменить тариф
              </Button>
            </>
          )
        }
      >
        {org && (
          <>
            <Facts
              items={[
                ['Тариф с', <Mono key="s">{dt(org.since)}</Mono>],
                ['Следующая оплата', org.next ? <Mono key="n">{dt(org.next)}</Mono> : '—'],
                ['Как платит', org.channel],
                ['Статус', <StatusDot key="st" tone={ORG_STATE[org.state].tone}>{ORG_STATE[org.state].label}</StatusDot>],
              ]}
            />
            <WebField id="op-plan" label="Тариф" hint="Смена без оплаты — например, на время теста. Компания получит письмо.">
              <WebSelect id="op-plan" value={newPlan} onChange={setNewPlan} options={plans.map((p) => p.name)} />
            </WebField>
            {org.state === 'overdue' && <Note tone="error">Последняя оплата картой не прошла. Тариф работает ещё 7 дней.</Note>}
          </>
        )}
      </SideSheet>
    </AdminPage>
  )
}
