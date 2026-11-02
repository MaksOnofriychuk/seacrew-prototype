import { useState } from 'react'
import { BadgeCheck, Crown, UserPlus, Users } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebInput, WebTextarea } from '@/components/web/fields'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { WebAvatar } from '@/components/web/status-badge'
import { ME_RECRUITER, RECRUITER_ORG, RECRUITERS, type Recruiter } from '@/lib/data-web'
import type { ScreenProps } from '../registry'
import { ConfirmDialog, ruDate, useR2 } from './_parts'

type Tab = 'members' | 'profile'
type Act = { kind: 'owner' | 'remove'; who: Recruiter } | null

// r-org — організація: профіль компанії, учасники, роль власника (contract-recruiter-web §1: OWNER і RECRUITER).
// Сильний елемент — шапка компанії з позначкою перевірки.
export function ROrg({ go }: ScreenProps) {
  const r = useR2()
  const [tab, setTab] = useState<Tab>('members')
  const [members, setMembers] = useState<Recruiter[]>(RECRUITERS.map((x) => ({ ...x, role: x.role === 'owner' ? 'owner' : 'recruiter' })))
  const [act, setAct] = useState<Act>(null)
  const [inviting, setInviting] = useState(false)
  const [email, setEmail] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [org, setOrg] = useState({ name: RECRUITER_ORG.name, country: RECRUITER_ORG.country, city: RECRUITER_ORG.city, site: RECRUITER_ORG.site, about: 'Набираем офицеров и рядовой состав на танкеры, балкеры и суда снабжения. Работаем с судовладельцами из ЕС и Азии.' })
  const iAmOwner = members.find((m) => m.id === ME_RECRUITER.id)?.role === 'owner'

  const invite = () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setEmailErr('Проверьте адрес почты')
      return
    }
    r.showToast(`Приглашение отправлено на ${email.trim()}`)
    setEmail('')
    setEmailErr('')
    setInviting(false)
  }

  const cols: Column<Recruiter>[] = [
    {
      key: 'name',
      header: 'Участник',
      width: '34%',
      sortValue: (m) => m.name,
      cell: (m) => (
        <span className="flex items-center gap-3">
          <WebAvatar initials={m.initials} size="sm" />
          <span className="truncate font-medium">
            {m.name}
            {m.id === ME_RECRUITER.id && <span className="font-normal text-muted-foreground"> (вы)</span>}
          </span>
        </span>
      ),
    },
    { key: 'email', header: 'Почта', width: '30%', cell: (m) => <span className="text-muted-foreground">{m.email}</span> },
    {
      key: 'role',
      header: 'Роль',
      width: '14%',
      sortValue: (m) => (m.role === 'owner' ? 0 : 1),
      cell: (m) =>
        m.role === 'owner' ? (
          <span className="flex items-center gap-1.5">
            <Crown className="size-4 text-warning" /> Владелец
          </span>
        ) : (
          'Рекрутер'
        ),
    },
    { key: 'seen', header: 'Был в кабинете', width: '12%', cell: (m) => <span className="text-muted-foreground">{m.lastSeen}</span> },
    {
      key: 'act',
      header: <span className="sr-only">Действия</span>,
      width: '10%',
      align: 'right',
      cell: (m) =>
        iAmOwner && m.role !== 'owner' ? (
          <span className="flex justify-end gap-3 text-sm font-medium">
            <button type="button" onClick={() => setAct({ kind: 'owner', who: m })} className="text-primary">
              Владелец
            </button>
            <button type="button" onClick={() => setAct({ kind: 'remove', who: m })} className="text-muted-foreground hover:text-signal">
              Убрать
            </button>
          </span>
        ) : null,
    },
  ]

  return (
    <WebShell variant="recruiter" active="r-org" go={go}>
      <PageHeader title="Организация" />
      <ViewState loading={{ kind: 'cards' }} empty={{ icon: Users, title: 'Вы не состоите в организации', text: 'Попросите владельца вашей организации снова добавить вас.' }}>
        <div className="mb-8 flex items-center gap-5">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-semibold text-primary-foreground">{RECRUITER_ORG.short}</span>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[22px] leading-tight font-semibold">{org.name}</span>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {RECRUITER_ORG.verified && (
                <span className="flex items-center gap-1.5 text-success">
                  <BadgeCheck className="size-4" /> Проверена командой Seafolio
                </span>
              )}
              <span>
                {org.city}, {org.country}
              </span>
              <span>{org.site}</span>
              <span>
                В Seafolio с <span className="font-mono">{ruDate(RECRUITER_ORG.created)}</span>
              </span>
            </span>
          </div>
        </div>

        <PageTabs<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'members', label: 'Участники', count: members.length },
            { id: 'profile', label: 'Профиль компании' },
          ]}
        />

        {tab === 'members' ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-6">
              <p className="max-w-[640px] text-sm text-muted-foreground">
                {iAmOwner
                  ? 'Вы владелец: приглашаете рекрутеров, убираете их и правите профиль компании. Владелец один, роль можно передать.'
                  : 'Участниками и профилем компании управляет владелец.'}
              </p>
              {iAmOwner && !inviting && (
                <Button onClick={() => setInviting(true)}>
                  <UserPlus /> Пригласить рекрутера
                </Button>
              )}
            </div>
            {inviting && (
              <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
                <WebField id="org-invite" label="Почта рекрутера" error={emailErr} hint="Пришлём ссылку для входа в кабинет" className="w-[360px]">
                  <WebInput id="org-invite" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@bluewave-crewing.example" autoFocus />
                </WebField>
                <div className="mt-[26px] flex gap-2">
                  <Button onClick={invite}>Отправить приглашение</Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setInviting(false)
                      setEmailErr('')
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            )}
            <DataTable columns={cols} rows={members} rowKey={(m) => m.id} initialSort={{ key: 'role', dir: 'asc' }} ignoreView />
          </div>
        ) : (
          <div className="flex max-w-[720px] flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <WebField id="org-name" label="Название" className="col-span-2">
                <WebInput id="org-name" value={org.name} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
              </WebField>
              <WebField id="org-country" label="Страна">
                <WebInput id="org-country" value={org.country} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, country: e.target.value })} />
              </WebField>
              <WebField id="org-city" label="Город">
                <WebInput id="org-city" value={org.city} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, city: e.target.value })} />
              </WebField>
              <WebField id="org-site" label="Сайт" className="col-span-2">
                <WebInput id="org-site" value={org.site} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, site: e.target.value })} />
              </WebField>
              <WebField id="org-about" label="О компании" hint="Моряки видят это на вакансиях агентства" className="col-span-2">
                <WebTextarea id="org-about" value={org.about} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, about: e.target.value })} className="min-h-28" />
              </WebField>
            </div>
            {iAmOwner ? (
              <Button className="self-start" onClick={() => r.showToast('Профиль компании сохранён')}>
                Сохранить
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Изменить профиль может только владелец.</p>
            )}
          </div>
        )}
      </ViewState>

      <ConfirmDialog
        open={!!act}
        onOpenChange={(v) => !v && setAct(null)}
        title={act?.kind === 'owner' ? `Передать роль владельца: ${act.who.name}?` : `Убрать ${act?.who.name} из организации?`}
        text={act?.kind === 'owner' ? 'Вы станете рекрутером и больше не сможете управлять участниками и профилем компании.' : 'Рекрутер потеряет доступ к кабинету. Его вакансии и разговоры останутся у организации.'}
        confirm={act?.kind === 'owner' ? 'Передать роль' : 'Убрать'}
        danger={act?.kind === 'remove'}
        onConfirm={() => {
          if (!act) return
          if (act.kind === 'owner') {
            setMembers((ms) => ms.map((m) => (m.id === act.who.id ? { ...m, role: 'owner' } : m.role === 'owner' ? { ...m, role: 'recruiter' } : m)))
            r.showToast(`Теперь владелец — ${act.who.name}`)
          } else {
            setMembers((ms) => ms.filter((m) => m.id !== act.who.id))
            r.showToast(`${act.who.name} больше не в организации`)
          }
        }}
      />
    </WebShell>
  )
}
