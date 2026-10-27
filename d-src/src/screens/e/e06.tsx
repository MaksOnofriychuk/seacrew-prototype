import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Paper } from '@/components/app/paper'
import { Button } from '@/components/ui/button'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../registry'
import { ErrorLayout, LoginSheet, useToast } from './_error-layout'

// e06 — документ уже прив'язаний до іншого акаунта: один документ — один акаунт (qError('e06') у C).
// Показуємо сам документ папером, щоб було видно, про який ідеться. Дії: «Войти» (вікно входу) і
// «Восстановить доступ» (повідомлення, як recover у C).
const DOCS = {
  sid: { name: 'Удостоверение личности моряка', num: 'AB 123456' },
  diploma: { name: 'Диплом моряка', num: 'UA-2021-0457' },
}

export function E06DocTaken({ go }: ScreenProps) {
  const { state } = useProto()
  const [login, setLogin] = useState(false)
  const [toast, setToast] = useToast()
  const doc = DOCS[state.docType]
  const recover = () => {
    setLogin(false)
    setToast('Ссылка для восстановления отправлена')
  }

  return (
    <>
      <ErrorLayout
        icon={ShieldCheck}
        tone="primary"
        title="Этот документ уже зарегистрирован"
        text="Войдите или восстановите доступ."
        onBack={() => go('q03')}
        toast={toast}
        actions={
          <>
            <Button size="lg" onClick={() => setLogin(true)}>
              Войти
            </Button>
            <Button size="lg" variant="outline" onClick={recover}>
              Восстановить доступ
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
      <LoginSheet
        open={login}
        onOpenChange={setLogin}
        onLogin={() => {
          setLogin(false)
          go('q09')
        }}
        onRecover={recover}
      />
    </>
  )
}
