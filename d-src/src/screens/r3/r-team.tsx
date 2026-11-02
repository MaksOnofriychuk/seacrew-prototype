import { useState } from 'react'
import { Check, Crown, Minus, UserPlus, Users } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebInput, WebSelect } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { WebAvatar } from '@/components/web/status-badge'
import { PERMISSIONS, SEATS, TEAM, TEAM_INVITES, TODAY_R3, type TeamInvite, type TeamMember } from '@/lib/data-recruiter-3'
import { ME_RECRUITER, RECRUITER_ROLE_LABEL, type RecruiterRole } from '@/lib/data-web'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { WebDialog } from '../r1/_parts'
import { ConfirmDialog } from '../r2/_parts'
import { ExampleMark, ruDate } from './_parts'

type Act = { kind: 'owner' | 'remove'; who: TeamMember } | null

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Администратор' },
  { value: 'recruiter', label: 'Рекрутер' },
]

const plus7 = (iso: string) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

// r-team — «Команда»: кілька рекрутерів у компанії і ролі (відп. 141 — без відповіді, ПРИКЛАД).
// Розгорнута версія вкладки «Участники» з r-org: роль міняється тут же, запрошення, що чекають, місця за тарифом,
// таблиця «що може кожна роль». Ролі: Владелец (один), Администратор (проміжна роль — відкрите питання AC6), Рекрутер.
export function RTeam({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useProto()
  const members = bag<TeamMember[]>('r3.team', TEAM)
  const invites = bag<TeamInvite[]>('r3.teamInvites', TEAM_INVITES)
  const setMembers = (m: TeamMember[]) => setBag('r3.team', m)
  const setInvites = (i: TeamInvite[]) => setBag('r3.teamInvites', i)
  const [act, setAct] = useState<Act>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<RecruiterRole>('recruiter')
  const [emailErr, setEmailErr] = useState('')
  const iAmOwner = members.find((m) => m.id === ME_RECRUITER.id)?.role === 'owner'
  const used = members.length + invites.length
  const full = used >= SEATS

  const sendInvite = () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setEmailErr('Проверьте адрес почты')
      return
    }
    setInvites([{ id: `ti-${invites.length + 2}`, email: email.trim(), role, sent: TODAY_R3, expires: plus7(TODAY_R3) }, ...invites])
    showToast(`Приглашение отправлено на ${email.trim()}`)
    setInviteOpen(false)
    setEmail('')
    setEmailErr('')
    setRole('recruiter')
  }

  const cols: Column<TeamMember>[] = [
    {
      key: 'name',
      header: 'Участник',
      width: '30%',
      sortValue: (m) => m.name,
      cell: (m) => (
        <span className="flex items-center gap-3">
          <WebAvatar initials={m.initials} size="sm" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium">
              {m.name}
              {m.id === ME_RECRUITER.id && <span className="font-normal text-muted-foreground"> (вы)</span>}
            </span>
            <span className="truncate text-[13px] text-muted-foreground">{m.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Роль',
      width: '20%',
      sortValue: (m) => ({ owner: 0, admin: 1, recruiter: 2 })[m.role],
      cell: (m) =>
        m.role === 'owner' ? (
          <span className="flex h-9 items-center gap-1.5">
            <Crown className="size-4 text-warning" /> Владелец
          </span>
        ) : iAmOwner ? (
          <span onClick={(e) => e.stopPropagation()} className="block w-[170px]">
            <WebSelect
              value={m.role}
              onChange={(v) => {
                setMembers(members.map((x) => (x.id === m.id ? { ...x, role: v as RecruiterRole } : x)))
                showToast(`${m.name}: ${RECRUITER_ROLE_LABEL[v as RecruiterRole].toLowerCase()}`)
              }}
              options={ROLE_OPTIONS}
              className="h-9 data-[size=default]:h-9"
            />
          </span>
        ) : (
          RECRUITER_ROLE_LABEL[m.role]
        ),
    },
    { key: 'jobs', header: 'Вакансии', width: '9%', align: 'right', mono: true, sortValue: (m) => m.jobs, cell: (m) => m.jobs },
    { key: 'chats', header: 'Переписки', width: '9%', align: 'right', mono: true, sortValue: (m) => m.chats, cell: (m) => m.chats },
    { key: 'seen', header: 'Активность', width: '11%', cell: (m) => <span className="text-muted-foreground">{m.lastSeen}</span> },
    {
      key: 'act',
      header: <span className="sr-only">Действия</span>,
      width: '21%',
      align: 'right',
      cell: (m) =>
        iAmOwner && m.role !== 'owner' ? (
          <span className="flex justify-end gap-4 text-sm font-medium">
            <button type="button" onClick={() => setAct({ kind: 'owner', who: m })} className="text-primary">
              Сделать владельцем
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
      <PageHeader
        back={{ label: 'Организация', onClick: () => go('r-org') }}
        title={
          <span className="flex items-center gap-3">
            Команда <ExampleMark />
          </span>
        }
        description="Все рекрутеры работают с одной базой вакансий, откликов и анкет компании. Роли — пример: какие нужны агентствам, ещё уточняем."
        actions={
          iAmOwner && (
            <Button className="h-10" disabled={full} onClick={() => setInviteOpen(true)}>
              <UserPlus /> Пригласить рекрутера
            </Button>
          )
        }
      />

      <ViewState
        loading={{ kind: 'table' }}
        empty={{ icon: Users, title: 'Вы пока один в команде', text: 'Пригласите коллег: каждый войдёт в кабинет по своей почте.', action: (
            <Button
              onClick={() => {
                go('r-team')
                setInviteOpen(true)
              }}
            >
              Пригласить рекрутера
            </Button>
          ), }}
      >
        <div className="mb-4 flex items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground">
            Занято мест: <span className="font-mono text-foreground">{used}</span> из <span className="font-mono">{SEATS}</span>, с учётом приглашений.{' '}
            {full ? 'Чтобы добавить ещё, смените тариф.' : ''}
          </p>
          <button type="button" onClick={() => go('r-billing')} className="text-sm font-medium text-primary hover:underline">
            Тариф и места
          </button>
        </div>

        <DataTable columns={cols} rows={members} rowKey={(m) => m.id} initialSort={{ key: 'role', dir: 'asc' }} ignoreView />

        {invites.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">Ждут ответа</h2>
            <ul className="overflow-hidden rounded-xl border border-border bg-surface">
              {invites.map((i) => (
                <li key={i.id} className="grid grid-cols-[1fr_150px_200px_auto] items-center gap-6 border-t border-border px-4 py-3 text-sm first:border-t-0">
                  <span className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                      <UserPlus className="size-3.5" />
                    </span>
                    {i.email}
                  </span>
                  <span>{RECRUITER_ROLE_LABEL[i.role]}</span>
                  <span className="text-muted-foreground">
                    действует до <span className="font-mono">{ruDate(i.expires)}</span>
                  </span>
                  {iAmOwner ? (
                    <span className="flex justify-end gap-4 font-medium">
                      <button type="button" className="text-primary" onClick={() => showToast(`Приглашение отправлено ещё раз на ${i.email}`)}>
                        Отправить ещё раз
                      </button>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-signal"
                        onClick={() => {
                          setInvites(invites.filter((x) => x.id !== i.id))
                          showToast('Приглашение отменено')
                        }}
                      >
                        Отменить
                      </button>
                    </span>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 max-w-[880px]">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-base font-semibold">Что может каждая роль</h2>
            <ExampleMark />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[13px] text-muted-foreground">
                <th className="py-2 font-normal" />
                {(['owner', 'admin', 'recruiter'] as const).map((r) => (
                  <th key={r} className="w-[150px] py-2 text-center font-normal">
                    {RECRUITER_ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p.label} className="border-b border-border last:border-b-0">
                  <td className="py-2.5">{p.label}</td>
                  {([p.owner, p.admin, p.recruiter] as const).map((v, i) => (
                    <td key={i} className="py-2.5 text-center">
                      {v ? <Check className="inline size-4 text-success" aria-label="Да" /> : <Minus className="inline size-4 text-muted-foreground/60" aria-label="Нет" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-muted-foreground">Владелец в компании один — тот, кто её зарегистрировал. Роль можно передать.</p>
        </section>
      </ViewState>

      <WebDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Пригласить рекрутера"
        description="Пришлём ссылку для входа в кабинет. Приглашение действует 7 дней."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Отмена
            </Button>
            <Button onClick={sendInvite}>Отправить приглашение</Button>
          </>
        }
      >
        <WebField id="team-email" label="Почта" error={emailErr} required>
          <WebInput id="team-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@bluewave-crewing.example" autoFocus />
        </WebField>
        <WebField id="team-role" label="Роль" hint={role === 'admin' ? 'Видит всю работу компании, управляет командой и верификацией.' : 'Работает со своими вакансиями, откликами и перепиской.'}>
          <WebSelect id="team-role" value={role} onChange={(v) => setRole(v as RecruiterRole)} options={ROLE_OPTIONS} />
        </WebField>
      </WebDialog>

      <ConfirmDialog
        open={!!act}
        onOpenChange={(v) => !v && setAct(null)}
        title={act?.kind === 'owner' ? `Передать роль владельца: ${act.who.name}?` : `Убрать ${act?.who.name} из команды?`}
        text={act?.kind === 'owner' ? 'Вы станете администратором: тариф, оплата и передача роли перейдут к новому владельцу.' : 'Рекрутер потеряет доступ к кабинету. Его вакансии и переписка останутся у компании.'}
        confirm={act?.kind === 'owner' ? 'Передать роль' : 'Убрать'}
        danger={act?.kind === 'remove'}
        onConfirm={() => {
          if (!act) return
          if (act.kind === 'owner') {
            setMembers(members.map((m) => (m.id === act.who.id ? { ...m, role: 'owner' } : m.role === 'owner' ? { ...m, role: 'admin' } : m)))
            showToast(`Теперь владелец — ${act.who.name}`)
          } else {
            setMembers(members.filter((m) => m.id !== act.who.id))
            showToast(`${act.who.name} больше не в команде`)
          }
        }}
      />
    </WebShell>
  )
}
