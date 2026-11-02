import { useState } from 'react'
import { Briefcase, Building2, Flag, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebTextarea } from '@/components/web/fields'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { StatusDot } from '@/components/web/status-badge'
import { A_JOBS, type AJob } from '@/lib/data-admin'
import { REPORTS, REPORT_TARGET_LABEL, type Report, type ReportTarget } from '@/lib/data-admin-2'
import type { OrgStatus } from '@/lib/data-web'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { useUserOverrides } from '../a/a-users'
import { AdminPage, CancelButton, Facts, Mono, Note, SideSheet, dt, useBagState } from '../a/_parts'
import { Sample } from './_parts'

const ICON: Record<ReportTarget, typeof Flag> = { org: Building2, job: Briefcase, message: MessageSquare }
type Tab = 'open' | 'closed'
type Act = { key: string; label: string; toast: string; outcome: string; danger?: boolean; run?: (r: Report) => void }

export function A2Reports({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [reports, setReports] = useBagState<Report[]>('a2.reports', REPORTS)
  const [orgStatus, setOrgStatus] = useBagState<Record<string, OrgStatus>>('a.orgStatus', {})
  const [jobs, setJobs] = useBagState<AJob[]>('a.jobs', A_JOBS)
  const [, setOrg] = useBagState('a.org', 'org-mc')
  const [, setUser] = useBagState('a.user', 'u02')
  const [userOver, setUserOver] = useUserOverrides()
  const [tab, setTab] = useState<Tab>('open')
  const [q, setQ] = useState('')
  const [target, setTarget] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<Act | null>(null)
  const [note, setNote] = useState('')
  const open = reports.find((r) => r.id === openId)

  const rows = reports
    .filter((r) => r.state === tab)
    .filter((r) => !target || r.target === target)
    .filter((r) => !q || (r.title + r.context + r.reason + r.reporter).toLowerCase().includes(q.toLowerCase()))

  const close = () => {
    setOpenId(null)
    setConfirm(null)
    setNote('')
  }

  const resolve = (r: Report, a: Act) => {
    a.run?.(r)
    setReports(reports.map((x) => (x.id === r.id ? { ...x, state: 'closed', outcome: a.outcome + (note.trim() ? `. ${note.trim()}` : '') } : x)))
    showToast(a.toast)
    close()
  }

  const actsFor = (r: Report): Act[] => {
    const dismiss: Act = { key: 'dismiss', label: 'Отклонить жалобу', toast: 'Жалоба отклонена', outcome: 'Жалоба отклонена' }
    if (r.target === 'message')
      return [
        dismiss,
        { key: 'warn', label: 'Предупредить в чате', toast: 'Моряк увидит предупреждение в чате', outcome: 'В чат добавлено предупреждение' },
        {
          key: 'block',
          label: 'Заблокировать рекрутера',
          toast: 'Рекрутер заблокирован',
          outcome: 'Рекрутер заблокирован',
          danger: true,
          run: (x) => x.userId && setUserOver({ ...userOver, [x.userId]: { ...userOver[x.userId], status: 'blocked', reason: 'Жалоба моряка: ' + x.reason.toLowerCase() } }),
        },
      ]
    if (r.target === 'job')
      return [
        dismiss,
        {
          key: 'hide',
          label: 'Снять вакансию',
          toast: 'Вакансия снята с публикации',
          outcome: 'Вакансия снята',
          danger: true,
          run: (x) => x.jobId && setJobs(jobs.map((j) => (j.id === x.jobId ? { ...j, state: 'hidden', complaints: Math.max(j.complaints, x.count) } : j))),
        },
      ]
    return [
      dismiss,
      {
        key: 'block',
        label: 'Заблокировать компанию',
        toast: 'Компания заблокирована, вакансии сняты',
        outcome: 'Организация заблокирована',
        danger: true,
        run: (x) => x.orgId && setOrgStatus({ ...orgStatus, [x.orgId]: 'blocked' }),
      },
    ]
  }

  const columns: Column<Report>[] = [
    {
      key: 'what',
      header: 'На что жалоба',
      width: '30%',
      sortValue: (r) => r.title,
      cell: (r) => {
        const I = ICON[r.target]
        return (
          <span className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground" title={REPORT_TARGET_LABEL[r.target]}>
              <I className="size-4" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-medium">{r.title}</span>
              <span className="truncate text-sm text-muted-foreground">{r.context}</span>
            </span>
          </span>
        )
      },
    },
    { key: 'reason', header: 'Причина', width: '28%', sortValue: (r) => r.reason, cell: (r) => <span className="truncate">{r.reason}</span> },
    {
      key: 'count',
      header: 'Жалоб',
      width: '8%',
      align: 'right',
      sortValue: (r) => r.count,
      cell: (r) => <Mono className={cn(r.count >= 3 && r.state === 'open' && 'text-signal')}>{r.count}</Mono>,
    },
    { key: 'at', header: 'Когда', width: '12%', mono: true, sortValue: (r) => r.at, cell: (r) => dt(r.at.split(' ')[0]) },
    {
      key: 'st',
      header: tab === 'open' ? 'От кого' : 'Решение',
      cell: (r) => (r.state === 'open' ? <span className="text-muted-foreground">{r.reporter}</span> : <StatusDot tone="muted">{r.outcome}</StatusDot>),
    },
  ]

  return (
    <AdminPage active="a-posts" go={go}>
      <PageHeader
        title="Жалобы"
        description="Моряки жалуются на компании, вакансии и сообщения рекрутеров. Жалобы на публикации в ленте — в разделе «Публикации»."
        actions={
          <Button variant="outline" onClick={() => go('a-posts')}>
            Публикации
          </Button>
        }
      />
      <Note className="mb-6">
        <span className="flex flex-wrap items-center gap-2">
          Три жалобы на вакансию за 30 дней — она уходит на проверку сама, пока вы не решите. <Sample q="148" />
        </span>
      </Note>
      <PageTabs<Tab>
        tabs={[
          { id: 'open', label: 'Новые', count: reports.filter((r) => r.state === 'open').length },
          { id: 'closed', label: 'Решённые', count: reports.filter((r) => r.state === 'closed').length },
        ]}
        value={tab}
        onChange={setTab}
      />
      <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Компания, вакансия, моряк' }} onReset={target ? () => setTarget('') : undefined} count={rows.length}>
        <FilterSelect label="На что" value={target} onChange={setTarget} options={(Object.keys(REPORT_TARGET_LABEL) as ReportTarget[]).map((k) => ({ value: k, label: REPORT_TARGET_LABEL[k] }))} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => (setOpenId(r.id), setConfirm(null))}
        selectedKey={openId ?? undefined}
        initialSort={{ key: 'at', dir: 'desc' }}
        empty={
          q || target
            ? { icon: Flag, title: 'Жалоб не нашлось', text: 'Проверьте запрос или сбросьте фильтр.' }
            : tab === 'open'
              ? { icon: Flag, title: 'Новых жалоб нет', text: 'Когда моряк пожалуется на компанию, вакансию или сообщение, жалоба появится здесь.' }
              : { icon: Flag, title: 'Решённых жалоб пока нет' }
        }
      />

      <SideSheet
        open={!!open}
        onOpenChange={(v) => !v && close()}
        title={confirm ? `${confirm.label}?` : open ? REPORT_TARGET_LABEL[open.target] : ''}
        description={open ? (confirm ? open.title : <>{open.title}, <Mono>{dt(open.at)}</Mono></>) : undefined}
        footer={
          open &&
          (confirm ? (
            <>
              <CancelButton onClick={() => setConfirm(null)} />
              <Button variant={confirm.danger ? 'destructive' : 'default'} onClick={() => resolve(open, confirm)}>
                {confirm.label}
              </Button>
            </>
          ) : open.state === 'open' ? (
            <>
              <Button variant="ghost" className="mr-auto" onClick={() => setConfirm(actsFor(open)[0])}>
                Отклонить жалобу
              </Button>
              {/* головна дія — остання (снять / заблокировать); «предупредить» — у тілі вікна */}
              <Button variant="destructive" onClick={() => setConfirm(actsFor(open).at(-1)!)}>
                {actsFor(open).at(-1)!.label}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => (setReports(reports.map((x) => (x.id === open.id ? { ...x, state: 'open', outcome: undefined } : x))), showToast('Жалоба снова открыта'), close())}>
              Открыть снова
            </Button>
          ))
        }
      >
        {open && !confirm && (
          <>
            <Facts
              className="[&_dd]:whitespace-normal"
              items={[
                ['Причина', open.reason],
                ['Жалоб на это', <Mono key="c">{open.count}</Mono>],
                ['Первым пожаловался', open.reporter],
                ['Где', open.context],
              ]}
            />
            {open.comment && <p className="text-[15px] leading-relaxed">«{open.comment}»</p>}

            {open.chat && (
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4">
                <span className="text-sm text-muted-foreground">Сообщение и одно перед ним — остальная переписка вам не видна</span>
                {open.chat.map((m) => (
                  <div key={m.at} className={cn('flex max-w-[85%] flex-col gap-1 rounded-xl px-3.5 py-2.5', m.from === 'recruiter' ? 'self-start bg-surface' : 'self-end bg-primary/10', m.reported && 'border border-signal')}>
                    <span className="text-xs text-muted-foreground">
                      {m.author}, <Mono>{m.at.split(' ')[1]}</Mono>
                    </span>
                    <span className="text-[15px]">{m.text}</span>
                  </div>
                ))}
              </div>
            )}

            {open.state === 'closed' && <Note>Решение: {open.outcome}.</Note>}
            {open.state === 'open' && open.target === 'message' && (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
                <span className="text-[15px]">Показать моряку в этом чате предупреждение об оплате</span>
                <Button variant="outline" size="sm" onClick={() => setConfirm(actsFor(open)[1])}>
                  Предупредить
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {open.orgId && (
                <Button variant="outline" size="sm" onClick={() => (setOrg(open.orgId!), go('a-org'))}>
                  Карточка компании
                </Button>
              )}
              {open.jobId && (
                <Button variant="outline" size="sm" onClick={() => go('a-jobs')}>
                  Вакансии на модерации
                </Button>
              )}
              {open.userId && (
                <Button variant="outline" size="sm" onClick={() => (setUser(open.userId!), go('a-user'))}>
                  Профиль рекрутера
                </Button>
              )}
            </div>
          </>
        )}
        {open && confirm && (
          <>
            <p className="text-[15px] text-muted-foreground">
              {confirm.key === 'dismiss' && 'Жалоба закроется. Моряку придёт ответ, что нарушений не нашли.'}
              {confirm.key === 'warn' && 'Моряк увидит в этом чате плашку: «Не переводите деньги рекрутеру. Честные компании не берут плату за работу».'}
              {confirm.key === 'block' && open.target === 'message' && 'Рекрутер потеряет доступ к кабинету. Его чаты с моряками закроются.'}
              {confirm.key === 'block' && open.target === 'org' && 'Все рекрутеры компании потеряют доступ, вакансии снимутся с публикации.'}
              {confirm.key === 'hide' && 'Вакансия пропадёт из ленты и поиска. Отклики останутся у рекрутера.'}
            </p>
            <WebField id="rp-note" label="Комментарий" hint="Видно только команде.">
              <WebTextarea id="rp-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Необязательно" />
            </WebField>
          </>
        )}
      </SideSheet>
    </AdminPage>
  )
}
