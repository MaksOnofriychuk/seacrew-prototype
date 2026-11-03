import { useState } from 'react'
import { SearchX, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { FilterBar } from '@/components/web/filter-bar'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { ApplicationStatusDot, StatusDot, WebAvatar } from '@/components/web/status-badge'
import { ruDate } from '@/lib/data'
import { APPLICATIONS, ASSIGNMENT_STATUS_LABEL, jobById, seafarerById } from '@/lib/data-web'
import { assignmentsOf, CANDIDATES, chatOf, lastActivity, type Candidate } from '@/lib/data-recruiter-1'
import type { ScreenProps } from '../types'
import { useR2 } from '../r2/_parts'
import { useSelected } from './_parts'

// r-candidates — моряки, з якими є контакт: відгукнулися на вакансію або підтвердили інтерес до запрошення
// (правка №22; /candidates у коді). Рядок → картка кандидата.

export function RCandidates({ go }: ScreenProps) {
  const [, select] = useSelected('r1.candidate', 'sf01')
  const { chats } = useR2()
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const rows = CANDIDATES.filter((c) => {
    if (!needle) return true
    const j = jobById(c.jobId ?? '')
    return [seafarerById(c.seafarerId)!.name, seafarerById(c.seafarerId)!.position, j?.position ?? '', j?.vesselName ?? ''].some((t) => t.toLowerCase().includes(needle))
  })

  const columns: Column<Candidate>[] = [
    {
      key: 'name',
      header: 'Кандидат',
      width: '20%',
      sortValue: (c) => seafarerById(c.seafarerId)!.name,
      cell: (c) => {
        const s = seafarerById(c.seafarerId)!
        return (
          <span className="flex items-center gap-3">
            <WebAvatar initials={s.initials} />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-medium">{s.name}</span>
              <span className="truncate text-[13px] text-muted-foreground">{s.position}</span>
            </span>
          </span>
        )
      },
    },
    {
      key: 'job',
      header: 'Вакансия',
      width: '20%',
      sortValue: (c) => jobById(c.jobId ?? '')?.position ?? '',
      cell: (c) => {
        const j = jobById(c.jobId ?? '')
        return j ? (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate">{j.position}</span>
            <span className="truncate text-[13px] text-muted-foreground">{j.vesselName}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      key: 'via',
      header: 'Как связались',
      width: '15%',
      sortValue: (c) => c.via,
      cell: (c) => {
        const a = APPLICATIONS.find((x) => x.seafarerId === c.seafarerId && x.jobId === c.jobId)
        return (
          <span className="flex flex-col gap-0.5 leading-tight">
            <span>{c.via === 'invitation' ? 'Приглашение' : 'Отклик'}</span>
            {c.via === 'invitation' ? <StatusDot tone="success">Интересно</StatusDot> : a && <ApplicationStatusDot s={a.status} />}
          </span>
        )
      },
    },
    {
      key: 'form',
      header: 'Анкета',
      width: '14%',
      cell: (c) => {
        const a = assignmentsOf(c.seafarerId)[0]
        if (!a) return <span className="text-muted-foreground">не отправляли</span>
        return <StatusDot tone={a.status === 'submitted' ? 'success' : a.status === 'in_progress' ? 'warning' : 'primary'}>{ASSIGNMENT_STATUS_LABEL[a.status]}</StatusDot>
      },
    },
    {
      key: 'last',
      header: 'Переписка',
      width: '17%',
      sortValue: (c) => lastActivity(chats, c).sort,
      cell: (c) => {
        const conv = chatOf(chats, c)
        if (!conv) return <span className="text-muted-foreground">переписки нет</span>
        return (
          <span className="flex items-center gap-2">
            <span className="font-mono">{lastActivity(chats, c).text}</span>
            {conv.unread > 0 && <span className="rounded-full bg-primary px-1.5 font-mono text-xs leading-5 text-primary-foreground" aria-label={`Непрочитанных: ${conv.unread}`}>{conv.unread}</span>}
          </span>
        )
      },
    },
    { key: 'since', header: 'Контакт с', width: '14%', mono: true, sortValue: (c) => c.since, cell: (c) => ruDate(c.since) },
  ]

  return (
    <WebShell variant="recruiter" active="r-candidates" go={go}>
      <PageHeader
        title="Кандидаты"
        description="Моряки, с которыми есть контакт: откликнулись на вакансию или приняли ваше приглашение."
        actions={
          <Button variant="outline" className="h-10 text-primary" onClick={() => go('r-search')}>
            Найти моряков
          </Button>
        }
      />
      <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Имя, должность, вакансия' }} count={needle ? rows.length : undefined} />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.seafarerId}
        initialSort={{ key: 'last', dir: 'desc' }}
        onRowClick={(c) => {
          select(c.seafarerId)
          go('r-candidate')
        }}
        empty={
          needle
            ? { icon: SearchX, title: 'Никого не нашли', text: 'Измените запрос.' }
            : {
          icon: Users,
          title: 'Кандидатов пока нет',
          text: 'Моряки появятся здесь, когда откликнутся на вакансию или примут приглашение.',
          action: (
            <Button className="h-10" onClick={() => go('r-search')}>
              Найти моряков
            </Button>
          ),
        }
        }
      />
    </WebShell>
  )
}
