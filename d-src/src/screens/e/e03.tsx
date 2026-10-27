import { FileText, IdCard, Loader2, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../registry'
import { ErrorLayout } from './_error-layout'

// e03 — немає мережі (qError('e03') у C). Файли не губляться, повтор іде сам.
// Показуємо, що саме збережено, і тихий рядок очікування; «Повторить сейчас» → q04 (go-read).
export function E03Offline({ go }: ScreenProps) {
  const { state } = useProto()
  const doc = state.docType === 'diploma' ? 'Диплом моряка' : 'Удостоверение личности моряка'
  const files = [
    { icon: FileText, name: 'CV_Andrii_Koval.pdf' },
    { icon: IdCard, name: doc },
  ]

  return (
    <ErrorLayout
      icon={WifiOff}
      tone="warning"
      title="Нет интернета"
      text="Загруженные файлы сохранены. Продолжим сами, как только связь появится."
      onBack={() => go('q03')}
      actions={
        <Button size="lg" variant="outline" onClick={() => go('q04')}>
          Повторить сейчас
        </Button>
      }
    >
      <ul className="mt-8 rounded-xl border border-border bg-surface px-4">
        {files.map((f) => (
          <li key={f.name} className="flex items-center gap-4 border-t border-border py-3 first:border-t-0">
            <f.icon className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            <span className="min-w-0 flex-1 text-[15px]">{f.name}</span>
            <Badge variant="success">сохранён</Badge>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex items-center gap-3 text-[15px] text-muted-foreground" role="status">
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
        Ждём подключение…
      </p>
    </ErrorLayout>
  )
}
