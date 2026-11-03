import { useState } from 'react'
import { BadgeCheck, Briefcase, Building2, Lock, ShieldCheck, Users } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/web/data-table'
import { WebField, WebTextarea } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { OrgStatusDot, StatusDot } from '@/components/web/status-badge'
import type { OrgStatus } from '@/lib/data-admin'
import { orgDetail53, orgJobs } from '@/lib/data-admin-53-e'
import { VERIFY_REQS } from '@/lib/data-admin-2'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { useOrgStatuses } from './a-orgs'
import { AdminPage, CancelButton, DocList, Facts, Mono, Note, SideSheet, dt, useBagState } from './_parts'
import { Fold } from './e-fold'

type Act = 'block' | 'unblock' | null

const ACT: Record<Exclude<Act, null>, { title: string; text: string; button: string; to: OrgStatus; toast: string; reason?: boolean }> = {
  block: { title: 'Заблокировать организацию?', text: 'Все её рекрутеры потеряют доступ к кабинету, вакансии снимутся с публикации.', button: 'Заблокировать', to: 'blocked', toast: 'Организация заблокирована', reason: true },
  unblock: { title: 'Разблокировать организацию?', text: 'Рекрутеры снова войдут в кабинет. Вакансии нужно будет опубликовать заново.', button: 'Разблокировать', to: 'verified', toast: 'Организация разблокирована' },
}

