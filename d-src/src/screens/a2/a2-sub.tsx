import { useState } from 'react'
import { CalendarPlus, ChevronDown, Crown, Receipt, UserRound } from 'lucide-react'
import { Paper } from '@/components/app/paper'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebField, WebSelect, WebTextarea } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { StatusDot, WebAvatar } from '@/components/web/status-badge'
import { SUB_PLAN_LABEL, SUB_SOURCE_LABEL, SUB_STATE_LABEL, money, type SubEvent } from '@/lib/data-admin-2'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { AdminPage, CancelButton, Facts, Mono, Note, SectionTitle, SideSheet, dt, useBagState } from '../a/_parts'
import { SUB_TONE, useSubs } from './a2-subs'

const TODAY = '2026-11-02'
const TERMS = [
  { days: 7, label: '7 дней' },
  { days: 30, label: 'Месяц' },
  { days: 90, label: '3 месяца' },
]
const REASONS = ['Оплата прошла, премиум не включился', 'Компенсация за сбой', 'Участник бета-теста', 'Другое']

function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const DOT: Record<SubEvent['kind'], string> = {
  trial: 'bg-primary/45',
  pay: 'bg-primary',
  renew: 'bg-primary',
  promo: 'bg-success',
  invite: 'bg-success',
  manual: 'bg-success',
  notice: 'bg-border',
  expired: 'bg-muted-foreground/60',
  cancel: 'bg-warning',
  refund: 'bg-signal',
}

