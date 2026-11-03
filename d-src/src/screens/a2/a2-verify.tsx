import { useState } from 'react'
import { BadgeCheck, Check, ChevronLeft, ChevronRight, Search, ShieldCheck, Undo2, X } from 'lucide-react'
import { EmptyState, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebCheckbox, WebField, WebTextarea } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { LEVELS, LEVEL_CHECKS, VERIFY_REQS, VERIFY_STATE_LABEL, type VerifyReq, type VerifyState } from '@/lib/data-admin-2'
import '@/lib/data-admin-53-f'
import { ADMIN_ORGS, type OrgStatus } from '@/lib/data-web'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { AdminPage, AdminTabs, CancelButton, DocList, Mono, Note, SectionTitle, SideSheet, dt, useBagState } from '../a/_parts'
import { Sample } from './_parts'

const TONE: Record<VerifyState, Tone> = { pending: 'warning', approved: 'success', rejected: 'muted' }
type Tab = VerifyState
type Decision = { state: VerifyState; reason?: string; decidedAt: string }

// Сходинки рівнів: що вже є, що просять, що відкриває кожен рівень.
function LevelLadder({ current, asked }: { current: number; asked: number }) {
  return (
    <ol className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-surface">
      {LEVELS.map((l) => {
        const done = l.level <= current
        const target = l.level === asked && !done
        return (
          <li key={l.level} className={cn('flex flex-col gap-1.5 border-l border-border px-5 py-4 first:border-l-0', target && 'bg-primary/[0.06]')}>
            <span className="flex items-center gap-2 text-[15px] font-semibold">
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border text-[11px]',
                  done ? 'border-success bg-success text-primary-foreground' : target ? 'border-primary text-primary' : 'border-border text-muted-foreground',
                )}
                aria-hidden="true"
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : <span className="font-mono">{l.level}</span>}
              </span>
              <span className={cn(target && 'text-primary', !done && !target && 'text-muted-foreground')}>{l.title}</span>
            </span>
            <span className="text-sm text-muted-foreground">{l.opens}</span>
            {target && <span className="text-sm font-medium text-primary">запрошен</span>}
            {done && l.level === current && l.level > 0 && <span className="text-sm text-success">есть сейчас</span>}
          </li>
        )
      })}
    </ol>
  )
}

