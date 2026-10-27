import { useState } from 'react'
import { Status } from '@/components/app/status'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from '../registry'
import { FlowScreen, Footer, QSheet, Title, useToast, useQ } from './_parts'

// q10 — згоди: кожна зберігається з версією тексту й часом; «Отозвать» — так само просто, як дати.
type Key = 'terms' | 'data' | 'med'

export function Q10Consents({ go }: ScreenProps) {
  const { bag, setBag } = useQ()
  const revoked = bag<Partial<Record<Key, boolean>>>('q.revoked', {})
  const medConsent = bag('q.medConsent', false)
  const [ask, setAsk] = useState<Key | null>(null)
  const { toast, toastNode } = useToast()

  const list: { k: Key; title: string; ver?: string; verb?: string; date?: string; none?: string; given: boolean }[] = [
    { k: 'terms', title: 'Условия сервиса и Политика конфиденциальности', ver: 'Версия 1.0', verb: 'принято', date: '25.10.2026', given: true },
    { k: 'data', title: 'Обработка документов, включая чтение ИИ', ver: 'Версия 1.0', verb: 'дано', date: '25.10.2026', given: true },
    medConsent
      ? { k: 'med', title: 'Медицинские документы', ver: 'Версия 1.0', verb: 'дано', date: '25.10.2026', given: true }
      : { k: 'med', title: 'Медицинские документы', none: 'Не дано — спросим на шаге «Медицинские документы»', given: false },
  ]

  const doRevoke = () => {
    if (!ask) return
    setBag('q.revoked', { ...revoked, [ask]: true })
    if (ask === 'med') setBag('q.medConsent', false)
    setAsk(null)
    toast('Согласие отозвано')
  }

  const regrant = (k: Key) => {
    const next = { ...revoked }
    delete next[k]
    setBag('q.revoked', next)
    if (k === 'med') setBag('q.medConsent', true)
    toast('Согласие дано снова')
  }

  return (
    <FlowScreen
      onBack={() => go('q09')}
      footer={
        <Footer>
          <Button size="lg" variant="outline" onClick={() => toast('Копию данных отправим на ваш email')}>
            Скачать мои данные
          </Button>
        </Footer>
      }
      overlay={
        <>
          {toastNode}
          <QSheet
            open={ask !== null}
            onClose={() => setAsk(null)}
            title="Отозвать согласие?"
            description="Мы перестанем обрабатывать данные по этому согласию. Дать его снова можно в любой момент — на этом же экране."
          >
            <div className="flex flex-col gap-3">
              <Button size="lg" variant="outline" className="border-signal text-signal hover:text-signal" onClick={doRevoke}>
                Отозвать согласие
              </Button>
              <Button size="lg" variant="ghost" className="text-primary" onClick={() => setAsk(null)}>
                Отмена
              </Button>
            </div>
          </QSheet>
        </>
      }
    >
      <Title sub="Любое согласие можно отозвать — так же просто, как дать.">Согласия</Title>

      <ul className="mt-7 rounded-xl border border-border bg-surface">
        {list.map((x) => {
          const off = !!revoked[x.k]
          const given = x.given && !off
          return (
            <li key={x.k} className="flex flex-col gap-2 border-t border-border px-4 py-4 first:border-t-0">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[15px] font-medium">{x.title}</span>
                {given ? <Status kind="ok">дано</Status> : <Status>{off ? 'отозвано' : 'не дано'}</Status>}
              </div>
              <p className="text-sm text-muted-foreground">
                {off ? (
                  'Согласие отозвано. Мы не обрабатываем данные по нему.'
                ) : x.ver ? (
                  <>
                    {x.ver}, {x.verb} <span className="font-mono">{x.date}</span>
                  </>
                ) : (
                  x.none
                )}
              </p>
              {given ? (
                <Button variant="outline" className="mt-1 h-10 self-start text-signal hover:text-signal" onClick={() => setAsk(x.k)}>
                  Отозвать согласие
                </Button>
              ) : off ? (
                <Button variant="outline" className="mt-1 h-10 self-start text-primary" onClick={() => regrant(x.k)}>
                  Дать согласие снова
                </Button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </FlowScreen>
  )
}
