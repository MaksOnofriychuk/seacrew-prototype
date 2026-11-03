import { useState } from 'react'
import { Info, Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebInput, WebTextarea } from '@/components/web/fields'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { WebAvatar } from '@/components/web/status-badge'
import { ruDate } from '@/lib/data'
import { jobById, ME_RECRUITER, RECRUITERS, seafarerById } from '@/lib/data-web'
import { CANDIDATES, TODAY, type R1Invite, type R1InviteStatus } from '@/lib/data-recruiter-1'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { InviteDot, useInvites, useSelected, WebDialog } from './_parts'

// r-invitations — запрошення організації (contract-recruiter-web §7; /invitations у коді):
// список зі статусами, скасування тих, що чекають відповіді, «Пригласить по email».
// Запрошення з профілю моряка («Позвать на работу») з'являються тут же.

type Tab = 'all' | R1InviteStatus
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'pending', label: 'Ждут ответа' },
  { id: 'accepted', label: 'Интересно' },
  { id: 'declined', label: 'Отказ' },
  { id: 'cancelled', label: 'Отменено' },
]

// Статус приглашения ставит моряк, когда отвечает в приложении (contract-recruiter-web §7: accept / decline — SEAFARER).
// Рекрутер может только отменить приглашение, пока оно ждёт ответа (POST /org/invitations/:id/cancel).
const TAB_HINT: Record<Tab, string> = {
  all: 'Статус ставит моряк, когда отвечает в приложении. Вы можете только отменить приглашение, пока оно ждёт ответа.',
  pending: 'Моряк ещё не ответил. Пока он думает, приглашение можно отменить.',
  accepted: 'Моряк ответил «Интересно»: он среди кандидатов, открыта переписка. Статус поставил он сам.',
  declined: 'Моряк отказался — статус поставил он сам. Позвать снова можно новым приглашением.',
  cancelled: 'Вы отменили приглашение, пока моряк не ответил.',
}

const EMPTY_TEXT: Record<Tab, string> = {
  all: 'Позовите моряка на работу из поиска или пригласите по email.',
  pending: 'Все ответили. Новые приглашения появятся здесь.',
  accepted: 'Когда моряк подтвердит интерес, он появится здесь и среди кандидатов.',
  declined: 'Отказов нет.',
  cancelled: 'Отменённых приглашений нет.',
}