export function A2Verify({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [dec, setDec] = useBagState<Record<string, Decision>>('a2.verify', {})
  const [orgStatus, setOrgStatus] = useBagState<Record<string, OrgStatus>>('a.orgStatus', {})
  const [, setOrg] = useBagState('a.org', 'org-mc')
  const [selBag, setSelBag] = useBagState('a2.verifySel', '')
  const [tab, setTab] = useState<Tab>(() => VERIFY_REQS.find((r) => r.id === selBag)?.state ?? 'pending')
  const selId = selBag || 'vr-29'
  const setSelId = setSelBag
  const [checked, setChecked] = useState<Record<string, boolean[]>>({})
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [qq, setQq] = useState('')
  const [sort, setSort] = useState<'new' | 'old' | 'name' | 'level'>('new')
  const [size, setSize] = useState(10)
  const [page, setPage] = useState(0)

  const reqs: VerifyReq[] = VERIFY_REQS.map((r) => (dec[r.id] ? { ...r, ...dec[r.id] } : r))
  const list = reqs
    .filter((r) => r.state === tab)
    .filter((r) => !qq || (r.org + r.country + r.regNumber).toLowerCase().includes(qq.toLowerCase()))
    .sort((a, b) =>
      sort === 'name' ? a.org.localeCompare(b.org, 'ru') : sort === 'level' ? b.level - a.level || b.submitted.localeCompare(a.submitted) : sort === 'old' ? a.submitted.localeCompare(b.submitted) : b.submitted.localeCompare(a.submitted),
    )
  const pages = Math.max(1, Math.ceil(list.length / size))
  const cur = Math.min(page, pages - 1)
  const shown = list.slice(cur * size, (cur + 1) * size)
  const sel = list.find((r) => r.id === selId) ?? list[0]
  const selIdx = sel ? list.indexOf(sel) : -1
  const nextOf = (id: string) => {
    const i = list.findIndex((r) => r.id === id)
    return list[i + 1] ?? list[i - 1]
  }
  const goTo = (id: string) => {
    setSelId(id)
    setRejecting(false)
    const i = list.findIndex((r) => r.id === id)
    if (i >= 0) setPage(Math.floor(i / size))
  }
  const hasCard = (id: string) => ADMIN_ORGS.some((o) => o.id === id)
  const checks = sel ? LEVEL_CHECKS[sel.level] : []
  const marks = sel ? (checked[sel.id] ?? checks.map(() => false)) : []
  const allChecked = marks.every(Boolean)
  const now = () => '2026-11-02 ' + new Date().toTimeString().slice(0, 5)

  const approve = (r: VerifyReq) => {
    setDec({ ...dec, [r.id]: { state: 'approved', decidedAt: now() } })
    if (r.level === 1) setOrgStatus({ ...orgStatus, [r.orgId]: 'verified' })
    showToast(`${r.org}: уровень ${r.level} подтверждён`)
    const n = nextOf(r.id)
    if (n) setSelId(n.id)
  }
  const reject = (r: VerifyReq) => {
    setDec({ ...dec, [r.id]: { state: 'rejected', reason: reason.trim(), decidedAt: now() } })
    if (r.level === 1) setOrgStatus({ ...orgStatus, [r.orgId]: 'rejected' })
    showToast('Заявка отклонена, владелец получит письмо')
    setRejecting(false)
    setReason('')
    const n = nextOf(r.id)
    if (n) setSelId(n.id)
  }

  return (
    <AdminPage active="a2-verify" go={go}>
      <PageHeader
        title="Верификация компаний"
        description="Компания сама просит следующий уровень и прикладывает документы. Уровень открывает ей новые возможности, а морякам показывает, насколько ей можно доверять."
        meta={
          <span className="flex items-center gap-2">
            Что проверяем на каждом уровне — для примера, ждём ответа заказчика <Sample q="139" />
          </span>
        }
      />
      <AdminTabs<Tab>
        tabs={[
          { id: 'pending', label: 'Ждут проверки', count: reqs.filter((r) => r.state === 'pending').length },
          { id: 'approved', label: 'Подтверждённые', count: reqs.filter((r) => r.state === 'approved').length },
          { id: 'rejected', label: 'Отклонённые', count: reqs.filter((r) => r.state === 'rejected').length },
        ]}
        value={tab}
        onChange={(t) => (setTab(t), setPage(0), setQq(''))}
      />

      <ViewState
        loading={{ kind: 'cards', rows: 2 }}
        empty={{ icon: ShieldCheck, title: 'Заявок нет', text: 'Когда компания попросит уровень проверки, заявка появится здесь.' }}
      >
        {!sel && !qq ? (
          <EmptyState
            icon={ShieldCheck}
            title={tab === 'pending' ? 'Все заявки разобраны' : 'Здесь пока пусто'}
            text={tab === 'pending' ? 'Новые заявки появятся, когда компания приложит документы.' : 'Решённые заявки появятся здесь.'}
          />
        ) : (
          <div className="grid grid-cols-[320px_minmax(0,1fr)] items-start gap-6">
            {/* черга */}
            <div className="sticky top-0 flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
              <div className="flex flex-col gap-2 border-b border-border p-3">
                <label className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-primary">
                  <Search className="size-4 shrink-0 text-muted-foreground" />
                  <input value={qq} onChange={(e) => (setQq(e.target.value), setPage(0))} placeholder="Компания, страна, номер" aria-label="Поиск по заявкам" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                  {qq && (
                    <button type="button" aria-label="Очистить" onClick={() => (setQq(''), setPage(0))} className="text-muted-foreground">
                      <X className="size-4" />
                    </button>
                  )}
                </label>
                <Select value={sort} onValueChange={(v) => (setSort(v as typeof sort), setPage(0))}>
                  <SelectTrigger size="sm" aria-label="Сортировать" className="w-full bg-surface">
                    <span className="text-muted-foreground">Сортировать:</span>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Сначала новые</SelectItem>
                    <SelectItem value="old">Сначала старые</SelectItem>
                    <SelectItem value="name">Название: А — Я</SelectItem>
                    <SelectItem value="level">Уровень: сначала выше</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {shown.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Ничего не нашлось. Проверьте запрос.</p>
              ) : (
                <ul className="flex max-h-[min(440px,calc(100vh-420px))] min-h-[200px] flex-col overflow-y-auto" aria-label="Заявки">
                  {shown.map((r) => (
                    <li key={r.id} className="border-t border-border first:border-t-0">
                      <button
                        type="button"
                        onClick={() => goTo(r.id)}
                        aria-current={r.id === sel?.id ? 'true' : undefined}
                        className={cn('flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted', r.id === sel?.id && 'bg-muted')}
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span className={cn('truncate font-medium', r.id === sel?.id && 'text-primary')} title={r.org}>{r.org}</span>
                          <Mono className="shrink-0 text-xs text-muted-foreground">{dt(r.submitted.split(' ')[0]).slice(0, 5)}</Mono>
                        </span>
                        <span className="truncate text-sm text-muted-foreground">
                          Уровень <Mono>{r.level}</Mono>, {r.country}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  по
                  <Select value={String(size)} onValueChange={(v) => (setSize(Number(v)), setPage(0))}>
                    <SelectTrigger size="sm" aria-label="Сколько заявок показывать" className="w-[68px] bg-surface font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50].map((n) => (
                        <SelectItem key={n} value={String(n)} className="font-mono">
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
                <span className="text-muted-foreground">
                  <Mono>{list.length ? cur * size + 1 : 0}–{Math.min((cur + 1) * size, list.length)}</Mono> из <Mono>{list.length}</Mono>
                </span>
                <nav aria-label="Страницы" className="flex items-center">
                  <button type="button" aria-label="Предыдущая страница" disabled={cur === 0} onClick={() => setPage(cur - 1)} className="flex size-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent">
                    <ChevronLeft className="size-4" />
                  </button>
                  <button type="button" aria-label="Следующая страница" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="flex size-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent">
                    <ChevronRight className="size-4" />
                  </button>
                </nav>
              </div>
            </div>

            {/* заявка */}
            {!sel ? (
              <EmptyState icon={ShieldCheck} title="Ничего не нашлось" text="Проверьте запрос или сбросьте поиск." />
            ) : (
            <section className="flex min-w-0 flex-col">
              <div className="mb-5 flex items-start justify-between gap-6">
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="text-xl font-semibold">
                    {sel.org}: уровень <Mono>{sel.level}</Mono>
                  </h2>
                  <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <StatusDot tone={TONE[sel.state]}>{VERIFY_STATE_LABEL[sel.state]}</StatusDot>
                    <span>
                      Заявка от <Mono>{dt(sel.submitted)}</Mono>
                    </span>
                    <span>
                      {sel.country}, рег. номер <Mono>{sel.regNumber}</Mono>
                    </span>
                  </span>
                </div>
                <span className="flex shrink-0 items-center gap-1">
                  {selIdx >= 0 && list.length > 1 && (
                    <>
                      <span className="mr-1 text-sm text-muted-foreground">
                        <Mono>{selIdx + 1}</Mono> из <Mono>{list.length}</Mono>
                      </span>
                      <button type="button" aria-label="Предыдущая заявка" disabled={selIdx === 0} onClick={() => goTo(list[selIdx - 1].id)} className="flex size-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent">
                        <ChevronLeft className="size-4" />
                      </button>
                      <button type="button" aria-label="Следующая заявка" disabled={selIdx === list.length - 1} onClick={() => goTo(list[selIdx + 1].id)} className="flex size-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent">
                        <ChevronRight className="size-4" />
                      </button>
                    </>
                  )}
                  {hasCard(sel.orgId) && (
                    <Button variant="ghost" className="text-primary" onClick={() => (setOrg(sel.orgId), go('a-org'))}>
                      Карточка организации
                    </Button>
                  )}
                </span>
              </div>

              <LevelLadder current={sel.state === 'approved' ? sel.level : sel.current} asked={sel.level} />

              <SectionTitle aside={<span className="text-sm text-muted-foreground">просмотр файла пишется в журнал</span>}>Документы компании</SectionTitle>
              <DocList docs={sel.docs} onOpen={(d) => showToast(`Просмотр ${d.name} записан в журнал`)} />
              {sel.comment && (
                <Note className="mt-4">
                  Комментарий компании: {sel.comment}
                </Note>
              )}
              <p className="mt-3 text-sm text-muted-foreground">Контакт для звонка: {sel.contact}</p>

              {sel.state === 'pending' ? (
                <>
                  <SectionTitle>Что проверить</SectionTitle>
                  <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-5 py-4">
                    {checks.map((c, i) => (
                      <WebCheckbox
                        key={c}
                        id={`chk-${sel.id}-${i}`}
                        checked={marks[i]}
                        onChange={(v) => setChecked({ ...checked, [sel.id]: marks.map((m, j) => (j === i ? v : m)) })}
                        className="text-[15px]"
                      >
                        {c}
                      </WebCheckbox>
                    ))}
                  </div>
                  <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 border-t border-border bg-background py-4">
                    {!allChecked && <span className="mr-auto whitespace-nowrap text-sm text-muted-foreground">Отметьте все пункты</span>}
                    <Button variant="ghost" size="lg" className="w-auto text-primary" onClick={() => showToast(`${sel.org}: запрос документов отправлен владельцу`)}>
                      Запросить документы
                    </Button>
                    <Button variant="outline" size="lg" className="w-auto" onClick={() => setRejecting(true)}>
                      Отклонить
                    </Button>
                    <Button size="lg" className="w-auto" disabled={!allChecked} onClick={() => approve(sel)}>
                      <BadgeCheck /> Подтвердить уровень {sel.level}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="mt-6 flex items-start gap-4">
                <Note tone={sel.state === 'rejected' ? 'error' : 'muted'} className="flex-1">
                  {sel.state === 'approved' ? (
                    <>
                      Уровень {sel.level} подтверждён <Mono>{dt(sel.decidedAt ?? '')}</Mono>.
                    </>
                  ) : (
                    <>
                      Отклонено <Mono>{dt(sel.decidedAt ?? '')}</Mono>: {sel.reason || 'причина не указана'}. Компания может прислать документы снова.
                    </>
                  )}
                </Note>
                {sel.state === 'rejected' && (
                  <Button variant="outline" onClick={() => (setDec({ ...dec, [sel.id]: { state: 'pending', decidedAt: now() } }), sel.level === 1 && setOrgStatus({ ...orgStatus, [sel.orgId]: 'pending' }), setTab('pending'), showToast('Заявка снова ждёт проверки'))}>
                    <Undo2 /> Пересмотреть
                  </Button>
                )}
                </div>
              )}
            </section>
            )}
          </div>
        )}
      </ViewState>

      <SideSheet
        open={rejecting && !!sel}
        onOpenChange={setRejecting}
        title="Отклонить заявку?"
        description={sel ? `${sel.org} останется на уровне ${sel.current}. Причину владелец увидит в письме и сможет прислать документы снова.` : undefined}
        footer={
          <>
            <CancelButton onClick={() => setRejecting(false)} />
            <Button variant="destructive" disabled={!reason.trim()} onClick={() => sel && reject(sel)}>
              Отклонить
            </Button>
          </>
        }
      >
        <WebField id="vr-reason" label="Причина" hint="Владелец увидит её в письме.">
          <WebTextarea id="vr-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Например: лицензия просрочена, пришлите действующую" />
        </WebField>
      </SideSheet>
    </AdminPage>
  )
}