export function A2Sub({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [id] = useBagState('a2.sub', 's-104')
  const [, setUser] = useBagState('a.user', 'u02')
  const [, setPayQ] = useBagState('a2.payQ', '')
  const [subs, patch] = useSubs()
  const [over] = useBagState<Record<string, { until: string; state: string; events: SubEvent[] }>>('a2.subOver', {})
  const s = subs.find((x) => x.id === id) ?? subs[0]
  const [open, setOpen] = useState(false)
  const [days, setDays] = useState(30)
  const [reason, setReason] = useState(REASONS[0])
  const [comment, setComment] = useState('')
  const [allHistory, setAllHistory] = useState(false)

  const base = s.until > TODAY ? s.until : TODAY
  const newUntil = addDays(base, days)
  const history = [...s.history].sort((a, b) => (a.at < b.at ? 1 : -1))
  const shownHistory = allHistory ? history : history.slice(0, 5)

  const extend = () => {
    const ev: SubEvent = {
      at: `${TODAY} ${new Date().toTimeString().slice(0, 5)}`,
      kind: 'manual',
      text: `Продлена вручную на ${TERMS.find((t) => t.days === days)?.label.toLowerCase()}: ${reason.toLowerCase()}${comment.trim() ? `. ${comment.trim()}` : ''}`,
      who: 'Команда Seafolio',
    }
    patch(s.id, { until: newUntil, state: 'active', events: [...(over[s.id]?.events ?? []), ev] })
    showToast(`Премиум продлён до ${dt(newUntil)}`)
    setOpen(false)
    setComment('')
  }

  return (
    <AdminPage active="a2-subs" go={go}>
      <PageHeader
        back={{ label: 'Подписки моряков', onClick: () => go('a2-subs') }}
        title={
          <span className="flex items-center gap-4">
            <WebAvatar initials={s.initials} size="lg" className="border border-border bg-surface" />
            {s.name}
          </span>
        }
        meta={
          <>
            <StatusDot tone={SUB_TONE[s.state]}>{SUB_STATE_LABEL[s.state]}</StatusDot>
            <span>{s.position}</span>
          </>
        }
      />

      <ViewState empty={{ icon: Crown, title: 'У моряка нет премиума', text: 'Он ни разу не оплачивал и не получал пробную неделю.' }} loading={{ kind: 'cards', rows: 2 }}>
        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6">
          <div className="flex min-w-0 flex-col">
            <Paper title={`Премиум, ${SUB_PLAN_LABEL[s.plan].toLowerCase()}`}>
              <Facts
                className="py-1"
                items={[
                  ['Откуда', SUB_SOURCE_LABEL[s.source]],
                  ['Номер подписки', <Mono key="n">{s.id.toUpperCase()}</Mono>],
                  ['Начало', <Mono key="a">{dt(s.started)}</Mono>],
                  [s.state === 'ended' ? 'Закончилась' : 'Действует до', <Mono key="u">{dt(s.until)}</Mono>],
                  ['Автопродление', s.state === 'ended' ? 'Нет' : s.autoRenew ? 'Включено у моряка' : 'Выключено'],
                  ['Оплачено всего', s.paid ? <Mono key="p">{money(s.paid)}</Mono> : 'Ничего — премиум бесплатный'],
                ]}
              />
            </Paper>

            <SectionTitle>История</SectionTitle>
            <ol className="relative flex flex-col rounded-xl border border-border bg-surface px-6 py-2">
              {shownHistory.map((e, i) => (
                <li key={e.at + i} className="relative flex gap-4 py-3.5">
                  {i < shownHistory.length - 1 && <span className="absolute top-8 bottom-[-14px] left-[5px] w-px bg-border" aria-hidden="true" />}
                  <span className={cn('mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-surface', DOT[e.kind])} aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[15px]">{e.text}</span>
                    <span className="text-sm text-muted-foreground">
                      <Mono>{dt(e.at)}</Mono>
                      {e.who && <>, {e.who}</>}
                    </span>
                  </span>
                  {e.amount !== undefined && <Mono className={cn('shrink-0 pt-0.5 text-[15px]', e.amount < 0 && 'text-signal')}>{money(e.amount)}</Mono>}
                </li>
              ))}
            </ol>
            {history.length > 5 && (
              <button type="button" aria-expanded={allHistory} onClick={() => setAllHistory(!allHistory)} className="mt-2 flex h-10 items-center justify-center gap-1.5 rounded-md text-sm font-medium text-primary hover:bg-muted">
                {allHistory ? 'Свернуть' : `Показать все события (${history.length})`}
                <ChevronDown className={cn('size-4 transition-transform', allHistory && 'rotate-180')} />
              </button>
            )}
          </div>

          <aside className="sticky top-0 flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">{s.state === 'ended' ? 'Вернуть премиум' : 'Продлить'}</h2>
            <p className="text-[15px] text-muted-foreground">
              {s.state === 'ended'
                ? 'Премиум выключен. Если моряк заплатил, а подписка не включилась, — включите вручную.'
                : 'Ручное продление добавит дни к текущему сроку. Деньги не списываются, магазин о нём не узнает.'}
            </p>
            <Button size="lg" onClick={() => setOpen(true)}>
              <CalendarPlus /> Продлить вручную
            </Button>
            <div className="flex flex-col gap-1 border-t border-border pt-4">
              <Button
                variant="ghost"
                className="justify-start px-2 text-primary"
                onClick={() => {
                  setPayQ(s.name)
                  go('a2-payments')
                }}
              >
                <Receipt /> Платежи моряка
              </Button>
              <Button
                variant="ghost"
                className="justify-start px-2 text-primary"
                onClick={() => {
                  if (s.userId) {
                    setUser(s.userId)
                    go('a-user')
                  } else showToast('Профиль этого моряка не входит в демо-данные')
                }}
              >
                <UserRound /> Профиль моряка
              </Button>
            </div>
          </aside>
        </div>
      </ViewState>

      <SideSheet
        open={open}
        onOpenChange={setOpen}
        title="Продлить премиум вручную"
        description={`${s.name}. Моряку придёт уведомление, что премиум продлён.`}
        footer={
          <>
            <CancelButton onClick={() => setOpen(false)} />
            <Button onClick={extend}>Продлить до {dt(newUntil)}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">На сколько</span>
          <div role="radiogroup" aria-label="На сколько" className="grid grid-cols-3 gap-2">
            {TERMS.map((t) => (
              <button
                key={t.days}
                type="button"
                role="radio"
                aria-checked={days === t.days}
                onClick={() => setDays(t.days)}
                className={cn('h-10 rounded-md border text-sm font-medium transition-colors', days === t.days ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <WebField id="sub-reason" label="Причина">
          <WebSelect id="sub-reason" value={reason} onChange={setReason} options={REASONS} />
        </WebField>
        <WebField id="sub-comment" label="Комментарий" hint="Видно только команде, в истории подписки.">
          <WebTextarea id="sub-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Например: номер оплаты в App Store" />
        </WebField>
        <Note>
          Сейчас {s.state === 'ended' ? 'премиум выключен' : <>действует до <Mono>{dt(s.until)}</Mono></>}. После продления — до <Mono>{dt(newUntil)}</Mono>.
        </Note>
      </SideSheet>
    </AdminPage>
  )
}
