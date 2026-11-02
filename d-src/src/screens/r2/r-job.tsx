import { useState, type ReactNode } from 'react'
import { ExternalLink, Eye, Inbox, Pencil } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { useView, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/web/data-table'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { ApplicationStatusDot, JobStatusDot, WebAvatar } from '@/components/web/status-badge'
import { RECRUITERS, salaryText, seafarerById, type Application } from '@/lib/data-web'
import { JOB_EXTRA } from '@/lib/data-recruiter-2'
import type { ScreenProps } from '../registry'
import { BlockHead, ConfirmDialog, plural, ruDate, useR2, ViewBars } from './_parts'

// r-job — вакансія очима рекрутера: умови, опис, вимоги, перегляди (відп. 101) і відгуки.
// Сильний елемент — посада й зарплата; перегляди й відгуки — тихо праворуч.
export function RJob({ go }: ScreenProps) {
  const r = useR2()
  const view = useView()
  const [closing, setClosing] = useState(false)
  const j = r.jobs.find((x) => x.id === r.jobId) ?? r.jobs[0]
  const extra = JOB_EXTRA[j.id] ?? { views: 0, daily: Array(14).fill(0), requirements: '' }
  const apps = r.apps.filter((a) => a.jobId === j.id)
  const week = extra.daily.slice(-7).reduce((s, v) => s + v, 0)
  const recruiter = RECRUITERS.find((x) => x.id === j.recruiterId)

  const facts: [string, ReactNode][] = [
    ['Флот', j.fleet],
    ['Департамент', j.department],
    ['Тип судна', j.vesselType],
    ['Судно', j.vesselName],
    ['Посадка', <span className="font-mono">{ruDate(j.board)}</span>],
    ['Контракт', <MonoNums text={j.duration} />],
    ['Регион', j.region],
  ]

  const openApp = (a: Application) => {
    r.selectApp(a.id)
    go('r-applications')
  }

  const body = (
    <div className="grid grid-cols-[minmax(0,1fr)_400px] gap-10">
      <div className="flex min-w-0 flex-col gap-8">
        <div>
          <p className="text-[28px] leading-tight font-semibold text-primary">
            <MonoNums text={salaryText(j)} />
          </p>
          <dl className="mt-5 grid grid-cols-[repeat(4,minmax(0,1fr))] gap-x-6 gap-y-4 border-t border-border pt-5">
            {facts.map(([l, v]) => (
              <div key={l} className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-sm text-muted-foreground">{l}</dt>
                <dd className="truncate text-[15px] font-medium">{v || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
        <section>
          <BlockHead title="Описание" />
          <p className="max-w-[640px] text-[15px] leading-relaxed">{j.description}</p>
        </section>
        <section>
          <BlockHead title="Требования к моряку" />
          <p className="max-w-[640px] text-[15px] leading-relaxed">{extra.requirements || 'Не указаны.'}</p>
        </section>
      </div>

      <aside className="flex flex-col gap-8">
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="size-4" /> Просмотры
              </span>
              <span className="font-mono text-[28px] leading-none font-semibold">{extra.views}</span>
            </div>
            <ViewBars data={extra.daily} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            За неделю <span className="font-mono text-foreground">{week}</span>, график — последние <span className="font-mono">14</span> дней
          </p>
        </section>

        <section>
          <BlockHead
            title={
              <>
                Отклики <span className="font-mono text-sm font-normal text-muted-foreground">{apps.length}</span>
              </>
            }
            aside={
              <button type="button" onClick={() => go('r-applications')} className="text-sm font-medium text-primary">
                Все отклики
              </button>
            }
          />
          <DataTable
            columns={[
              {
                key: 'who',
                header: 'Моряк',
                cell: (a) => {
                  const s = seafarerById(a.seafarerId)!
                  return (
                    <span className="flex items-center gap-3">
                      <WebAvatar initials={s.initials} size="sm" />
                      <span className="truncate font-medium">{s.name}</span>
                    </span>
                  )
                },
              },
              { key: 'status', header: 'Статус', width: '156px', cell: (a) => <ApplicationStatusDot s={a.status} /> },
            ]}
            rows={apps}
            rowKey={(a) => a.id}
            onRowClick={openApp}
            empty={{ icon: Inbox, title: 'Откликов пока нет', text: 'Отклики появятся здесь и в разделе «Отклики».' }}
          />
        </section>
      </aside>
    </div>
  )

  return (
    <WebShell variant="recruiter" active="r-jobs" go={go}>
      <PageHeader
        back={{ label: 'Вакансии', onClick: () => go('r-jobs') }}
        title={j.position}
        meta={
          <>
            <JobStatusDot s={j.status} />
            <span>
              {j.vesselType}, {j.vesselName}
            </span>
            <span>
              Создана <span className="font-mono">{ruDate(j.created)}</span>
            </span>
            {recruiter && <span>Ведёт {recruiter.name}</span>}
          </>
        }
        actions={
          <>
            {j.status === 'open' && (
              <Button variant="ghost" className="text-primary" onClick={() => go('pub-job')}>
                <ExternalLink /> Открыть публичную страницу
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                r.setEdit(j.id)
                go('r-job-edit')
              }}
            >
              <Pencil /> Редактировать
            </Button>
            {j.status === 'open' && (
              <Button variant="outline" className="text-signal" onClick={() => setClosing(true)}>
                Закрыть вакансию
              </Button>
            )}
            {j.status === 'draft' && (
              <Button
                onClick={() => {
                  r.setJobStatus(j.id, 'open')
                  r.showToast('Вакансия опубликована')
                }}
              >
                Опубликовать
              </Button>
            )}
          </>
        }
      />
      {view === 'empty' ? body : <ViewState loading={{ kind: 'cards' }}>{body}</ViewState>}
      <ConfirmDialog
        open={closing}
        onOpenChange={setClosing}
        title="Закрыть вакансию?"
        text={`Вакансия пропадёт из поиска в приложении. ${apps.length} ${plural(apps.length, 'отклик', 'отклика', 'откликов')} и переписка останутся.`}
        confirm="Закрыть вакансию"
        danger
        onConfirm={() => {
          r.setJobStatus(j.id, 'closed')
          r.showToast('Вакансия закрыта')
        }}
      />
    </WebShell>
  )
}
