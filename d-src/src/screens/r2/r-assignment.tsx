import { useState } from 'react'
import { Download, FileText, Hourglass, MessageSquare } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { EmptyState, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebField, WebInput, WebSelect, WebTextarea } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { StatusDot } from '@/components/web/status-badge'
import { ASSIGNMENT_STATUS_LABEL, ASSIGNMENTS, FORMS, seafarerById } from '@/lib/data-web'
import { ANSWERS, FORM_DEFS, SOURCE_LABEL, type Answer } from '@/lib/data-recruiter-2'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { ASSIGNMENT_TONE, BlockHead, ruDate, useR2 } from './_parts'

// r-assignment — відповідь моряка на анкету: відповіді з джерелом (профіль / змінено / вручну / документи),
// вкладення, поля агентства (бачить лише агентство) і заповнений PDF (contract-recruiter-web §4, §5).
export function RAssignment({ go }: ScreenProps) {
  const r = useR2()
  const a = ASSIGNMENTS.find((x) => x.id === r.assignmentId) ?? ASSIGNMENTS[0]
  const s = seafarerById(a.seafarerId)!
  const form = FORMS.find((x) => x.id === a.formId)!
  const sections = FORM_DEFS[a.formId] ?? []
  const answers = ANSWERS[a.id]
  const submitted = a.status === 'submitted' && !!answers
  const files = answers ? Object.entries(answers).filter(([, v]) => v.file) : []
  const agency = sections.filter((x) => x.audience === 'AGENCY_ONLY').flatMap((x) => x.fields)
  const [agencyVals, setAgencyVals] = useState<Record<string, string>>({})
  const chat = r.chats.find((c) => c.seafarerId === s.id)

  const download = (name: string) => r.showToast(`Скачиваем ${name}`)

  const notYet = <EmptyState icon={Hourglass} title="Моряк ещё не отправил анкету" text="Ответы появятся здесь, когда он её отправит. Напомнить можно в разговоре." />

  const body = !submitted ? (
    notYet
  ) : (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-8">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between bg-primary px-6 py-3 text-primary-foreground">
          <span className="text-[15px] font-semibold">{form.title}</span>
          <span className="text-sm opacity-80">
            {s.name}, <span className="font-mono">{ruDate(a.date)}</span>
          </span>
        </div>
        {sections
          .filter((x) => x.audience === 'SEAFARER')
          .map((sec) => (
            <section key={sec.id} className="border-t border-border px-6 py-5 first:border-t-0">
              <h3 className="mb-2 text-base font-semibold">{sec.title}</h3>
              <dl className="flex flex-col">
                {sec.fields.map((f) => (
                  <AnswerRow key={f.id} label={f.label} a={answers[f.id]} onFile={download} />
                ))}
              </dl>
            </section>
          ))}
      </div>

      <aside className="flex flex-col gap-8">
        <section>
          <BlockHead
            title={
              <>
                Вложения <span className="font-mono text-sm font-normal text-muted-foreground">{files.length}</span>
              </>
            }
          />
          <ul className="overflow-hidden rounded-xl border border-border bg-surface">
            {files.map(([k, v]) => (
              <li key={k} className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
                <FileText className="size-4 shrink-0 text-primary" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{v.file!.name}</span>
                  <span className="text-xs text-muted-foreground">
                    <span className="font-mono">{v.file!.size}</span>, {SOURCE_LABEL[v.source].toLowerCase()}
                  </span>
                </span>
                <button type="button" aria-label={`Скачать ${v.file!.name}`} onClick={() => download(v.file!.name)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                  <Download className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {agency.length > 0 && (
          <section className="rounded-xl border border-border bg-surface p-5">
            <BlockHead title="Поля агентства" className="mb-1" />
            <p className="mb-4 text-sm text-muted-foreground">Их видит только ваше агентство, моряк не получает.</p>
            <div className="flex flex-col gap-4">
              {agency.map((f) => (
                <WebField key={f.id} id={`ag-${f.id}`} label={f.label}>
                  {f.type === 'select' ? (
                    <WebSelect id={`ag-${f.id}`} value={agencyVals[f.id] ?? ''} onChange={(v) => setAgencyVals((x) => ({ ...x, [f.id]: v }))} options={['Рекомендован', 'В резерв', 'Не подходит']} />
                  ) : f.type === 'textarea' ? (
                    <WebTextarea id={`ag-${f.id}`} value={agencyVals[f.id] ?? ''} onChange={(e) => setAgencyVals((x) => ({ ...x, [f.id]: e.target.value }))} className="min-h-20" />
                  ) : (
                    <WebInput id={`ag-${f.id}`} type={f.type === 'date' ? 'date' : 'text'} value={agencyVals[f.id] ?? ''} onChange={(e) => setAgencyVals((x) => ({ ...x, [f.id]: e.target.value }))} className={cn(f.type === 'date' && 'font-mono')} />
                  )}
                </WebField>
              ))}
              <Button variant="outline" className="self-start" onClick={() => r.showToast('Поля агентства сохранены')}>
                Сохранить поля агентства
              </Button>
            </div>
          </section>
        )}
      </aside>
    </div>
  )

  return (
    <WebShell variant="recruiter" active="r-forms" go={go}>
      <PageHeader
        back={{ label: 'Анкеты', onClick: () => go('r-forms') }}
        title={`${s.name}, ${form.title}`}
        meta={
          <>
            <StatusDot tone={ASSIGNMENT_TONE[a.status]}>{ASSIGNMENT_STATUS_LABEL[a.status]}</StatusDot>
            <span>
              {a.status === 'submitted' ? 'Получена' : 'Отправлена'} <span className="font-mono">{ruDate(a.date)}</span>
            </span>
            <span>{s.position}</span>
          </>
        }
        actions={
          <>
            {chat && (
              <Button
                variant="outline"
                onClick={() => {
                  r.openChat(chat.id)
                  go('r-chat')
                }}
              >
                <MessageSquare /> Написать
              </Button>
            )}
            {submitted && (
              <Button onClick={() => download(`${form.title} — ${s.name}.pdf`)}>
                <Download /> Скачать заполненный PDF
              </Button>
            )}
          </>
        }
      />
      <ViewState loading={{ kind: 'cards' }} empty={notYet}>
        {body}
      </ViewState>
    </WebShell>
  )
}

function AnswerRow({ label, a, onFile }: { label: string; a?: Answer; onFile: (name: string) => void }) {
  const lines = a?.value.split('\n') ?? []
  return (
    <div className="grid grid-cols-[220px_minmax(0,1fr)_auto] items-baseline gap-4 border-t border-border py-2.5 first:border-t-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-[15px]">
        {!a ? (
          <span className="text-muted-foreground">Нет ответа</span>
        ) : a.file ? (
          <button type="button" onClick={() => onFile(a.file!.name)} className="flex items-center gap-2 text-left font-medium text-primary">
            <FileText className="size-4 shrink-0" />
            {a.file.name}
          </button>
        ) : lines.length > 1 ? (
          <ol className="flex flex-col gap-1">
            {lines.map((l, i) => (
              <li key={i} className="flex gap-2">
                <span className="w-4 shrink-0 font-mono text-sm text-muted-foreground">{i + 1}</span>
                {l}
              </li>
            ))}
          </ol>
        ) : (
          <MonoNums text={a.value} />
        )}
      </dd>
      <span className={cn('text-xs whitespace-nowrap', a?.source === 'edited' ? 'text-warning' : 'text-muted-foreground')}>{a ? SOURCE_LABEL[a.source] : ''}</span>
    </div>
  )
}
