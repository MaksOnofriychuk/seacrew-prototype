import { FileCheck2, FileText } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { SOURCE_LABEL, type Answer } from '@/lib/data-recruiter-2'
import { cn } from '@/lib/utils'

// Строка ответа моряка: «название — значение». Метка источника стоит НАД названием (правка №52, п. 3),
// под значением — чем оно подтверждено («Нужно подтверждение документом»). Общая для r-assignment и вкладки «Анкеты» в карточке кандидата.
export function AnswerRow({ label, a, needsProof, onFile }: { label: string; a?: Answer; needsProof?: boolean; onFile: (name: string) => void }) {
  const lines = a?.value.split('\n') ?? []
  return (
    <div className="grid grid-cols-2 items-start gap-6 border-t border-border py-2.5 first:border-t-0">
      <dt className="flex flex-col gap-0.5">
        {a && <span className={cn('text-xs leading-tight', a.source === 'edited' ? 'text-warning' : 'text-muted-foreground')}>{SOURCE_LABEL[a.source]}</span>}
        <span className="text-[15px] leading-snug">{label}</span>
      </dt>
      <dd className="min-w-0 text-[15px] leading-snug">
        {!a ? (
          <span className="text-muted-foreground">Нет ответа</span>
        ) : a.file ? (
          <button type="button" onClick={() => onFile(a.file!.name)} className="flex items-center gap-2 text-left font-medium text-primary hover:underline">
            <FileText className="size-4 shrink-0" />
            <span className="break-all">{a.file.name}</span>
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