export function AOrg({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [id] = useBagState('a.org', 'org-mc')
  const [, setVerifySel] = useBagState('a2.verifySel', '')
  const [over, setOver] = useOrgStatuses()
  const o = orgDetail53(id)
  const jobs = orgJobs(o.id, o.jobs)
  const status = over[o.id] ?? o.status
  const [act, setAct] = useState<Act>(null)
  const [reason, setReason] = useState('')
  const a = act ? ACT[act] : null
  const docs = VERIFY_REQS.filter((r) => r.orgId === o.id).flatMap((r) => r.docs)
  // подтверждение и отказ живут только на «Верификации»; здесь — ссылка на заявку
  const req = VERIFY_REQS.find((r) => r.orgId === o.id && (r.state === 'pending' || status === 'rejected'))
  const toVerify = () => {
    if (req) setVerifySel(req.id)
    go('a2-verify')
  }

  const apply = () => {
    if (!a) return
    setOver({ ...over, [o.id]: a.to })
    showToast(a.toast)
    setAct(null)
    setReason('')
  }

  return (
    <AdminPage active="a-orgs" go={go}>
      <PageHeader
        back={{ label: 'Организации', onClick: () => go('a-orgs') }}
        title={o.name}
        meta={
          <>
            <OrgStatusDot s={status} />
            <span>
              Заявка от <Mono>{dt(o.created)}</Mono>
            </span>
          </>
        }
      />
      <ViewState
        empty={{ icon: Building2, title: 'Организация удалена', text: 'Владелец удалил кабинет. Заявка больше не нужна.' }}
        loading={{ kind: 'cards', rows: 2 }}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-6">
          <div className="flex min-w-0 flex-col gap-4">
          <aside className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
            {status === 'pending' && (
              <>
                <h2 className="text-lg font-semibold">Ждёт проверки</h2>
                <p className="text-[15px] text-muted-foreground">Пока организация не подтверждена, её рекрутеры не могут приглашать моряков. Документы и решение — на странице «Верификация».</p>
                <Button className="mt-1" onClick={toVerify}>
                  <ShieldCheck /> Открыть проверку
                </Button>
              </>
            )}
            {status === 'verified' && (
              <>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <BadgeCheck className="size-5 text-success" /> Проверена
                </h2>
                <p className="text-[15px] text-muted-foreground">
                  {o.verifiedAt ? (
                    <>
                      Подтверждена <Mono>{dt(o.verifiedAt)}</Mono>. Рекрутеры приглашают моряков.
                    </>
                  ) : (
                    'Подтверждена сегодня. Рекрутеры приглашают моряков.'
                  )}
                </p>
                <Button variant="outline" className="mt-2 text-signal" onClick={() => setAct('block')}>
                  <Lock /> Заблокировать
                </Button>
              </>
            )}
            {status === 'rejected' && (
              <>
                <h2 className="text-lg font-semibold">Заявка отклонена</h2>
                <p className="text-[15px] text-muted-foreground">Владелец может исправить данные и отправить заявку снова.</p>
                <Button variant="outline" className="mt-1" onClick={toVerify}>
                  Открыть заявку
                </Button>
              </>
            )}
            {status === 'blocked' && (
              <>
                <h2 className="text-lg font-semibold text-signal">Заблокирована</h2>
                <Note tone="error">Жалобы моряков: просили оплату за трудоустройство.</Note>
                <Button variant="outline" className="mt-1" onClick={() => setAct('unblock')}>
                  Разблокировать
                </Button>
              </>
            )}
          </aside>

            <Fold title="Заявка организации" summary={o.regNumber}>
              <Facts
                items={[
                  ['Название', o.name],
                  ['Регистрационный номер', <Mono key="r">{o.regNumber}</Mono>],
                  ['Страна', o.country],
                  ['Город', o.city],
                  ['Сайт', o.site],
                  ['Владелец', o.owner.name],
                  ['Email владельца', o.owner.email],
                ]}
              />
              <p className="mt-4 border-t border-border pt-3 text-[15px]">{o.about}</p>
            </Fold>

            {docs.length > 0 && (
              <Fold title="Документы компании" summary={String(docs.length)} defaultOpen={status === 'pending'}>
                <DocList docs={docs} onOpen={(d) => showToast(`Просмотр ${d.name} записан в журнал`)} />
              </Fold>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <Fold title="Участники" summary={String(o.people.length)} flush>
              <DataTable
                ignoreView
                className="rounded-none border-0"
                rows={o.people}
                rowKey={(p) => p.email}
                initialSort={{ key: 'j', dir: 'asc' }}
                pageSizes={[10, 20, 50]}
                sortOptions={[
                  { key: 'j', dir: 'asc', label: 'С нами с: сначала давние' },
                  { key: 'j', dir: 'desc', label: 'С нами с: сначала недавние' },
                  { key: 'n', dir: 'asc', label: 'Имя: А — Я' },
                  { key: 'r', dir: 'asc', label: 'Роль' },
                ]}
                empty={{ icon: Users, title: 'Участников нет', text: 'Владелец ещё никого не добавил.' }}
                columns={[
                  {
                    key: 'n',
                    header: 'Имя',
                    width: '46%',
                    sortValue: (p) => p.name,
                    cell: (p) => (
                      <span className="flex min-w-0 flex-col leading-tight" title={`${p.name}, ${p.email}`}>
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="truncate text-sm text-muted-foreground">{p.email}</span>
                      </span>
                    ),
                  },
                  { key: 'r', header: 'Роль', width: '22%', sortValue: (p) => p.role, cell: (p) => p.role },
                  { key: 'j', header: 'С нами с', sortValue: (p) => p.joined, mono: true, cell: (p) => dt(p.joined) },
                ]}
              />
            </Fold>

            <Fold title="Вакансии" summary={String(o.jobs)} flush defaultOpen={o.jobs > 0}>
              <DataTable
                ignoreView
                className="rounded-none border-0"
                rows={jobs}
                rowKey={(j) => j.id}
                initialSort={{ key: 'pub', dir: 'desc' }}
                pageSizes={[10, 20, 50]}
                sortOptions={[
                  { key: 'pub', dir: 'desc', label: 'Дата: сначала новые' },
                  { key: 'pub', dir: 'asc', label: 'Дата: сначала старые' },
                  { key: 'pos', dir: 'asc', label: 'Должность: А — Я' },
                  { key: 'apps', dir: 'desc', label: 'Отклики: сначала больше' },
                ]}
                empty={{ icon: Briefcase, title: 'Вакансий нет', text: 'Пока организация не подтверждена, вакансии не публикуются.' }}
                columns={[
                  { key: 'pos', header: 'Должность', width: '32%', sortValue: (j) => j.position, cell: (j) => <span title={j.position} className="font-medium">{j.position}</span> },
                  { key: 'pub', header: 'Дата', width: '24%', mono: true, sortValue: (j) => j.published, cell: (j) => dt(j.published) },
                  { key: 'apps', header: 'Отклики', width: '17%', align: 'right', mono: true, sortValue: (j) => j.applications, cell: (j) => j.applications },
                  { key: 'st', header: 'Статус', sortValue: (j) => j.state, cell: (j) => <StatusDot tone={j.state === 'Открыта' ? 'success' : 'muted'}>{j.state}</StatusDot> },
                ]}
              />
            </Fold>
          </div>
        </div>
      </ViewState>

      <SideSheet
        open={!!a}
        onOpenChange={(v) => !v && setAct(null)}
        title={a?.title}
        description={a?.text}
        footer={
          <>
            <CancelButton onClick={() => setAct(null)} />
            <Button variant={act === 'block' ? 'destructive' : 'default'} disabled={!!a?.reason && !reason.trim()} onClick={apply}>
              {a?.button}
            </Button>
          </>
        }
      >
        {a?.reason && (
          <WebField id="org-reason" label="Причина" hint="Владелец увидит её в письме.">
            <WebTextarea id="org-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Например: номер не найден в реестре" />
          </WebField>
        )}
      </SideSheet>
    </AdminPage>
  )
}
