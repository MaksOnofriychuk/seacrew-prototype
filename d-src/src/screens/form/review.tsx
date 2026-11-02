import { AlertTriangle, ChevronRight } from 'lucide-react'
import { Status } from '@/components/app/status'
import { cn } from '@/lib/utils'
import { CheckRow } from '../q/_parts'
import { FORM_TITLE, rowMissing, type Question, type Section } from './data'
import { sourceText } from './fields'
import type { FormState } from './state'

// «Проверка» анкети (як s7 у реєстрації): уся анкета як папір — розділи бланка з відповідями й
// джерелами; тап по розділу — повернутися й виправити. Нижче — «Сохранить в профиль?»:
// нові й змінені відповіді, без позначок нічого не зберігаємо (ADR-051, ADR-073 п. 6.3).

function valueText(q: Question, st: FormState): string {
  const a = st.answers[q.id]
  if (q.kind === 'photo') return a ? (a.src === 'manual' ? 'photo_3x4.jpg' : 'Фото 3×4') : ''
  if (q.kind === 'consent') return a ? 'Согласен / согласна' : ''
  if (q.kind === 'signature') return a?.v && st.answers[q.id + '.ok'] ? a.v : ''
  return a?.v ?? ''
}

export function FormPaper({ sections, st, onOpen }: { sections: Section[]; st: FormState; onOpen?: (i: number) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">{FORM_TITLE}</div>
      {sections.map((s, i) => {
        const issues = onOpen ? st.sectionIssues(s, true).length : 0
        const head = (
          <>
            <h2 className="flex-1 text-base font-semibold">{s.title}</h2>
            {onOpen &&
              (issues ? (
                <Status kind="warn">
                  <span className="font-mono">{issues}</span> исправить
                </Status>
              ) : (
                <Status kind="ok">готово</Status>
              ))}
            {onOpen && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
          </>
        )
        return (
          <section key={s.id} className="border-t border-border first-of-type:border-t-0">
            {onOpen ? (
              <button type="button" onClick={() => onOpen(i)} className="flex w-full items-center gap-3 px-5 pt-4 text-left">
                {head}
              </button>
            ) : (
              <div className="flex items-center gap-3 px-5 pt-4">{head}</div>
            )}
            <dl className="flex flex-col gap-3 px-5 pt-3 pb-5">
              {s.questions.map((q) => (
                <div key={q.id} className="flex flex-col gap-0.5">
                  <dt className="text-sm text-muted-foreground">{q.label}</dt>
                  {q.kind === 'table' ? (
                    <dd className="flex flex-col gap-1.5">
                      {(st.rows?.list ?? []).map((r) => {
                        const miss = rowMissing(r)
                        return (
                          <span key={r.id} className="flex flex-col">
                            <span className="text-[15px]">
                              {r.vessel}, <span className="font-mono text-sm">{r.period}</span>
                            </span>
                            <span className="text-sm text-muted-foreground">{[r.type, r.rank, r.engine].filter(Boolean).join(', ')}</span>
                            {miss.length > 0 && (
                              <span className="flex items-center gap-1.5 text-sm text-foreground">
                                <AlertTriangle className="size-3.5 text-warning" /> Неполная запись, в черновике
                              </span>
                            )}
                          </span>
                        )
                      })}
                      {!st.rows?.list.length && <span className="text-[15px] text-muted-foreground">—</span>}
                    </dd>
                  ) : (
                    <dd className={cn('text-[15px]', q.mono && 'font-mono text-sm', !valueText(q, st) && 'text-muted-foreground')}>{valueText(q, st) || '—'}</dd>
                  )}
                  {q.kind !== 'table' && q.kind !== 'consent' && q.kind !== 'signature' && valueText(q, st) && (
                    <dd className="text-xs text-muted-foreground">
                      {sourceText(q, st.answers[q.id])?.text}
                      {q.proof && st.proof[q.id] && ', подтверждение прикреплено'}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </section>
        )
      })}
    </div>
  )
}

export function SaveToProfile({ st }: { st: FormState }) {
  if (!st.saveCandidates.length) return null
  const on = (id: string) => st.save.includes(id)
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">Сохранить в профиль?</h2>
      <p className="text-sm text-muted-foreground">Этих ответов нет в профиле или они отличаются от него. Отметьте, что сохранить. Без отметки ответ уйдёт только в эту анкету.</p>
      <ul className="mt-1 overflow-hidden rounded-xl border border-border bg-surface">
        {st.saveCandidates.map((q) => {
          const a = st.answers[q.id]
          const was = a?.base !== undefined ? q.sources[a.base]?.value : null
          return (
            <li key={q.id} className="border-t border-border px-4 py-3 first:border-t-0">
              <CheckRow id={`save-${q.id}`} checked={on(q.id)} onChange={(v) => st.setSave(v ? [...st.save, q.id] : st.save.filter((x) => x !== q.id))}>
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{q.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {q.kind === 'table' ? 'Изменённые и новые записи добавятся к контрактам профиля' : was ? `${a.v}. В профиле: ${was}` : `${a.v}. В профиле пока нет`}
                  </span>
                </span>
              </CheckRow>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
