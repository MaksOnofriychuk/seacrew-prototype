import { useState, type ReactNode } from 'react'
import { Check, CircleCheck, EyeOff, UserRoundX } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { Paper } from '@/components/app/paper'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebField, WebSelect, WebTextarea } from '@/components/web/fields'
import { PageHeader, WebCard } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { AvailabilityDot, WebAvatar } from '@/components/web/status-badge'
import { ruDate } from '@/lib/data'
import { jobById, ME_RECRUITER, seafarerById, WEB_JOBS, type WebSeafarer } from '@/lib/data-web'
import { contractsFor, monthsText, TODAY } from '@/lib/data-recruiter-1'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { useInvites, useSelected, WebDialog } from './_parts'

// r-seafarer — профіль моряка очима рекрутера (правка №30, строго за переліком).
// Бачить: «Andrii K.», досвід у місяцях, сертифікати, національність, найближчий аеропорт, візи, дипломи,
// медицину, «о себе», готовність, посаду, характеристики/промоушени — лише галочка.
// Не бачить: прізвище, контакти, фото, файли документів. Мовні рівні й інше поза переліком не показуємо.
// Правка №34: якщо моряк сховав загальний стаж — лише стаж по кожному контракту.
// «Позвать на работу» → вікно з вакансією й повідомленням → «Приглашение отправлено» (запит іде моряку в «Рабочие», №22).

