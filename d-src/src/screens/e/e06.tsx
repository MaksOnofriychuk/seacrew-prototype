import { ShieldCheck } from 'lucide-react'
import { Paper } from '@/components/app/paper'
import { Button } from '@/components/ui/button'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../registry'
import { ErrorLayout, useSupport } from './_error-layout'

// e06 — документ уже прив'язаний до іншого акаунта: один документ — один акаунт (qError('e06') у C).
// Правка №11: захист від повторних акаунтів працює непомітно; спрацював — «Этот документ уже привязан
// к другому аккаунту — свяжитесь с поддержкой». Головна дія — «Написать в поддержку»; «Войти» лишився
// тихою другою дією на випадок, якщо акаунт ваш (екран входу o05). Сам документ — папером, щоб було видно, про який ідеться.
const DOCS = {
  sid: { name: 'Удостоверение личности моряка', num: 'AB 123456' },
  diploma: { name: 'Диплом моряка', num: 'UA-2021-0457' },
}

export function E06DocTaken({ go }: ScreenProps) {
  const { state } = useProto()
  const support = useSupport(go)
  const doc = DOCS[state.docType]

  return (
    <ErrorLayout
      low
      icon={ShieldCheck}
      tone="primary"
      title="Этот документ уже привязан к другому аккаунту"
      text="Свяжитесь с поддержкой."
      onBack={() => go('q03')}
      actions={
        <>
          <Button size="lg" onClick={support}>
            Написать в поддержку
          </Button>
          <Button size="lg" variant="ghost" className="text-primary" onClick={() => go('o05')}>
            Войти
          </Button>
        </>
      }
    >
      <Paper title={doc.name} className="mt-8">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">Номер документа</span>
          <span className="font-mono text-[15px]">{doc.num}</span>
        </div>
      </Paper>
    </ErrorLayout>
  )
}
