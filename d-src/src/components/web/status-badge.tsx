import type { ReactNode } from 'react'
import { AVAIL_OPTIONS, availLabel, type Availability } from '@/lib/data'
import type { ApplicationStatus, InvitationStatus, JobStatus, OrgStatus, UserStatus } from '@/lib/data-web'
import { APPLICATION_STATUS_LABEL, INVITATION_STATUS_LABEL, JOB_STATUS_LABEL, ORG_STATUS_LABEL } from '@/lib/data-web'
import { cn } from '@/lib/utils'

// Статуси у вебі — тихо: кольорова крапка і текст, без пігулок. Кольори — токени брифу.
export type Tone = 'success' | 'warning' | 'error' | 'primary' | 'muted'

const DOT: Record<Tone, string> = { success: 'bg-success', warning: 'bg-warning', error: 'bg-signal', primary: 'bg-primary', muted: 'bg-muted-foreground/50' }

export function StatusDot({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm whitespace-nowrap', tone === 'muted' ? 'text-muted-foreground' : 'text-foreground', className)}>
      <span className={cn('size-2 shrink-0 rounded-full', DOT[tone])} aria-hidden="true" />
      {children}
    </span>
  )
}

export const APPLICATION_TONE: Record<ApplicationStatus, Tone> = { sent: 'primary', waiting: 'warning', match: 'success', rejected: 'error' }
export const INVITATION_TONE: Record<InvitationStatus, Tone> = { pending: 'warning', accepted: 'success', declined: 'muted' }
export const JOB_TONE: Record<JobStatus, Tone> = { open: 'success', draft: 'muted', closed: 'muted' }
export const ORG_TONE: Record<OrgStatus, Tone> = { pending: 'warning', verified: 'success', rejected: 'muted', blocked: 'error' }
export const USER_TONE: Record<UserStatus, Tone> = { active: 'success', blocked: 'error', banned: 'error' }

export const ApplicationStatusDot = ({ s }: { s: ApplicationStatus }) => <StatusDot tone={APPLICATION_TONE[s]}>{APPLICATION_STATUS_LABEL[s]}</StatusDot>
export const InvitationStatusDot = ({ s }: { s: InvitationStatus }) => <StatusDot tone={INVITATION_TONE[s]}>{INVITATION_STATUS_LABEL[s]}</StatusDot>
export const JobStatusDot = ({ s }: { s: JobStatus }) => <StatusDot tone={JOB_TONE[s]}>{JOB_STATUS_LABEL[s]}</StatusDot>
export const OrgStatusDot = ({ s }: { s: OrgStatus }) => <StatusDot tone={ORG_TONE[s]}>{ORG_STATUS_LABEL[s]}</StatusDot>

// Статус доступності моряка (три статуси, правки №1, №15, №19, №20). short — «С 01.12.2026» замість повного тексту.
export function AvailabilityDot({ a, short = false }: { a: Availability; short?: boolean }) {
  const tone: Tone = a.kind === 'not' ? 'muted' : 'success'
  const date = a.kind === 'from' && a.date ? a.date.split('-').reverse().join('.') : ''
  if (short) {
    const text = a.kind === 'now' ? 'Готов сейчас' : a.kind === 'from' ? 'С ' : 'Не ищет работу'
    return (
      <StatusDot tone={tone}>
        {text}
        {date && <span className="font-mono">{date}</span>}
      </StatusDot>
    )
  }
  return (
    <StatusDot tone={tone}>
      {a.kind === 'from' ? (
        <span>
          {AVAIL_OPTIONS[1].label} <span className="font-mono">{date}</span>
        </span>
      ) : (
        availLabel(a)
      )}
    </StatusDot>
  )
}

// Аватар у вебі — лише ініціали (рекрутер фото моряка не бачить, правка №30).
export function WebAvatar({ initials, size = 'md', className }: { initials: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-primary',
        size === 'sm' && 'size-7 text-[11px]',
        size === 'md' && 'size-9 text-xs',
        size === 'lg' && 'size-16 text-xl font-semibold',
        className,
      )}
    >
      {initials}
    </span>
  )
}
