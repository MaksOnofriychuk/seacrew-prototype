import { useState } from 'react'
import { BadgeCheck, Check, FileText, ShieldCheck } from 'lucide-react'
import { EmptyState, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebCheckbox, WebField, WebTextarea } from '@/components/web/fields'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { LEVELS, LEVEL_CHECKS, VERIFY_REQS, VERIFY_STATE_LABEL, type VerifyReq, type VerifyState } from '@/lib/data-admin-2'
import type { OrgStatus } from '@/lib/data-web'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { AdminPage, CancelButton, Mono, Note, SectionTitle, SideSheet, dt, useBagState } from '../a/_parts'
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
  const [tab, setTab] = useState<Tab>('pending')
  const [selId, setSelId] = useState<string>('vr-29')
  const [checked, setChecked] = useState<Record<string, boolean[]>>({})
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  const reqs: VerifyReq[] = VERIFY_REQS.map((r) => (dec[r.id] ? { ...r, ...dec[r.id] } : r))
  const list = reqs.filter((r) => r.state === tab)
  const sel = list.find((r) => r.id === selId) ?? list[0]
  const checks = sel ? LEVEL_CHECKS[sel.level] : []
  const marks = sel ? (checked[sel.id] ?? checks.map(() => false)) : []
  const allChecked = marks.every(Boolean)
  const now = () => '2026-11-02 ' + new Date().toTimeString().slice(0, 5)

  const approve = (r: VerifyReq) => {
    setDec({ ...dec, [r.id]: { state: 'approved', decidedAt: now() } })
    if (r.level === 1) setOrgStatus({ ...orgStatus, [r.orgId]: 'verified' })
    showToast(`${r.org}: уровень ${r.level} подтверждён`)
  }
  const reject = (r: VerifyReq) => {
    setDec({ ...dec, [r.id]: { state: 'rejected', reason: reason.trim(), decidedAt: now() } })
    if (r.level === 1) setOrgStatus({ ...orgStatus, [r.orgId]: 'rejected' })
    showToast('Заявка отклонена, владелец получит письмо')
    setRejecting(false)
    setReason('')
  }

  return (
    <AdminPage active="a-orgs" go={go}>
      <PageHeader
        title="Верификация компаний"
        description="Компания сама просит следующий уровень и прикладывает документы. Уровень открывает ей новые возможности, а морякам показывает, насколько ей можно доверять."
        meta={
          <span className="flex items-center gap-2">
            Что проверяем на каждом уровне — для примера, ждём ответа заказчика <Sample q="139" />
          </span>
        }
      />
      <PageTabs<Tab>
        tabs={[
          { id: 'pending', label: 'Ждут проверки', count: reqs.filter((r) => r.state === 'pending').length },
          { id: 'approved', label: 'Подтверждённые', count: reqs.filter((r) => r.state === 'approved').length },
          { id: 'rejected', label: 'Отклонённые', count: reqs.filter((r) => r.state === 'rejected').length },
        ]}
        value={tab}
        onChange={setTab}
      />

      <ViewState
        loading={{ kind: 'cards', rows: 2 }}
        empty={{ icon: ShieldCheck, title: 'Заявок нет', text: 'Когда компания попросит уровень проверки, заявка появится здесь.' }}
      >
        {!sel ? (
          <EmptyState
            icon={ShieldCheck}
            title={tab === 'pending' ? 'Все заявки разобраны' : 'Здесь пока пусто'}
            text={tab === 'pending' ? 'Новые заявки появятся, когда компания приложит документы.' : 'Решённые заявки появятся здесь.'}
          />
        ) : (
          <div className="grid grid-cols-[300px_minmax(0,1fr)] items-start gap-8">
            {/* черга */}
            <ul className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface" aria-label="Заявки">
              {list.map((r) => (
                <li key={r.id} className="border-t border-border first:border-t-0">
                  <button
                    type="button"
                    onClick={() => (setSelId(r.id), setRejecting(false))}
                    aria-current={r.id === sel.id ? 'true' : undefined}
                    className={cn('flex w-full flex-col gap-1 px-4 py-3.5 text-left transition-colors hover:bg-muted', r.id === sel.id && 'bg-muted')}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={cn('truncate font-medium', r.id === sel.id && 'text-primary')}>{r.org}</span>
                      <Mono className="shrink-0 text-xs text-muted-foreground">{dt(r.submitted.split(' ')[0]).slice(0, 5)}</Mono>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Уровень <Mono>{r.level}</Mono>, {r.country}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {/* заявка */}
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
                <Button variant="ghost" className="shrink-0 text-primary" onClick={() => (setOrg(sel.orgId), go('a-org'))}>
                  Карточка организации
                </Button>
              </div>

              <LevelLadder current={sel.state === 'approved' ? sel.level : sel.current} asked={sel.level} />

              <SectionTitle aside={<span className="text-sm text-muted-foreground">файлы видны только по кнопке, просмотр пишется в журнал</span>}>Документы компании</SectionTitle>
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                {sel.docs.map((d) => (
                  <div key={d.name} className="flex items-center gap-4 border-t border-border px-4 py-3 first:border-t-0">
                    <FileText className="size-5 shrink-0 text-muted-foreground" />
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate font-medium">{d.type}</span>
                      <span className="truncate text-sm text-muted-foreground">
                        <Mono>{d.name}</Mono>, <Mono>{d.pages}</Mono> стр., <Mono>{d.size}</Mono>
                      </span>
                    </span>
                    <Mono className="shrink-0 text-sm text-muted-foreground">{dt(d.uploaded)}</Mono>
                    <Button variant="outline" size="sm" onClick={() => showToast(`${d.name} открыт, просмотр записан в журнал`)}>
                      Открыть
                    </Button>
                  </div>
                ))}
              </div>
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
                  <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-5">
                    {!allChecked && <span className="mr-auto text-sm text-muted-foreground">Отметьте все пункты, чтобы подтвердить</span>}
                    <Button variant="outline" size="lg" onClick={() => setRejecting(true)}>
                      Отклонить
                    </Button>
                    <Button size="lg" disabled={!allChecked} onClick={() => approve(sel)}>
                      <BadgeCheck /> Подтвердить уровень {sel.level}
                    </Button>
                  </div>
                </>
              ) : (
                <Note tone={sel.state === 'rejected' ? 'error' : 'muted'} className="mt-6">
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
              )}
            </section>
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
        <WebField id="vr-reason" label="Причина">
          <WebTextarea id="vr-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Например: лицензия просрочена, пришлите действующую" />
        </WebField>
      </SideSheet>
    </AdminPage>
  )
}
