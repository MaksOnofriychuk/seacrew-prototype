import { useState } from 'react'
import { BadgeCheck, Building2, Lock, ShieldCheck } from 'lucide-react'
import { Paper } from '@/components/app/paper'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/web/data-table'
import { WebField, WebTextarea } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { OrgStatusDot } from '@/components/web/status-badge'
import { orgDetail, type OrgStatus } from '@/lib/data-admin'
import { VERIFY_REQS } from '@/lib/data-admin-2'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { useOrgStatuses } from './a-orgs'
import { AdminPage, CancelButton, DocList, Facts, Mono, Note, SectionTitle, SideSheet, dt, useBagState } from './_parts'

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
  const o = orgDetail(id)
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
        <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-8">
          <div className="flex min-w-0 flex-col">
            <Paper title="Заявка организации">
              <Facts
                className="py-1"
                items={[
                  ['Название', o.name],
                  ['Регистрационный номер', <Mono key="r">{o.regNumber}</Mono>],
                  ['Страна', o.country],
                  ['Город', o.city],
                  ['Сайт', o.site],
                  ['Владелец', `${o.owner.name}, ${o.owner.email}`],
                ]}
              />
              <p className="mt-5 border-t border-border pt-4 text-[15px]">{o.about}</p>
            </Paper>

            {docs.length > 0 && (
              <>
                <SectionTitle>Документы компании</SectionTitle>
                <DocList docs={docs} onOpen={(d) => showToast(`Просмотр ${d.name} записан в журнал`)} />
              </>
            )}

            <SectionTitle aside={<span className="text-sm text-muted-foreground">вакансий: <Mono>{o.jobs}</Mono></span>}>Участники</SectionTitle>
            <DataTable
              ignoreView
              rows={o.people}
              rowKey={(p) => p.email}
              columns={[
                { key: 'n', header: 'Имя', width: '30%', cell: (p) => <span className="font-medium">{p.name}</span> },
                { key: 'r', header: 'Роль', width: '18%', cell: (p) => p.role },
                { key: 'e', header: 'Email', width: '34%', cell: (p) => <span className="text-muted-foreground">{p.email}</span> },
                { key: 'j', header: 'С нами с', mono: true, cell: (p) => dt(p.joined) },
              ]}
            />
          </div>

          <aside className="sticky top-0 flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
            {status === 'pending' && (
              <>
                <h2 className="text-lg font-semibold">Ждёт проверки</h2>
                <p className="text-[15px] text-muted-foreground">Пока организация не подтверждена, её рекрутеры не могут приглашать моряков. Документы и решение — на странице «Верификация».</p>
                <Button size="lg" className="mt-2" onClick={toVerify}>
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
                <Button variant="outline" className="mt-2" onClick={toVerify}>
                  Открыть заявку
                </Button>
              </>
            )}
            {status === 'blocked' && (
              <>
                <h2 className="text-lg font-semibold text-signal">Заблокирована</h2>
                <Note tone="error">Жалобы моряков: просили оплату за трудоустройство.</Note>
                <Button variant="outline" className="mt-2" onClick={() => setAct('unblock')}>
                  Разблокировать
                </Button>
              </>
            )}
          </aside>
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
