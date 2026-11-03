import { useState } from 'react'
import { Download, FileCheck2, FileText, Hourglass, MessageSquare } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
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
import { ANSWERS, FORM_DEFS, SOURCE_LABEL, type Answer } from '@/lib/data-recruiter-2'
import { cn } from '@/lib/utils'
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
        <div className="bg-primary px-6 py-3 text-[15px] font-semibold text-primary-foreground">{form.title}</div>
        {sections
          .filter((x) => x.audience === 'SEAFARER')
          .map((sec) => (
            <section key={sec.id} className="border-t border-border px-6 py-5 first:border-t-0">
              <h3 className="mb-2 text-base font-semibold">{sec.title}</h3>
              <dl className="flex flex-col">
                {sec.fields.map((f) => (
                  <AnswerRow key={f.id} label={f.label} a={answers[f.id]} needsProof={f.proof} onFile={view} />
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

function AnswerRow({ label, a, needsProof, onFile }: { label: string; a?: Answer; needsProof?: boolean; onFile: (name: string) => void }) {
  const lines = a?.value.split('\n') ?? []
  return (
    <div className="flex flex-col gap-0.5 border-t border-border py-2.5 first:border-t-0">
      {/* Метка источника — над ответом, справа от названия поля */}
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-[13px] text-muted-foreground">{label}</dt>
        {a && <span className={cn('text-xs whitespace-nowrap', a.source === 'edited' ? 'text-warning' : 'text-muted-foreground')}>{SOURCE_LABEL[a.source]}</span>}
      </div>
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
        {a?.proof && (
          // Поле с отметкой «Нужно подтверждение документом» (ТЗ §9): чем именно подтверждено.
          <span className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted-foreground">
            <FileCheck2 className="size-3.5 shrink-0 text-success" />
            {a.proof.kind === 'library' ? `Подтверждено документом из профиля: ${a.proof.doc}` : `Подтверждено приложенным файлом: ${a.proof.doc}`}
            <button type="button" onClick={() => onFile(a.proof!.file.name)} className="font-medium text-primary hover:underline">
              {a.proof.file.name}
            </button>
          </span>
        )}
        {needsProof && a && !a.proof && <span className="mt-1 block text-[13px] text-warning">Нет подтверждения документом</span>}
      </dd>
    </div>
  )
}
