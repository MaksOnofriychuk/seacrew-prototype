import { useState } from 'react'
import { ExternalLink, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusDot } from '@/components/web/status-badge'
import { ruDate } from '@/lib/data'
import { ASSIGNMENT_STATUS_LABEL, FORMS, type Assignment } from '@/lib/data-web'
import { ANSWERS, FORM_DEFS } from '@/lib/data-recruiter-2'
import { AnswerRow } from '../r2/answer-parts'
import { Fold } from './sf-parts'

// Анкеты кандидата (правка №52, п. 2): список с раскрытием, внутри — ответы моряка строками «название — значение».
// Открыта одна анкета. Ссылок на публичные страницы нет.

const TONE = { submitted: 'success', in_progress: 'warning', sent: 'primary' } as const

export function FormsPanel({ forms, onOpen, onSend, onFile }: { forms: Assignment[]; onOpen: (a: Assignment) => void; onSend: () => void; onFile: (name: string, formTitle: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(forms.find((a) => ANSWERS[a.id])?.id ?? null)
  if (forms.length === 0)
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface px-5 py-4">
        <p className="text-sm text-muted-foreground">Этому кандидату ещё не отправляли анкет.</p>
        <Button variant="outline" className="text-primary" onClick={onSend}>
          Отправить анкету
        </Button>
      </div>
    )
  return (
    <div className="flex flex-col gap-3">
      {forms.map((a) => {
        const f = FORMS.find((x) => x.id === a.formId)!
        const answers = ANSWERS[a.id]
        const sections = (FORM_DEFS[a.formId] ?? []).filter((s) => s.audience === 'SEAFARER')
        return (
          <Fold
            key={a.id}
            open={openId === a.id}
            onToggle={(o) => setOpenId(o ? a.id : null)}
            title={
              <span className="flex items-center gap-3">
                <FileText className="size-4.5 shrink-0 text-primary" />
                <span className="truncate">{f.title}</span>
                <span className="text-[13px] font-normal text-muted-foreground">
                  отправлена <span className="font-mono">{ruDate(a.date)}</span>
                </span>
              </span>
            }
            aside={<StatusDot tone={TONE[a.status]}>{ASSIGNMENT_STATUS_LABEL[a.status]}</StatusDot>}
            flush
          >
            {a.status === 'submitted' && answers ? (
              <div>
                <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-2.5">
                  <span className="text-sm text-muted-foreground">
                    Ответы моряка, <span className="font-mono">{Object.keys(answers).length}</span> полей
                  </span>
                  <Button variant="outline" size="sm" className="text-primary" onClick={() => onOpen(a)}>
                    <ExternalLink /> Открыть ответ целиком
                  </Button>
                </div>
                {sections.map((sec) => (
                  <Fold key={sec.id} level={2} title={sec.title} defaultOpen={false} aside={<span className="font-mono">{sec.fields.filter((x) => answers[x.id]).length}/{sec.fields.length}</span>}>
                    <dl>
                      {sec.fields.map((x) => (
                        <AnswerRow key={x.id} label={x.label} a={answers[x.id]} needsProof={x.proof} onFile={(n) => onFile(n, f.title)} />
                      ))}
                    </dl>
                  </Fold>
                ))}
              </div>
            ) : (
              <p className="px-5 py-3 text-sm text-muted-foreground">
                {a.status === 'in_progress' ? 'Моряк заполняет анкету. Ответы появятся после отправки.' : 'Моряк ещё не открыл анкету. Ответы появятся после отправки.'}
              </p>
            )}
          </Fold>
        )
      })}
    </div>
  )
}
