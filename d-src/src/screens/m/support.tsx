import { useState } from 'react'
import { Check, Copy, ImagePlus, LifeBuoy, X } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { Footer, NavBar } from '@/components/app/chrome'
import { Status } from '@/components/app/status'
import { Button } from '@/components/ui/button'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { useQ } from '../q/_parts'
import type { Acct } from '../q/q06'
import { SettingsGroup, SettingsRow, hashParam } from './_parts'

// m-support — «Поддержка» (правка №12, відповідь 125): головна дія — «Написать в поддержку».
// Сюди ж веде заблокований акаунт (№12): #m-support?topic=blocked одразу відкриває лист з темою «Аккаунт заблокирован».

const TOPICS = ['Аккаунт заблокирован', 'Документы', 'Вакансии и отклики', 'Другое'] as const
type Ticket = { title: string; date: string; open: boolean }

export function MSupport({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useProto()
  const email = useQ().bag<Acct | null>('q.acct', null)?.email || 'you@example.com'
  const tickets = bag<Ticket[]>('support.tickets', [{ title: 'Не загружается диплом', date: '28.10', open: false }])
  const blocked = hashParam('topic') === 'blocked'
  const [open, setOpen] = useState(blocked)
  const [topic, setTopic] = useState<string | null>(blocked ? TOPICS[0] : null)
  const [text, setText] = useState('')
  const [shot, setShot] = useState(false)

  const send = () => {
    setBag('support.tickets', [{ title: topic ?? 'Другое', date: 'сегодня', open: true }, ...tickets])
    setOpen(false)
    setText('')
    setShot(false)
    showToast(`Сообщение отправлено. Ответим на ${email}`)
  }

  return (
    <div className="flex h-full flex-col">
      <NavBar onBack={() => go(bag<string>('back.m-support', 'p04'))} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-6">
        <div className="px-2">
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Поддержка</h1>
          <p className="mt-3 text-base text-muted-foreground">Опишите, что случилось. Ответ придёт на {email}.</p>
        </div>

        <SettingsGroup title="Мои обращения" className="mt-8">
          {tickets.map((t, i) => (
            <SettingsRow
              key={i}
              title={t.title}
              sub={
                t.date === 'сегодня' ? (
                  'Отправлено сегодня'
                ) : (
                  <>
                    Отправлено <span className="font-mono">{t.date}</span>
                  </>
                )
              }
              right={t.open ? <Status kind="current">ждёт ответа</Status> : <Status kind="ok">решено</Status>}
            />
          ))}
        </SettingsGroup>

        <SettingsGroup title="Почта поддержки">
          <SettingsRow title="support@seafolio.example" onClick={() => showToast('Адрес скопирован')} right={<Copy className="size-4 shrink-0 text-muted-foreground" />} />
        </SettingsGroup>
      </div>
      <Footer>
        <Button size="lg" onClick={() => setOpen(true)}>
          <LifeBuoy /> Написать в поддержку
        </Button>
      </Footer>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Написать в поддержку"
        footer={
          <Button size="lg" disabled={!topic || !text.trim()} onClick={send}>
            Отправить
          </Button>
        }
      >
        <p className="text-[15px] font-medium">Тема</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={topic === t}
              onClick={() => setTopic(t)}
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors',
                topic === t ? 'border-primary bg-muted font-medium text-primary' : 'border-border text-foreground',
              )}
            >
              {topic === t && <Check className="size-3.5" strokeWidth={2.5} />}
              {t}
            </button>
          ))}
        </div>
        <label htmlFor="sup-text" className="mt-5 text-[15px] font-medium">
          Что случилось
        </label>
        <textarea
          id="sup-text"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={topic === TOPICS[0] ? 'Например: загрузил не тот документ два раза' : 'Пара предложений о проблеме'}
          className="mt-2 resize-none rounded-md border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        {shot ? (
          <span className="mt-3 flex h-11 items-center gap-3 rounded-md bg-muted px-3 text-sm">
            <ImagePlus className="size-4 text-primary" />
            <span className="flex-1 font-mono">screenshot.png</span>
            <button type="button" aria-label="Убрать скриншот" onClick={() => setShot(false)} className="text-muted-foreground">
              <X className="size-4" />
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setShot(true)} className="mt-3 flex h-11 items-center gap-2 self-start text-[15px] font-medium text-primary">
            <ImagePlus className="size-5" /> Прикрепить скриншот
          </button>
        )}
      </BottomSheet>
    </div>
  )
}
