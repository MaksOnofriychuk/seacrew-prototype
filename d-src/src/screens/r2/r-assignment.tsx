import { useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown, Download, FileText, Hourglass, MessageSquare } from 'lucide-react'
import { EmptyState, useView, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebField, WebInput, WebSelect, WebTextarea } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { useAttachment } from '@/components/web/web-viewer'
import { WebDatePick } from '@/components/web/web-pickers'
import { addYears, TODAY } from '@/lib/dates'
import { StatusDot } from '@/components/web/status-badge'
import { ASSIGNMENT_STATUS_LABEL, ASSIGNMENTS, FORMS, seafarerById } from '@/lib/data-web'
import { ANSWERS, FORM_DEFS, SOURCE_LABEL } from '@/lib/data-recruiter-2'
import { Fold } from '../r1/sf-parts'
import { AnswerRow } from './answer-parts'
import type { ScreenProps } from '../registry'
import { ASSIGNMENT_TONE, BlockHead, ruDate, useR2 } from './_parts'

// r-assignment — відповідь моряка на анкету: відповіді з джерелом (профіль / змінено / вручну / документи),
// вкладення, поля агентства (бачить лише агентство) і заповнений PDF (contract-recruiter-web §4, §5).
export function RAssignment({ go }: ScreenProps) {
  const r = useR2()
  const state = useView()
  const a = ASSIGNMENTS.find((x) => x.id === r.assignmentId) ?? ASSIGNMENTS[0]
  const s = seafarerById(a.seafarerId)!
  const form = FORMS.find((x) => x.id === a.formId)!
  const sections = FORM_DEFS[a.formId] ?? []
  const answers = ANSWERS[a.id]
  const submitted = a.status === 'submitted' && !!answers
  // Вкладення: файли відповідей і файли, якими моряк підтвердив поля (ТЗ §9), без повторів.
  const files: { key: string; name: string; size: string; how: string }[] = []
  for (const [k, v] of Object.entries(answers ?? {})) {
    if (v.file) files.push({ key: k, name: v.file.name, size: v.file.size, how: SOURCE_LABEL[v.source].toLowerCase() })
    if (v.proof && !files.some((x) => x.name === v.proof!.file.name)) files.push({ key: k + '.proof', name: v.proof.file.name, size: v.proof.file.size, how: 'подтверждение' })
  }
  const seaSections = sections.filter((x) => x.audience === 'SEAFARER')
  const [closed, setClosed] = useState<string[]>([])
  const agency = sections.filter((x) => x.audience === 'AGENCY_ONLY').flatMap((x) => x.fields)
  const [agencyVals, setAgencyVals] = useState<Record<string, string>>({})
  const chat = r.chats.find((c) => c.seafarerId === s.id)

  // Фото и файлы открываются в просмотре (перевірка 03.11, №13); скачать можно и из него, и из списка вложений.
  const att = useAttachment()
  const kindOf = (name: string) => (/\.(jpe?g|png|heic)$/i.test(name) ? 'photo' : 'file')
  const view = (name: string) => att.open(name, kindOf(name), `${s.name}, ${form.title}`)
  const download = (name: string) => r.showToast(`Файл скачан: ${name}`)

  const notYet = <EmptyState icon={Hourglass} title="Моряк ещё не отправил анкету" text="Ответы появятся здесь, когда он её отправит. Напомнить можно в разговоре." />

  const body = !submitted ? (
    notYet
  ) : (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-8">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-4 bg-primary px-5 py-2.5 text-primary-foreground">
          <span className="text-[15px] font-semibold">{form.title}</span>
          <button type="button" onClick={() => setClosed(closed.length ? [] : seaSections.map((x) => x.id))} className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground/90 hover:text-primary-foreground">
            {closed.length ? <ChevronsUpDown className="size-4" /> : <ChevronsDownUp className="size-4" />}
            {closed.length ? 'Развернуть все' : 'Свернуть все'}
          </button>
        </div>
        {seaSections.map((sec) => {
          const got = sec.fields.filter((f) => answers[f.id]).length
          return (
            <Fold
              key={sec.id}
              level={2}
              title={sec.title}
              aside={
                <>
                  <span className="font-mono">{got}</span> из <span className="font-mono">{sec.fields.length}</span>
                </>
              }
              open={!closed.includes(sec.id)}
              onToggle={(o) => setClosed(o ? closed.filter((x) => x !== sec.id) : [...closed, sec.id])}
            >
              <dl className="flex flex-col">
                {sec.fields.map((f) => (
                  <AnswerRow key={f.id} label={f.label} a={answers[f.id]} needsProof={f.proof} onFile={view} />
                ))}
              </dl>
            </Fold>
          )
        })}
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
            {files.map((v) => (
              <li key={v.key} className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
                <button type="button" onClick={() => view(v.name)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{v.name}</span>
                    <span className="text-xs text-muted-foreground">
                      <span className="font-mono">{v.size}</span>, {v.how}
                    </span>
                  </span>
                </button>
                <button type="button" aria-label={`Скачать ${v.name}`} onClick={() => download(v.name)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
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
                    <WebSelect className="data-[size=default]:h-10" id={`ag-${f.id}`} value={agencyVals[f.id] ?? ''} onChange={(v) => setAgencyVals((x) => ({ ...x, [f.id]: v }))} options={['Рекомендован', 'В резерв', 'Не подходит']} />
                  ) : f.type === 'textarea' ? (
                    <WebTextarea id={`ag-${f.id}`} value={agencyVals[f.id] ?? ''} onChange={(e) => setAgencyVals((x) => ({ ...x, [f.id]: e.target.value }))} className="min-h-20" />
                  ) : f.type === 'date' ? (
                    <WebDatePick id={`ag-${f.id}`} value={agencyVals[f.id] ?? ''} onChange={(v) => setAgencyVals((x) => ({ ...x, [f.id]: v }))} min={new Date(2025, 0, 1)} max={addYears(TODAY, 3)} />
                  ) : (
                    <WebInput id={`ag-${f.id}`} value={agencyVals[f.id] ?? ''} onChange={(e) => setAgencyVals((x) => ({ ...x, [f.id]: e.target.value }))} />
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
        title={s.name}
        description={`${s.position}. Ответ на анкету «${form.title}»`}
        meta={
          <>
            <StatusDot tone={ASSIGNMENT_TONE[a.status]}>{ASSIGNMENT_STATUS_LABEL[a.status]}</StatusDot>
            <span className="font-mono">{ruDate(a.date)}</span>
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
            {submitted && state === 'normal' && (
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
      {att.node}
    </WebShell>
  )
}