export function RInvitations({ go }: ScreenProps) {
  const { showToast } = useProto()
  const invites = useInvites()
  const [tab, setTab] = useState<Tab>('all')
  const [emailOpen, setEmailOpen] = useState(false)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [, selectSeafarer] = useSelected('r1.seafarer', 'sf01')
  const [, selectCandidate] = useSelected('r1.candidate', 'sf01')
  const rows = tab === 'all' ? invites.list : invites.list.filter((i) => i.status === tab)
  const count = (t: Tab) => (t === 'all' ? invites.list.length : invites.list.filter((i) => i.status === t).length)

  const columns: Column<R1Invite>[] = [
    {
      key: 'who',
      header: 'Моряк',
      width: '22%',
      sortValue: (i) => (i.seafarerId ? seafarerById(i.seafarerId)!.name : i.email ?? ''),
      cell: (i) => {
        const s = i.seafarerId ? seafarerById(i.seafarerId) : undefined
        return s ? (
          <span className="flex items-center gap-3">
            <WebAvatar initials={s.initials} />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-medium">{s.name}</span>
              <span className="truncate text-[13px] text-muted-foreground">{s.position}</span>
            </span>
          </span>
        ) : (
          <span className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Mail className="size-4" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate">{i.email}</span>
              <span className="truncate text-[13px] text-muted-foreground">по email</span>
            </span>
          </span>
        )
      },
    },
    {
      key: 'job',
      header: 'Вакансия',
      width: '20%',
      cell: (i) => {
        const j = i.jobId ? jobById(i.jobId) : undefined
        return j ? (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate">{j.position}</span>
            <span className="truncate text-[13px] text-muted-foreground">{j.vesselName}</span>
          </span>
        ) : (
          <span className="truncate text-muted-foreground" title={i.message}>
            {i.message ?? 'без вакансии'}
          </span>
        )
      },
    },
    { key: 'by', header: 'Пригласил', width: '15%', sortValue: (i) => RECRUITERS.find((r) => r.id === i.recruiterId)?.name ?? '', cell: (i) => RECRUITERS.find((r) => r.id === i.recruiterId)?.name },
    { key: 'date', header: 'Отправлено', width: '12%', mono: true, sortValue: (i) => i.date, cell: (i) => ruDate(i.date) },
    { key: 'status', header: 'Ответ моряка', width: '13%', sortValue: (i) => i.status, cell: (i) => <InviteDot s={i.status} /> },
    {
      key: 'act',
      header: <span className="sr-only">Действия</span>,
      width: '18%',
      align: 'right',
      cell: (i) =>
        i.status === 'pending' ? (
          <Button
            variant="ghost"
            className="h-9 text-signal hover:text-signal"
            onClick={(e) => {
              e.stopPropagation()
              setCancelId(i.id)
            }}
          >
            Отменить приглашение
          </Button>
        ) : i.status === 'accepted' && i.seafarerId && CANDIDATES.some((c) => c.seafarerId === i.seafarerId) ? (
          <Button
            variant="outline"
            className="h-9 text-primary"
            onClick={(e) => {
              e.stopPropagation()
              selectCandidate(i.seafarerId!)
              go('r-candidate')
            }}
          >
            Кандидат
          </Button>
        ) : null,
    },
  ]

  return (
    <WebShell variant="recruiter" active="r-invitations" go={go}>
      <PageHeader
        title="Приглашения"
        description="Моряк получает приглашение в приложении и отвечает сам одной кнопкой. Подтвердил интерес — появляется среди кандидатов, и открывается переписка."
        actions={
          <Button className="h-10 px-5" onClick={() => setEmailOpen(true)}>
            <Mail /> Пригласить по email
          </Button>
        }
      />
      <PageTabs tabs={TABS.map((t) => ({ ...t, count: count(t.id) }))} value={tab} onChange={setTab} />
      <p className="mb-3 flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {TAB_HINT[tab]}
      </p>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(i) => i.id}
        initialSort={{ key: 'date', dir: 'desc' }}
        onRowClick={(i) => {
          if (!i.seafarerId) return
          selectSeafarer(i.seafarerId)
          go('r-seafarer')
        }}
        empty={{
          icon: Send,
          title: tab === 'all' ? 'Приглашений пока нет' : 'Здесь пусто',
          text: EMPTY_TEXT[tab],
          action:
            tab === 'all' ? (
              <Button variant="outline" className="text-primary" onClick={() => go('r-search')}>
                Найти моряков
              </Button>
            ) : undefined,
        }}
      />

      <EmailDialog
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        onSend={(email, message) => {
          invites.add({ email, message: message || undefined, recruiterId: ME_RECRUITER.id, status: 'pending', date: TODAY })
          setEmailOpen(false)
          setTab('all')
          showToast(`Приглашение отправлено на ${email}`)
        }}
      />

      <WebDialog
        open={cancelId !== null}
        onClose={() => setCancelId(null)}
        title="Отменить приглашение?"
        description="Моряк больше не сможет его принять. Позвать снова можно в любой момент."
        footer={
          <>
            <Button variant="ghost" className="h-10" onClick={() => setCancelId(null)}>
              Не отменять
            </Button>
            <Button
              variant="destructive"
              className="h-10 px-5"
              onClick={() => {
                if (cancelId) invites.setStatus(cancelId, 'cancelled')
                setCancelId(null)
                showToast('Приглашение отменено')
              }}
            >
              Отменить приглашение
            </Button>
          </>
        }
      />
    </WebShell>
  )
}

// «Пригласить по email» — моряк з акаунтом Seafolio на цей email побачить запрошення в застосунку.
function EmailDialog({ open, onClose, onSend }: { open: boolean; onClose: () => void; onSend: (email: string, message: string) => void }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState(false)
  const bad = !/^\S+@\S+\.\S+$/.test(email.trim())
  const close = () => {
    setTouched(false)
    onClose()
  }
  return (
    <WebDialog
      open={open}
      onClose={close}
      title="Пригласить по email"
      description="Моряк увидит приглашение, когда войдёт в приложение с этим email."
      footer={
        <>
          <Button variant="ghost" className="h-10" onClick={close}>
            Отмена
          </Button>
          <Button
            className="h-10 px-5"
            onClick={() => {
              setTouched(true)
              if (bad) return
              onSend(email.trim(), message.trim())
              setEmail('')
              setMessage('')
              setTouched(false)
            }}
          >
            Отправить приглашение
          </Button>
        </>
      }
    >
      <WebField id="ie-email" label="Email моряка" required error={touched && bad ? 'Введите правильный адрес email' : undefined}>
        <WebInput id="ie-email" type="email" autoComplete="off" placeholder="name@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={touched && bad} />
      </WebField>
      <WebField id="ie-msg" label="Сообщение" hint="Необязательно">
        <WebTextarea id="ie-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Несколько слов о вакансии" />
      </WebField>
    </WebDialog>
  )
}
