import { Status } from '@/components/app/status'
import { CheckRow } from '../q/_parts'
import { FORM_TITLE, type Section } from './data'
import { QuestionField } from './fields'
import type { FormState } from './state'

// «Проверка» анкети (як s7 у реєстрації): уся анкета як папір — розділи бланка з рядками, що
// розгортаються (той самий рядок, що й у розділі; правка №42): до відправки їх можна виправити тут же,
// після відправки — лише перегляд. Нижче — «Сохранить в профиль?»: нові й змінені відповіді,
// без позначок нічого не зберігаємо (ADR-051, ADR-073 п. 6.3).

export function FormPaper({
  sections,
  st,
  go,
  readOnly,
  openId,
  onOpen,
}: {
  sections: Section[]
  st: FormState
  go: (id: string) => void
  readOnly?: boolean
  openId: string | null
  onOpen: (id: string | null) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">{FORM_TITLE}</div>
      {sections.map((s) => {
        const issues = readOnly ? 0 : st.sectionIssues(s, true).length
        return (
          <section key={s.id} className="border-t border-border first-of-type:border-t-0">
            <div className="flex items-center gap-3 bg-muted/50 px-4 py-2.5">
              <h2 className="flex-1 text-[15px] font-semibold">{s.title}</h2>
              {!readOnly &&
                (issues ? (
                  <Status kind="warn">
                    <span className="font-mono">{issues}</span> исправить
                  </Status>
                ) : (
                  <Status kind="ok">готово</Status>
                ))}
            </div>
            {s.questions.map((q) => (
              <QuestionField key={q.id} q={q} st={st} go={go} readOnly={readOnly} showError={!readOnly} open={openId === q.id} onToggle={() => onOpen(openId === q.id ? null : q.id)} />
            ))}
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
