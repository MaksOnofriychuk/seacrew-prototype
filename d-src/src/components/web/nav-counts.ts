import { useProto } from '@/lib/proto-state'
import { A_JOBS, A_POSTS, A_USERS, type AJob, type APost, type AUser } from '@/lib/data-admin'
import { REPORTS, VERIFY_REQS, type Report, type VerifyReq } from '@/lib/data-admin-2'
import { R1_INVITES, type R1Invite } from '@/lib/data-recruiter-1'
import { CHATS } from '@/lib/data-recruiter-2'
import { ADMIN_ORGS, APPLICATIONS, type ApplicationStatus, type OrgStatus } from '@/lib/data-web'

// Счётчики бокового меню считаются из данных прототипа и тех же ключей bag, которыми пользуются экраны:
// решили заявку, закрыли жалобу, прочли чат — число в меню меняется.
export type NavCountKey = 'invitations' | 'applications' | 'messages' | 'orgs' | 'verify' | 'users' | 'jobs' | 'posts' | 'reports'

export function useNavCounts(): Partial<Record<NavCountKey, number>> {
  const { bag } = useProto()

  const invites = bag<R1Invite[]>('r1.invites', R1_INVITES)
  const appStatus = bag<Record<string, ApplicationStatus>>('r2.appStatus', {})
  const read = bag<string[]>('r2.read', [])
  const orgOver = bag<Record<string, OrgStatus>>('a.orgStatus', {})
  const verifyDec = bag<Record<string, Partial<VerifyReq>>>('a2.verify', {})
  const userOver = bag<Record<string, Partial<Pick<AUser, 'status'>>>>('a.userOver', {})
  const jobs = bag<AJob[]>('a.jobs', A_JOBS)
  const posts = bag<APost[]>('a.posts', A_POSTS)
  const reports = bag<Report[]>('a2.reports', REPORTS)

  return {
    invitations: invites.filter((i) => i.status === 'pending').length,
    applications: APPLICATIONS.filter((a) => (appStatus[a.id] ?? a.status) === 'sent').length,
    messages: CHATS.reduce((n, c) => n + (read.includes(c.id) ? 0 : c.unread), 0),
    orgs: ADMIN_ORGS.filter((o) => (orgOver[o.id] ?? o.status) === 'pending').length,
    verify: VERIFY_REQS.filter((r) => (verifyDec[r.id]?.state ?? r.state) === 'pending').length,
    users: A_USERS.filter((u) => (userOver[u.id]?.status ?? u.status) !== 'active').length,
    jobs: jobs.filter((j) => j.state === 'review').length,
    posts: posts.filter((p) => p.state === 'complaint').length,
    reports: reports.filter((r) => r.state === 'open').length,
  }
}