export function RSeafarer({ go }: ScreenProps) {
  const [id] = useSelected('r1.seafarer', 'sf01')
  const s = seafarerById(id) ?? seafarerById('sf01')!
  const invites = useInvites()
  const [, selectCandidate] = useSelected('r1.candidate', 'sf01')
  const [inviteOpen, setInviteOpen] = useState(false)
  const live = invites.list.find((i) => i.seafarerId === s.id && (i.status === 'pending' || i.status === 'accepted'))

  const actions = !live ? (
    <Button className="h-10 px-5" onClick={() => setInviteOpen(true)}>
      Позвать на работу
    </Button>
  ) : live.status === 'pending' ? (
    <>
      <span className="flex items-center gap-2 text-sm font-medium">
        <CircleCheck className="size-4.5 text-success" />
        Приглашение отправлено
      </span>
      <Button variant="outline" className="ml-3 h-10 text-primary" onClick={() => go('r-invitations')}>
        Все приглашения
      </Button>
    </>
  ) : (
    <>
      <span className="flex items-center gap-2 text-sm font-medium">
        <CircleCheck className="size-4.5 text-success" />
        Моряку интересно
      </span>
      <Button
        variant="outline"
        className="ml-3 h-10 text-primary"
        onClick={() => {
          selectCandidate(s.id)
          go('r-candidate')
        }}
      >
        Карточка кандидата
      </Button>
    </>
  )

  const liveJob = live?.jobId ? jobById(live.jobId) : undefined

  return (
    <WebShell variant="recruiter" active="r-search" go={go}>
      <ViewState
        loading={{ kind: 'cards' }}
        empty={{ icon: UserRoundX, title: 'Профиль недоступен', text: 'Моряк скрыл профиль или удалил аккаунт.', action: <Button variant="outline" className="text-primary" onClick={() => go('r-search')}>К поиску</Button> }}
      >
        <PageHeader
          back={{ label: 'Поиск моряков', onClick: () => go('r-search') }}
          title={
            <span className="flex items-center gap-4">
              <WebAvatar initials={s.initials} size="lg" className="border border-border bg-surface" />
              <span className="flex flex-col gap-1">
                {s.name}
                <span className="text-[15px] font-normal tracking-normal text-muted-foreground">
                  {s.position}, {s.fleet} / {s.department}
                </span>
              </span>
            </span>
          }
          actions={actions}
        />

        {live && (
          <p className="-mt-2 mb-6 text-sm text-muted-foreground">
            Приглашение от <span className="font-mono">{ruDate(live.date)}</span>
            {liveJob && <> на вакансию {liveJob.position}, {liveJob.vesselName}</>}.{' '}
            {live.status === 'pending' ? 'Моряк увидит его в уведомлениях и ответит одной кнопкой.' : 'Моряк подтвердил интерес, переписка открыта.'}
          </p>
        )}

        <div className="grid grid-cols-[1fr_380px] items-start gap-6">
          <div className="flex min-w-0 flex-col gap-6">
            <Documents s={s} />
            <Experience s={s} />
          </div>
          <div className="flex flex-col gap-6">
            <WebCard>
              <dl className="flex flex-col gap-4 text-sm">
                <Fact label="Готовность">
                  <AvailabilityDot a={s.availability} />
                </Fact>
                <Fact label="Должность">{s.position}</Fact>
                <Fact label="Флот и департамент">
                  {s.fleet} / {s.department}
                </Fact>
                <Fact label="Национальность">{s.nationality}</Fact>
                <Fact label="Ближайший аэропорт">{s.airport}</Fact>
                <Fact label="Характеристики, промоушены">
                  {s.promotions ? (
                    <span className="flex items-center gap-1.5">
                      <Check className="size-4 text-success" /> Есть
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Не указаны</span>
                  )}
                </Fact>
              </dl>
            </WebCard>
            <WebCard title="О себе">
              <p className="text-[15px] leading-relaxed">{s.about}</p>
            </WebCard>
            <p className="flex items-start gap-2.5 px-1 text-sm text-muted-foreground">
              <EyeOff className="mt-0.5 size-4 shrink-0" />
              Фамилию, контакты, фото и файлы документов агентства не видят. Копии документов моряк присылает сам.
            </p>
          </div>
        </div>
      </ViewState>

      <InviteDialog
        s={s}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSend={(jobId, message) => {
          invites.add({ seafarerId: s.id, jobId, message, recruiterId: ME_RECRUITER.id, status: 'pending', date: TODAY })
          setInviteOpen(false)
        }}
      />
    </WebShell>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

// Документи — один «папір»: назви й строки, без файлів (№30).
function Documents({ s }: { s: WebSeafarer }) {
  return (
    <Paper title="Документы моряка" className="[&>div:last-child]:p-0">
      <DocSection title="Дипломы" count={s.diplomas.length} empty="Не указаны">
        {s.diplomas.map((d) => (
          <DocRow key={d}>{d}</DocRow>
        ))}
      </DocSection>
      <DocSection title="Сертификаты" count={s.certificates.length} empty="Не указаны">
        {s.certificates.map((c) => (
          <DocRow key={c}>{c}</DocRow>
        ))}
      </DocSection>
      <DocSection title="Медицина" empty="Не указана">
        {s.medical && (
          <DocRow aside={<>до <span className="font-mono">{ruDate(s.medical.until)}</span></>}>{s.medical.title}</DocRow>
        )}
      </DocSection>
      <DocSection title="Визы" count={s.visas.length} empty="Нет виз">
        {s.visas.map((v) => (
          <DocRow key={v}>{v}</DocRow>
        ))}
      </DocSection>
    </Paper>
  )
}

function DocSection({ title, count, empty, children }: { title: string; count?: number; empty: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : []
  return (
    <section className="grid grid-cols-[180px_1fr] gap-6 border-t border-border px-6 py-4 first:border-t-0">
      <h3 className="flex items-baseline gap-2 text-sm font-medium">
        {title}
        {!!count && <span className="font-mono text-xs text-muted-foreground">{count}</span>}
      </h3>
      {items.length ? <ul className="flex flex-col gap-2">{children}</ul> : <p className="text-sm text-muted-foreground">{empty}</p>}
    </section>
  )
}

function DocRow({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <li className="flex items-baseline justify-between gap-4 text-sm">
      <span>{children}</span>
      {aside && <span className="shrink-0 text-muted-foreground">{aside}</span>}
    </li>
  )
}

// Стаж у місяцях. Сховав загальний (№34) — лише рядки контрактів.
function Experience({ s }: { s: WebSeafarer }) {
  const rows = contractsFor(s.id)
  const hidden = s.experienceMonths === null
  return (
    <WebCard
      title="Опыт работы"
      aside={
        hidden ? (
          <span className="text-sm text-muted-foreground">Общий стаж скрыт</span>
        ) : (
          <span className="flex items-baseline gap-2 text-sm text-muted-foreground">
            всего <span className="text-xl font-medium text-foreground"><MonoNums text={monthsText(s.experienceMonths!)} /></span>
          </span>
        )
      }
    >
      {hidden && <p className="mb-4 text-sm text-muted-foreground">Моряк скрыл общий стаж. Агентствам виден стаж по каждому контракту.</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[13px] text-muted-foreground">
            <th className="w-16 pb-2 font-normal">Год</th>
            <th className="pb-2 font-normal">Должность</th>
            <th className="pb-2 font-normal">Тип судна</th>
            <th className="pb-2 text-right font-normal">Стаж</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={i} className="border-t border-border">
              <td className="py-2.5 font-mono text-muted-foreground">{c.year}</td>
              <td className="py-2.5">{c.position}</td>
              <td className="py-2.5">{c.vesselType}</td>
              <td className="py-2.5 text-right"><MonoNums text={monthsText(c.months)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </WebCard>
  )
}

// «Позвать на работу»: вакансія + повідомлення. Моряк отримає запит у «Рабочих» сповіщеннях (№22).
function InviteDialog({ s, open, onClose, onSend }: { s: WebSeafarer; open: boolean; onClose: () => void; onSend: (jobId: string, message: string) => void }) {
  const { showToast } = useProto()
  const jobs = WEB_JOBS.filter((j) => j.status === 'open')
  const first = s.name.split(' ')[0]
  const [jobId, setJobId] = useState(() => jobs.find((j) => j.position === s.position)?.id ?? '')
  const job = jobById(jobId)
  const [message, setMessage] = useState<string | null>(null)
  const text = message ?? (job ? `Здравствуйте, ${first}! Ищем ${job.position} на ${job.vesselType}, посадка ${ruDate(job.board)}. Интересно?` : '')

  return (
    <WebDialog
      open={open}
      onClose={onClose}
      title="Позвать на работу"
      description={`${s.name}, ${s.position}`}
      footer={
        <>
          <Button variant="ghost" className="h-10" onClick={onClose}>
            Отмена
          </Button>
          <Button
            className="h-10 px-5"
            disabled={!job}
            onClick={() => {
              onSend(jobId, text)
              showToast('Приглашение отправлено')
            }}
          >
            Отправить приглашение
          </Button>
        </>
      }
    >
      <WebField id="inv-job" label="Вакансия" required>
        <WebSelect
          id="inv-job"
          value={jobId}
          onChange={(v) => {
            setJobId(v)
            setMessage(null)
          }}
          placeholder="Выберите вакансию"
          options={jobs.map((j) => ({ value: j.id, label: `${j.position}, ${j.vesselName}` }))}
        />
      </WebField>
      <WebField id="inv-msg" label="Сообщение" hint="Моряк увидит предложение в уведомлениях и ответит одной кнопкой. Ответит — откроется чат.">
        <WebTextarea id="inv-msg" rows={4} value={text} onChange={(e) => setMessage(e.target.value)} placeholder="Несколько слов о вакансии" />
      </WebField>
    </WebDialog>
  )
}
